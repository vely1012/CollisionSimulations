class CollisionSimulation {
    static defaultGeneratingSettings = {
        baseVelocity: 50,
        maxD: 30,
        maxD: 70,
        bubbleHue: null,
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
        this.constantCycleTime = true;
        this.runningIntervalId = 0;
        this.lastCycleTime = new Date(0);
        this.autosaveInvervalId = 0;
        this.bubbles = [];
        this.bubblesSave = [];
        this.endCycleTasks = [() => { this.render() }];

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
            const hue = generatingSettings.hue === null ? Math.ceil(Math.random() * 360) : generatingSettings.hue;

            const randomD = generatingSettings.minD + Math.random() * (generatingSettings.maxD - generatingSettings.minD);

            const bubbleId = b.getAttribute('id');
            const ball = new Ball(bubbleId, ballX, ballY, randomD, ballVelocity, hue, this.bubblesWindowElement);

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
            this.endCycleTasks.forEach(callback => callback?.());
            cycleCompleted = true;
        }, 1);
    }

    // Abstract method - must be implemented by subclasses
    doCycle(constantCycleTime = this.constantCycleTime) {
        throw new Error("doCycle method must be implemented by subclass");
    }

    render() {
        for (let b of this.bubbles) {
            const dt = this.lastCycleDuration * this.simulationSpeed;
            b.move(dt);
            b.render();
        }
    }

    rewind(numberOfCycles) {
        const di = numberOfCycles > 0 ? 1 : -1;
        const n = numberOfCycles * di;

        this.simulationSpeed *= di;
        for(let i = 0; i != n; i += di) {
            this.doCycle(true);
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
    doCycle(constantCycleTime = this.constantCycleTime) {
        if (!constantCycleTime) {
            const currentCycleTime = new Date();
            this.lastCycleDuration = currentCycleTime.getTime() - this.lastCycleTime.getTime();
            this.lastCycleTime = currentCycleTime;
        } else {
            this.lastCycleDuration = 17;
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
        this.maxBubbles = maxBubbles || Math.ceil(Math.log(this.bubbles.length) / Math.log(4));
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
            this.lastCycleDuration = 17;
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