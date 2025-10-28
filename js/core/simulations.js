class CollisionSimulation {
    static defaultGeneratingSettings = {
        baseVelocity: 50,
        maxD: 30,
        maxD: 70,
        hue: 0,
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
        this.constantCycleTime = true;
        this.runningIntervalId = 0;
        this.lastCycleTime = new Date(0);
        this.autosaveInvervalId = 0;
        this.bubbles = [];
        this.bubblesSave = [];
        this.endCycleTasks = [
            () => { this.moveBubbles() },
            () => { this.render() }
        ];

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

    cleanBubbles() {
        for(let b of this.bubblesWindowElement.children) {
            b.style.cssText = "";
        }
    }

    tintBubbles(hue) {
        const hueChanger = () => hue;
        for(let b of this.bubbles) {
            b.changeHue(hueChanger);
        }
    }

    generateBubbles(generatingSettings) {
        this.cleanBubbles();

        const bubbles = [];

        const bubbleElements = Array.from(this.bubblesWindowElement.querySelectorAll('.bubble')).splice(0, generatingSettings.amountOfBubbles);

        let gridSize, xStep, yStep, i;

        if (!generatingSettings.randomisePositions) {
            i = 0;
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
            const hue = generatingSettings.hue === null ? Math.ceil(Math.random() * 360) : generatingSettings.hue;

            const randomD = generatingSettings.minD + Math.random() * (generatingSettings.maxD - generatingSettings.minD);

            const bubbleId = b.getAttribute('id');
            const ball = new Ball(bubbleId, ballX, ballY, randomD, ballVelocity, hue, this.bubblesWindowElement);

            bubbles.push(ball);
            ball.render();
        }

        this.bubbles = bubbles;
    }

    loadBubbles(stringifiedBubbles) {
        this.cleanBubbles();
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
            this.endCycleTasks.forEach(callback => callback?.());
            cycleCompleted = true;
        }, 1);
    }

    // Abstract method - must be implemented by subclasses
    doCycle() {
        throw new Error("doCycle method must be implemented by subclass");
    }

    moveBubbles() {
        const dt = this.lastCycleDuration * this.simulationSpeed;
        for(let b of this.bubbles) {
            b.move(dt);
        }
    }

    render() {
        for (let b of this.bubbles) {
            b.render();
        }
    }

    rewind(numberOfCycles) {
        const di = numberOfCycles > 0 ? 1 : -1;
        const n = numberOfCycles;

        this.simulationSpeed *= di;
        for(let i = 0; i != n; i += di) {
            this.doCycle();
            this.moveBubbles();
        }
        this.simulationSpeed /= di;

        this.endCycleTasks.forEach(callback => callback?.());
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

        // Assing
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

    loadState(render = true) {
        this.stopAutoSave();
        this.loadBubbles(this.bubblesSave);
        if (render) {
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
    doCycle() {
        if (!this.constantCycleTime) {
            const currentCycleTime = new Date();
            this.lastCycleDuration = currentCycleTime.getTime() - this.lastCycleTime.getTime();
            this.lastCycleTime = currentCycleTime;
        } else {
            this.lastCycleDuration = 6.5;
        }

        this.bubbles.forEach((b1, i) => {
            this.bubbles.forEach((b2, j) => {
                if (j <= i) {
                    return
                }
                const bubblesDistance = Math.sqrt((b1.x - b2.x) ** 2 + (b1.y - b2.y) ** 2)
                if (bubblesDistance < b1.d / 2 + b2.d / 2) {
                    CollisionSimulation.resolveBubblesCollision(b1, b2);
                }
            })
            this.resolveBubbleWallCollision(b1);
        });

        this.lastCycleTime = new Date();
    }
}

class QuadTreeSimulation extends CollisionSimulation {
    constructor(bubblesWindowElement, generatingSettings, simulationSpeed, stringifiedBubbles, maxBubbles = 0) {
        super(bubblesWindowElement, generatingSettings, simulationSpeed, stringifiedBubbles);

        this.rect = { x: 0, y: 0, w: this.maxLeft, h: this.maxTop };

        // Yet to improve
        this.maxBubbles = 1;
        // this.maxBubbles = maxBubbles || Math.ceil(Math.log(this.bubbles.length) / Math.log(4));
        // this.maxBubbles = Math.pow(2, 2 * Math.ceil(Math.log(this.bubbles.length / maxBubbles) / Math.log(2)));
        
        this.quadTree = null;
        this.maxD = this.bubbles.reduce((maxd, b) => (b.d > maxd ? b.d : maxd), 0);
        this.submaxD = this.bubbles.reduce((submaxd, b) => (b.d > submaxd && b.d !== this.maxD ? b.d : submaxd), 0) || this.maxD;
    }

    static leafFilter(b1, b2) {
        return !Object.is(b1, b2) && Math.sqrt((b2.x - b1.x) ** 2 + (b2.y - b1.y) ** 2) <= (b2.d + b1.d) / 2; 
    }

    static branchFilter(b1, branch) {
        return branch.rect.intersects(b1) || branch.rect.contains(b1);
    }

    doCycle(constantCycleTime = this.constantCycleTime) {
        if (!constantCycleTime) {
            const currentCycleTime = new Date();
            this.lastCycleDuration = currentCycleTime.getTime() - this.lastCycleTime.getTime();
            this.lastCycleTime = currentCycleTime;
        } else {
            this.lastCycleDuration = 6.5;
        }

        this.quadTree = new QuadTree(this.bubbles, this.rect, this.maxBubbles);
        this.bubbles.forEach(b1 => {
            const b2s = this.quadTree.customQuery(b1, QuadTreeSimulation.branchFilter, QuadTreeSimulation.leafFilter);
            b2s?.forEach(b2 => CollisionSimulation.resolveBubblesCollision(b1, b2));
            this.resolveBubbleWallCollision(b1);
        });

        this.lastCycleTime = new Date();
    }
}

// Additional debugging and illustrating utility
class EndCycleActions {
    static _framePropByRect(rect, color, thickness) {
        const { x, y, w, h } = rect;

        let styleProp = `linear-gradient(${color}, ${color}) ${x}px ${y}px / calc(${w}px + ${thickness}px) ${thickness}px no-repeat,
                         linear-gradient(${color}, ${color}) ${x}px ${y}px / ${thickness}px calc(${h}px + ${thickness}px) no-repeat,
                         linear-gradient(${color}, ${color}) calc(${x}px - ${thickness}px) calc(${h}px + ${y}px - ${thickness}px) / calc(${w}px + ${thickness}px) ${thickness}px no-repeat,
                         linear-gradient(${color}, ${color}) calc(${w}px + ${x}px - ${thickness}px) calc(${y}px - ${thickness}px) / ${thickness}px calc(${h}px + ${thickness}px) no-repeat`;

        return styleProp;
    }

    static cleanSimulationBackground(sim) { sim.bubblesWindowElement.style.setProperty('background', ''); }

    static logSystemsEnergy(sim) {
        let totalEnergy = 0;
        sim.bubbles.forEach(b => {
            const mass = Math.PI * b.d ** 2 / 4;
            totalEnergy += mass * (b.velocity.x ** 2 + b.velocity.y ** 2) / 2;
        })
        console.log(totalEnergy);
    }

    static _logAvgCycleFactory(sim, maxCyclesToConsider=100) {
        let cycleTimes = [];

        return function () {
            if(cycleTimes.length === maxCyclesToConsider) {
                cycleTimes.shift();
            }
            cycleTimes.push(sim.lastCycleDuration);

            console.log(cycleTimes.reduce((sum, e) => sum + e, 0) / cycleTimes.length);
        };
    }

    static drawQuadTreeGrid(quadTreeSim) {
        const quadTree = quadTreeSim.quadTree;
        const canvasElement = quadTreeSim.bubblesWindowElement;
        const color = '#7777';
        const thickness = 3;

        const frameProps = [];
        (function recurrentScan(quadTree) {
            frameProps.push(EndCycleActions._framePropByRect(quadTree.rect, color, thickness));
            for (let side in quadTree.branches) {
                const branch = quadTree.branches[side];
                if (!branch) {
                    continue;
                }
                recurrentScan(branch);
            }
        })(quadTree);

        let currentBackground = canvasElement.style.getPropertyValue('background');
        currentBackground = currentBackground ? "," + currentBackground : "";
        canvasElement.style.setProperty('background', frameProps.join(',') + currentBackground);
    }

    static bubbleContactBranches(quadTreeSim) {
        const canvasElement = quadTreeSim.bubblesWindowElement;
        const b = quadTreeSim.bubbles[0];
        const qt = quadTreeSim.quadTree;

        const frameProps = [];

        (function recurrentRectMarking(quadTree, bubble) {
            const covers = quadTree.rect.covers(bubble);
            const intersects = quadTree.rect.intersects(bubble);
            const leaf = Object.is(quadTree.bubble, bubble);

            if (!covers && !intersects) {
                return;
            }

            if (covers) {
                const col = leaf ? '#f00' : '#0c0';
                frameProps.push(EndCycleActions._framePropByRect(quadTree.rect, col, 2));
            }
            if (intersects) {
                frameProps.push(EndCycleActions._framePropByRect(quadTree.rect, '#00f', 2));
            }

            if (leaf) {
                return;
            }

            for (let side in quadTree.branches) {
                if (!quadTree.branches[side]) {
                    continue;
                }
                recurrentRectMarking(quadTree.branches[side], bubble);
            }
        })(qt, b);

        frameProps.reverse();
        let currentBackground = canvasElement.style.getPropertyValue('background');
        currentBackground = currentBackground ? "," + currentBackground : "";
        canvasElement.style.setProperty('background', frameProps.join(',') + currentBackground);
    }

    static markClosestBubbles(quadTreeSim, targetBubble, markHue = '0') {
        const b1 = targetBubble;
        const qts = quadTreeSim;

        const branchFilter = QuadTreeSimulation.branchFilter;
        const leafFilter = QuadTreeSimulation.leafFilter;

        const collisionOffset = b1.d !== qts.maxD ? qts.maxD : qts.submaxD;
        const collisionArea = { x: b1.x, y: b1.y, d: b1.d + collisionOffset };

        b1.element.style.setProperty('outline', '2px solid black');
        b1.element.style.setProperty('outline-offset', `${collisionOffset / 2}px`);

        const b2s = qts.quadTree.customQuery(collisionArea, branchFilter, leafFilter);
        b2s?.forEach(b2 => {
            if(Object.is(b1, b2)) {
                return;
            }
            // save previous value to be able to restore it in unmarkBubbles
            const initialHue = b2.element.style.getPropertyValue('--hue');
            b2.element.style.setProperty('--hue-init', initialHue);

            b2.element.style.setProperty('--hue', markHue);
        });
    }

    static markCustomQueryBubbles(quadTreeSim, targetBubble, branchFilter=null, leafFilter=null, markHue = '270') {
        branchFilter ||= QuadTreeSimulation.branchFilter;
        leafFilter ||= QuadTreeSimulation.leafFilter;

        const bubblesToMark = quadTreeSim.quadTree.customQuery(targetBubble, branchFilter, leafFilter);
        bubblesToMark?.forEach(b2 => {
            const initialHue = b2.element.style.getPropertyValue('--hue');
            b2.element.style.setProperty('--hue-init', initialHue);

            b2.element.style.setProperty('--hue', markHue);
        });
    }

    static unmarkBubbles(quadTreeSim) {
        quadTreeSim.bubbles.forEach(b => {
            const initialCol = b.element.style.getPropertyValue('--hue-init');
            if (!initialCol) {
                return;
            }
            b.element.style.setProperty('--hue', initialCol);
        });
    }
}