class Ball {
    constructor(elementId, x, y, d, velocity, hue, parentElement = document) {
        this.elementId = elementId;
        // this.element = document.getElementById(elementId);
        this.element = parentElement.querySelector(`.bubble[id="${elementId}"]`);
        this.x = x;
        this.y = y;
        this.d = d;
        this.element.style.setProperty('--d', `${this.d}px`);
        this.velocity = velocity; // { x: 0, y: 0 }
        // this.nextVelocity = velocity;

        this.hue = hue;
        this.element.style.setProperty('--hue', this.hue);
    }

    static FromJSONString(JSONString, parentElement = document) {
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

    intersects(circleLike) {
        if (this.covers(circleLike)) {
            return false;
        }

        const { x, y, w, h, } = this;
        const { x: px, y: py, d } = circleLike;
        const r = d / 2;

        const rect1 = new Rectangle(x, y - r, w, h + 2 * r);
        const rect2 = new Rectangle(x - r, y, w + 2 * r, h);

        if (rect1.contains(circleLike) || rect2.contains(circleLike)) {
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
    constructor(bubbles, rect, maxBubbles = 4) {
        this.rect = new Rectangle(rect.x, rect.y, rect.w, rect.h);
        this.maxBubbles = maxBubbles;
        this.bubbles = null;
        this.branches = {}; /*{ topRight: null, topLeft: null, bottomLeft: null, bottomRight: null }*/

        if (bubbles.length > maxBubbles) {
            this.subdivide(bubbles)
        }
        else {
            this.bubbles = bubbles;
        }

    }

    subdivide(bubbles) {
        const { x, y, w, h } = this.rect;

        const subRects = {
            topRight: new Rectangle(x + w / 2, y, w / 2, h / 2),
            topLeft: new Rectangle(x, y, w / 2, h / 2),
            bottomLeft: new Rectangle(x, y + h / 2, w / 2, h / 2),
            bottomRight: new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2),
        };

        for (let side in subRects) {
            let subRectBubbles = [];
            for (let b of bubbles) {
                if (subRects[side].contains(b)) {
                    subRectBubbles.push(b);
                }
            }
            if (subRectBubbles.length === 0) {
                continue;
            }
            this.branches[side] = new QuadTree(subRectBubbles, subRects[side], this.maxBubbles);
        }
    }

    customQuery(targetBubble, branchFilter, leafFilter, outputArray = []) {
        this.bubbles?.forEach(b => {
            if (!leafFilter(targetBubble, b)) {
                return;
            }
            outputArray.push(b);
        });

        Object.values(this.branches).forEach(branch => {
            if (!branchFilter(targetBubble, branch)) {
                return;
            }
            branch.customQuery(targetBubble, branchFilter, leafFilter, outputArray);
        })

        return outputArray;
    }

    static defaultLeafProcesser(leaf) {
        return leaf;
    }

    mappify(leafProcesser = QuadTree.defaultLeafProcesser) {
        if (this.bubbles) {
            return { leafs: this.bubbles.map(leafProcesser) };
        }
        let obj = {};
        for (let side in this.branches) {
            if (!this.branches[side]) {
                continue;
            }
            obj[side] = this.branches[side].mappify(leafProcesser);
        }
        return obj;
    }

    static defaultLeafStringifyer(ball) {
        return `ball#${ball.elementId}`;
    }

    toString(leafStringifyer = QuadTree.defaultLeafStringifyer) {
        return JSON.stringify(this.mappify(leafStringifyer), null, 4)
    }
}