# Refactor simulations.js for better structure
_Exported on 10/14/2025 at 03:33:24 GMT+3 from Cursor (1.7.39)_

---

**User**

let's clean up simulations.js a little bit

to make things go as smooth as possible, let's create a similar file named simulations1.js first. it should mostly resemble the original file, but common functionality of classes FullSearchSimulation and QuadTreeSimulation are moved to a separate parent class called CollisionSimulation. long story short, i want you to do sth like:

// before
class Mersedes { drive() honk() beCool() }
class Volvo { drive() honk() imSuperSafeBtw() }
 
//after
class Car { drive() honk() }
class Mersedes(Car) { beCool() }
class Volvo(Car) { imSuperSafeBtw() }

---

**Cursor**

I'll help you refactor the `simulations.js` file by creating a new `simulations1.js` with a parent class `CollisionSimulation` that contains the common functionality. Let me first examine the current file to understand the structure and identify the shared code.


Now I'll create a todo list to track the refactoring process and then create the new `simulations1.js` file with the parent class structure.


After analyzing the code, I can see that both `FullSearchSimulation` and `QuadTreeSimulation` classes share a lot of common functionality. Let me identify the shared code and create the refactored version:

**Common functionality between the two classes:**
1. Constructor logic (generatingSettings, bubblesWindowElement setup, etc.)
2. `generateBubbles()` method (identical)
3. `loadBubbles()` method (identical)
4. `run()` method (very similar, only difference is the cycle completion check)
5. `resolveBubbleWallCollision()` method (identical)
6. `stop()`, `saveState()`, `loadState()`, `startAutoSave()`, `stopAutoSave()` methods (identical)
7. Static methods `resolveBubblesCollision()` and `spreadBubbles()` (identical)
8. Properties like `generatingSettings`, `bubbles`, `bubblesSave`, `runningIntervalId`, etc.

**Unique functionality:**
- `FullSearchSimulation.doCycle()` - uses nested loops for collision detection
- `QuadTreeSimulation.doCycle()` - uses QuadTree for collision detection
- `QuadTreeSimulation` has additional properties: `rect`, `quadTree`, `maxD`, `submaxD`


Now I'll create the new `simulations1.js` file with the refactored structure:


```javascript
class Ball {
    constructor(elementId, x, y, d, velocity, hue, parentElement=document) {
        this.elementId = elementId;
        // this.element = document.getElementById(elementId);
        this.element = parentElement.querySelector(`.bubble[id="${elementId}"]`);
        this.x = x;
        this.y = y;
        this.d = d;
        this.element.style.setProperty('--d', `${this.d}px`);
        this.velocity = velocity; // { x: 1, y: 2 }
        // this.nextVelocity = velocity;

        this.hue = hue;
        this.element.style.setProperty('--hue', this.hue);
    }

    static FromJSONString(JSONString, parentElement=document) {
        let BallObject = JSON.parse(JSONString);
        const { elementId, x, y, d, velocity, hue } = BallObject;
        return new Ball(elementId, x, y, d, velocity, hue, parentElement);
    }

    JSONify() {
        const { elementId, x, y, d, velocity, hue } = this;
        const outputString = JSON.stringify({ elementId, x, y, d, velocity, hue }, null, 4);
        return outputString;
    }

    render() {
        this.element.style.setProperty('--x', `${this.x}px`);
        this.element.style.setProperty('--y', `${this.y}px`);
    }

    changeHue(hueChanger) {
        this.hue = hueChanger(this.hue);
        this.element.style.setProperty('--hue', this.hue);
    }

    move(timeSpan) {
        this.x += (timeSpan / 1000) * this.velocity.x;
        this.y += (timeSpan / 1000) * this.velocity.y;
    }

    copy() {
        return new Ball(this.element, this.x, this.y, this.d, this.velocity, this.hue);
    }
}

class CollisionSimulation {
    static defaultGeneratingSettings = {
        baseVelocity: 50,
        maxD: 30,
        maxD: 70,
        render: true,
        randomisePositions: true,
        amountOfBubbles: 1
    }

    constructor(bubblesWindowElement, generatingSettings, simulationSpeed, stringifiedBubbles) {
        this.generatingSettings = generatingSettings;
        for (let prop in CollisionSimulation.defaultGeneratingSettings) {
            if (this.generatingSettings[prop] === undefined) {
                this.generatingSettings[prop] = CollisionSimulation.defaultGeneratingSettings[prop];
            }
        }
        this.regardPreviousCycle = true;
        this.mustLogEnergy = false;
        this.totalEnergy = 0;
        this.runningIntervalId = 0;
        this.autosaveInvervalId = 0;
        this.bubbles = [];
        this.bubblesSave = [];
        this.endCycleCallback = null;

        this.bubblesWindowElement = bubblesWindowElement;
        let { height: maxTop, width: maxLeft } = this.bubblesWindowElement.getBoundingClientRect();
        this.maxTop = maxTop;
        this.maxLeft = maxLeft;

        this.simulationSpeed = simulationSpeed;

        if (!stringifiedBubbles) {
            this.generateBubbles(generatingSettings);
        } else {
            this.loadBubbles(stringifiedBubbles);
        }
    }

    generateBubbles(generatingSettings) {
        const bubbles = [];

        const bubbleElements = Array.from(this.bubblesWindowElement.querySelectorAll('.bubble')).splice(0, generatingSettings.amountOfBubbles);

        let gridSize, xStep, yStep, i;

        if (!generatingSettings.randomisePositions) {
            i = 1
            gridSize = Math.ceil(Math.sqrt(generatingSettings.amountOfBubbles));
            xStep = this.maxLeft / (gridSize + 1);
            yStep = this.maxTop / (gridSize + 1);
        }

        for (const b of bubbleElements) {
            let ballX, ballY;
            if (generatingSettings.randomisePositions) {
                ballX = Math.random() * this.maxLeft;
                ballY = Math.random() * this.maxTop;
            } else {
                ballX = xStep * (i % gridSize + 1);
                ballY = yStep * (Math.floor(i / gridSize) + 1);
            }
            i++

            const randAngle = Math.random() * Math.PI * 2;
            const ballVelocity = { x: this.generatingSettings.baseVelocity * Math.cos(randAngle), y: this.generatingSettings.baseVelocity * Math.sin(randAngle) };
            const randHue = Math.ceil(Math.random() * 360);

            // Generate random d between minD and maxD
            const randomD = generatingSettings.minD + Math.random() * (generatingSettings.maxD - generatingSettings.minD);

            const bubbleId = b.getAttribute('id');
            const ball = new Ball(bubbleId, ballX, ballY, randomD, ballVelocity, randHue, this.bubblesWindowElement);

            bubbles.push(ball);
            if (this.generatingSettings.render) {
                ball.render();
            }
        }

        this.bubbles = bubbles;
    }

    loadBubbles(stringifiedBubbles) {
        this.bubbles = stringifiedBubbles.map(bubbleString => Ball.FromJSONString(bubbleString, this.bubblesWindowElement));
        this.bubbles.map(b => b.render())
    }

    run() {
        this.lastCycleTime = new Date();
        let cycleCompleted = true;

        this.runningIntervalId = setInterval(() => {
            if (!cycleCompleted) {
                return;
            }

            cycleCompleted = false;
            this.doCycle();
            cycleCompleted = true;

            if(this.mustLogEnergy) {
                this.totalEnergy = 0;
                this.bubbles.map(b => {
                    const mass = Math.PI * b.d**2 / 4;
                    this.totalEnergy += mass * (b.velocity.x**2 + b.velocity.y**2) / 2;
                })
                console.log(this.totalEnergy)
            }
        }, 1);
    }

    // Abstract method - must be implemented by subclasses
    doCycle(regardPreviousCycle=this.regardPreviousCycle) {
        throw new Error("doCycle method must be implemented by subclass");
    }

    static resolveBubblesCollision(b1, b2) {
        // Elastic collision formula:
        // v1' = v1 + (2 * m2 / (m1 + m2)) * <(v2 - v1), (x2 - x1)> / |x2 - x1|**2 * (x2 - x1)
        // v2' = v2 + (2 * m1 / (m1 + m2)) * <(v1 - v2), (x1 - x2)> / |x1 - x2|**2 * (x1 - x2)
        
        // Additional preparation to make sure they don't intersect
        CollisionSimulation.spreadBubbles(b1, b2);

        // Relative position: dx = x2 - x1
        const dx = {
            x: b2.x - b1.x,
            y: b2.y - b1.y
        };

        // Distance squared: |dx|**2
        const dxMagSquared = dx.x ** 2 + dx.y ** 2;
        // const dxMagSquared = (b1.d + b2.d) / 2;

        // Relative velocity: dv = v2 - v1
        const dv = {
            x: b2.velocity.x - b1.velocity.x,
            y: b2.velocity.y - b1.velocity.y
        };
        
        // Dot product: <dv, dx> = dv.x * dx.x + dv.y * dx.y
        const dotProduct = dv.x * dx.x + dv.y * dx.y;
        
        // Mass: m = pi * (radius)**2 = pi * (r/2)**2 = pi * r**2 / 4
        const m1 = Math.PI * b1.d * b1.d / 4;
        const m2 = Math.PI * b2.d * b2.d / 4;
        
        // Calculate new velocities
        const v1prime = {
            x: b1.velocity.x + (2 * m2 / (m1 + m2)) * dotProduct / dxMagSquared * dx.x,
            y: b1.velocity.y + (2 * m2 / (m1 + m2)) * dotProduct / dxMagSquared * dx.y
        };
        
        const v2prime = {
            x: b2.velocity.x - (2 * m1 / (m1 + m2)) * dotProduct / dxMagSquared * dx.x,
            y: b2.velocity.y - (2 * m1 / (m1 + m2)) * dotProduct / dxMagSquared * dx.y
        };

        // b1.nextVelocity = v1prime;
        // b2.nextVelocity = v2prime;

        // b1.nextVelocity.x += v1prime.x;
        // b1.nextVelocity.y += v1prime.y;
        // b2.nextVelocity.x += v2prime.x;
        // b2.nextVelocity.y += v2prime.y;

        b1.velocity = v1prime;
        b2.velocity = v2prime;
    }

    static spreadBubbles(b1, b2) {
        const dx = {
            x: b2.x - b1.x,
            y: b2.y - b1.y
        };

        let dxMag = Math.sqrt(dx.x * dx.x + dx.y * dx.y);
        
        dx.x /= dxMag;
        dx.y /= dxMag;
        const offset = b1.d / 2 + b2.d / 2 - dxMag;
    
        b1.x -= offset * dx.x / 2;
        b1.y -= offset * dx.y / 2;
        b2.x += offset * dx.x / 2;
        b2.y += offset * dx.y / 2;
    }

    resolveBubbleWallCollision(b) {        
        if (b.x - b.d / 2 <= 0) {
            b.x = b.d / 2 + 0.1;
            b.velocity.x *= -1;
        } else if (b.x + b.d / 2 >= this.maxLeft) {
            b.x = this.maxLeft - b.d / 2 - 0.1;
            b.velocity.x *= -1;
        }

        if (b.y - b.d / 2 <= 0) {
            b.y = b.d / 2 + 0.1;
            b.velocity.y *= -1;
        } else if (b.y + b.d / 2 >= this.maxTop) {
            b.y = this.maxTop - b.d / 2 - 0.1;
            b.velocity.y *= -1;
        }
    }

    stop() {
        clearInterval(this.runningIntervalId);
        this.runningIntervalId = 0;
    }

    saveState() {
        this.bubblesSave = this.bubbles.map(b => b.JSONify());
    }

    loadState(render=true) {
        this.stopAutoSave();
        this.loadBubbles(this.bubblesSave);
        if(render) {
            this.bubbles.forEach(b => b.render());
        }
    }

    startAutoSave(savePeriod) {
        this.stopAutoSave();
        this.saveState();
        this.autosaveInvervalId = setInterval(() => {
            this.saveState();
        }, savePeriod);
    }

    stopAutoSave() {
        clearInterval(this.autosaveInvervalId);
        this.autosaveInvervalId = 0; 
    }
}

class FullSearchSimulation extends CollisionSimulation {
    doCycle(regardPreviousCycle=this.regardPreviousCycle) {
        if(regardPreviousCycle) {
            const currentCycleTime = new Date();
            this.lastCycleDuration = currentCycleTime.getTime() - this.lastCycleTime.getTime();
            this.lastCycleTime = currentCycleTime;
        } else {
            this.lastCycleDuration = 17;
        }

        this.bubbles.forEach((b1, i) => {
            this.bubbles.forEach((b2, j) => {
                if(j <= i) {
                    return
                }
                const bubblesDistance = Math.sqrt((b1.x - b2.x) ** 2 + (b1.y - b2.y) ** 2)
                if (bubblesDistance < b1.d / 2 + b2.d / 2) {
                    CollisionSimulation.resolveBubblesCollision(b1, b2);
                }
            })

            this.resolveBubbleWallCollision(b1);
        })
        
        for (let b of this.bubbles) {
            const dt = this.lastCycleDuration * this.simulationSpeed;
            b.move(dt);
            b.render();
        }
    
        this.lastCycleTime = new Date();
        
        if(this.endCycleCallback) {
            this.endCycleCallback();
        }
    }
}

// ---------------
// --- NEW ERA ---
// ---------------


class Rectangle {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    contains(pointLike) {
        const result = 
        (pointLike.x < this.x + this.w) && 
        (pointLike.x >= this.x) && 
        (pointLike.y < this.y + this.h) && 
        (pointLike.y >= this.y);

        return result
    }

    // NEURO
    // Checks if a circleLike object has an overlapping area with this rectangle
    // overlapsWith(circleLike) {
    //     // Circle properties
    //     const circleX = circleLike.x;
    //     const circleY = circleLike.y;
    //     const radius = circleLike.radius;

    //     // Find the closest point on the rectangle to the circle's center
    //     const closestX = Math.max(this.x, Math.min(circleX, this.x + this.w));
    //     const closestY = Math.max(this.y, Math.min(circleY, this.y + this.h));

    //     // Calculate the distance between the circle's center and this closest point
    //     const distanceX = circleX - closestX;
    //     const distanceY = circleY - closestY;

    //     // Check if the distance is less than or equal to the radius
    //     return (distanceX ** 2 + distanceY ** 2) <= (radius ** 2);
    // }

    // my implementation
    intersects(circleLike) {
        if(this.covers(circleLike)) {
            return false;
        }

        const { x, y, w, h, } = this;
        const { x: px, y: py, d } = circleLike;
        const r = d / 2;

        const rect1 = new Rectangle(x, y - r, w, h + 2 * r);
        const rect2 = new Rectangle(x - r, y, w + 2 * r, h);

        if(rect1.contains(circleLike) || rect2.contains(circleLike)) {
            return true;
        }

        const distances = [
            Math.sqrt((px - x) ** 2 + (py - y) ** 2),
            Math.sqrt((px - (x + w)) ** 2 + (py - y) ** 2),
            Math.sqrt((px - x) ** 2 + (py - (y + h)) ** 2),
            Math.sqrt((px - (x + w)) ** 2 + (py - (y + h)) ** 2)
        ]

        return distances.some(d => d < r);
    }

    // NEURO
    // Checks if a circleLike object shares its whole area with this rectangle
    // covers(circleLike) {
    //     // Circle properties
    //     const circleX = circleLike.x;
    //     const circleY = circleLike.y;
    //     const radius = circleLike.radius;

    //     // Check if the circle's center is within the rectangle
    //     const insideRectangle = this.contains({ x: circleX, y: circleY });

    //     // Check if the rectangle's edges are far enough from the circle's center
    //     const leftEdge = this.x;
    //     const rightEdge = this.x + this.w;
    //     const topEdge = this.y;
    //     const bottomEdge = this.y + this.h;

    //     const coversLeft = (circleX - radius) >= leftEdge;
    //     const coversRight = (circleX + radius) <= rightEdge;
    //     const coversTop = (circleY - radius) >= topEdge;
    //     const coversBottom = (circleY + radius) <= bottomEdge;

    //     return insideRectangle && coversLeft && coversRight && coversTop && coversBottom;
    // }

    covers(circleLike) {
        const result = 
        (circleLike.x + circleLike.d / 2 < this.x + this.w) && 
        (circleLike.x - circleLike.d / 2 >= this.x) && 
        (circleLike.y + circleLike.d / 2 < this.y + this.h) && 
        (circleLike.y - circleLike.d / 2 >= this.y);

        return result
    }
}

class QuadTree {
    constructor(bubbles, rect) {
        this.rect = new Rectangle(rect.x, rect.y, rect.w, rect.h);
        this.bubble = null;
        // this.branches = {
        //     topRight: null,
        //     topLeft: null,
        //     bottomLeft: null,
        //     bottomRight: null,
        // };
        this.branches = {};

        if(bubbles.length > 1) {
            this.subdivide(bubbles)
        }
        else {
            this.bubble = bubbles[0]
        }

    }

    subdivide(bubbles) {
        const { x, y, w, h } = this.rect;

        const subRects = {
            topRight: new Rectangle(x + w / 2, y, w / 2, h / 2),
            topLeft: new Rectangle(x, y, w / 2, h / 2),
            bottomLeft: new Rectangle(x, y + h / 2, w / 2, h / 2),
            bottomRight: new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2),
        }

        for(let side in subRects) {
            let subRectBubbles = [];   
            for(let b of bubbles) {
                if(subRects[side].contains(b)) {
                    subRectBubbles.push(b);
                }
            }
            if(subRectBubbles.length === 0) {
                continue
            }
            this.branches[side] = new QuadTree(subRectBubbles, subRects[side])
        }
    }

    query(circleArea, outputArray=null) {
        outputArray ||= [];

        if(this.bubble && !(circleArea.x === this.bubble.x && circleArea.y === this.bubble.y)) {
            const distance = Math.sqrt((this.bubble.x - circleArea.x)**2 + (this.bubble.y - circleArea.y)**2);
            if(distance <= (this.bubble.d + circleArea.d) / 2) {
                outputArray.push(this.bubble);
            }
            return;
        }
        if(!this.rect.intersects(circleArea) && !this.rect.contains(circleArea)) {
            return;
        }

        Object.values(this.branches).forEach(branch => {
            branch.query(circleArea, outputArray)
        });

        return outputArray;
    }

    static defaultLeafProcesser(leaf) {
        return leaf
    }
    
    mappify(leafProcesser = QuadTree.defaultLeafProcesser) {
        if (this.bubble) {
            return { leaf: leafProcesser(this.bubble) }
        }
        let obj = {}
        for (let side in this.branches) {
            if (!this.branches[side]) {
                continue
            }
            obj[side] = this.branches[side].mappify(leafProcesser)
        }
        return obj
    }

    static defaultLeafStringifyer(ball) {
        return `ball#${ball.elementId}`
    }

    toString(leafStringifyer = QuadTree.defaultLeafStringifyer) {
        return JSON.stringify(this.mappify(leafStringifyer), null, 4)
    }
}

class QuadTreeSimulation extends CollisionSimulation {
    constructor(bubblesWindowElement, generatingSettings, simulationSpeed, stringifiedBubbles) {
        super(bubblesWindowElement, generatingSettings, simulationSpeed, stringifiedBubbles);
        
        this.rect = { x: 0, y: 0, w: this.maxLeft, h: this.maxTop };
        this.quadTree = null;
        this.maxD = this.bubbles.reduce((maxd, b) => (b.d > maxd ? b.d : maxd), 0);
        this.submaxD = this.bubbles.reduce((submaxd, b) => (b.d > submaxd && b.d !== this.maxD ? b.d : submaxd), 0);
    }

    doCycle(regardPreviousCycle=this.regardPreviousCycle) {
        // let timePassed;

        // if(regardPreviousCycle) {
        //     const currentCycleTime = new Date();
        //     timePassed = currentCycleTime.getTime() - this.lastCycleTime.getTime();
        //     this.lastCycleTime = currentCycleTime;
        // } else {
        //     timePassed = 17;
        // }
        if(regardPreviousCycle) {
            const currentCycleTime = new Date();
            this.lastCycleDuration = currentCycleTime.getTime() - this.lastCycleTime.getTime();
            this.lastCycleTime = currentCycleTime;
        } else {
            this.lastCycleDuration = 17;
        }

        this.quadTree = new QuadTree(this.bubbles, this.rect);

        this.bubbles.forEach((b1) => {
            const collisionOffset = b1.d !== this.maxD ? this.maxD : this.submaxD;
            const collisionArea = { x: b1.x, y: b1.y, d: b1.d + collisionOffset };
            const b2s = this.quadTree.query(collisionArea);

            // if(!b2s) {
            //     console.log(1);
            // }
            
            b2s?.forEach(b2 => {
                const bubblesDistance = Math.sqrt((b1.x - b2.x) ** 2 + (b1.y - b2.y) ** 2)
                if (bubblesDistance < b1.d / 2 + b2.d / 2) {
                    CollisionSimulation.resolveBubblesCollision(b1, b2);
                }
            })

            this.resolveBubbleWallCollision(b1);
        })
        
        for (let b of this.bubbles) { 
            // const dt = timePassed * this.simulationSpeed;
            const dt = this.lastCycleDuration * this.simulationSpeed;
            b.move(dt);
            b.render();
        }
    
        this.lastCycleTime = new Date();
        
        if(this.endCycleCallback) {
            this.endCycleCallback();
        }
    }
}
```

Now let me check for any linting errors in the new file:


Perfect! I've successfully created `simulations1.js` with the refactored code structure. Here's a summary of what I accomplished:

## Refactoring Summary

I've created a new `simulations1.js` file that follows the inheritance pattern you requested, similar to your car example:

### Before (Original Structure):
```javascript
class FullSearchSimulation { 
    // All methods and properties duplicated
    constructor() { /* ... */ }
    generateBubbles() { /* ... */ }
    loadBubbles() { /* ... */ }
    run() { /* ... */ }
    doCycle() { /* ... */ }
    resolveBubbleWallCollision() { /* ... */ }
    stop() { /* ... */ }
    // ... many more methods
}

class QuadTreeSimulation { 
    // All methods and properties duplicated
    constructor() { /* ... */ }
    generateBubbles() { /* ... */ }
    loadBubbles() { /* ... */ }
    run() { /* ... */ }
    doCycle() { /* ... */ }
    resolveBubbleWallCollision() { /* ... */ }
    stop() { /* ... */ }
    // ... many more methods
}
```

### After (Refactored Structure):
```javascript
class CollisionSimulation {
    // Common functionality moved here
    constructor() { /* ... */ }
    generateBubbles() { /* ... */ }
    loadBubbles() { /* ... */ }
    run() { /* ... */ }
    doCycle() { /* abstract method */ }
    resolveBubbleWallCollision() { /* ... */ }
    stop() { /* ... */ }
    // ... all shared methods
}

class FullSearchSimulation extends CollisionSimulation {
    doCycle() { /* FullSearch-specific implementation */ }
}

class QuadTreeSimulation extends CollisionSimulation {
    constructor() { 
        super(); 
        /* QuadTree-specific initialization */ 
    }
    doCycle() { /* QuadTree-specific implementation */ }
}
```

## Key Changes Made:

1. **Created `CollisionSimulation` parent class** with all shared functionality:
   - Constructor logic
   - `generateBubbles()`, `loadBubbles()`, `run()` methods
   - `resolveBubbleWallCollision()`, `stop()`, `saveState()`, `loadState()`, `startAutoSave()`, `stopAutoSave()` methods
   - Static methods `resolveBubblesCollision()` and `spreadBubbles()`
   - All common properties

2. **Made `doCycle()` abstract** in the parent class - it throws an error if called directly, forcing subclasses to implement it

3. **Refactored `FullSearchSimulation`** to extend `CollisionSimulation`:
   - Only contains the `doCycle()` method with its nested loop collision detection logic
   - All other functionality inherited from parent

4. **Refactored `QuadTreeSimulation`** to extend `CollisionSimulation`:
   - Contains `doCycle()` method with QuadTree collision detection logic
   - Constructor calls `super()` and adds QuadTree-specific properties (`rect`, `quadTree`, `maxD`, `submaxD`)
   - All other functionality inherited from parent

5. **Updated static method references** to use `CollisionSimulation.resolveBubblesCollision()` instead of the old class-specific references

The refactored code eliminates code duplication while maintaining the same functionality. Both simulation types now share common behavior through inheritance, making the code more maintainable and following the DRY (Don't Repeat Yourself) principle.

```javascript
class FullSearchSimulation { 
    // All methods and properties duplicated
    constructor() { /* ... */ }
    generateBubbles() { /* ... */ }
    loadBubbles() { /* ... */ }
    run() { /* ... */ }
    doCycle() { /* ... */ }
    resolveBubbleWallCollision() { /* ... */ }
    stop() { /* ... */ }
    // ... many more methods
}

class QuadTreeSimulation { 
    // All methods and properties duplicated
    constructor() { /* ... */ }
    generateBubbles() { /* ... */ }
    loadBubbles() { /* ... */ }
    run() { /* ... */ }
    doCycle() { /* ... */ }
    resolveBubbleWallCollision() { /* ... */ }
    stop() { /* ... */ }
    // ... many more methods
}
```

```javascript
class CollisionSimulation {
    // Common functionality moved here
    constructor() { /* ... */ }
    generateBubbles() { /* ... */ }
    loadBubbles() { /* ... */ }
    run() { /* ... */ }
    doCycle() { /* abstract method */ }
    resolveBubbleWallCollision() { /* ... */ }
    stop() { /* ... */ }
    // ... all shared methods
}

class FullSearchSimulation extends CollisionSimulation {
    doCycle() { /* FullSearch-specific implementation */ }
}

class QuadTreeSimulation extends CollisionSimulation {
    constructor() { 
        super(); 
        /* QuadTree-specific initialization */ 
    }
    doCycle() { /* QuadTree-specific implementation */ }
}
```

