const generatingRules = { baseVelocity: 25, amountOfBubbles: 7, randomisePositions: true, minD: 30, maxD: 30, hue: 220 };

// Fill inputs with values in generatingRules
for(let numInput of document.querySelectorAll("#bubbleGenerationSettings .gui__input_number")) {
    numInput.value = generatingRules[numInput.id] || CollisionSimulation.defaultGeneratingSettings[numInput.id];
}
document.getElementById("randomisePositions").checked = generatingRules.randomisePositions !== undefined ? generatingRules.randomisePositions : CollisionSimulation.defaultGeneratingSettings.randomisePositions; 

const fsSim = new FullSearchSimulation(document.querySelector("#full-search-sim .bubbles-window"), generatingRules, 5);
// const fsSim = new FullSearchSimulation(document.querySelector("#full-search-sim .bubbles-window"), {}, 7, realBubblesSamples[4]);
// const fsSim = new FullSearchSimulation(document.querySelector("#full-search-sim .bubbles-window"), {}, 1, imaginaryBubblesSamples[3]);
const qtSim = new QuadTreeSimulation(document.querySelector("#quad-tree-sim .bubbles-window"), generatingRules, 5);
// const qtSim = new QuadTreeSimulation(document.querySelector("#quad-tree-sim .bubbles-window"), {}, 7, realBubblesSamples[4]);
// const qtSim = new QuadTreeSimulation(document.querySelector("#quad-tree-sim .bubbles-window"), {}, 1, imaginaryBubblesSamples[3]);

// fsSim.constantCycleTime = false;
// qtSim.constantCycleTime = false;

(function endCycleSetup() {
    // fsSim.endCycleTasks.push(EndCycleActions._logAvgCycleFactory(fsSim));
    
    // fsSim.endCycleTasks.push(() => { EndCycleActions.logSystemsEnergy(fsSim); });
    // qtSim.endCycleTasks.push(EndCycleActions._logAvgCycleFactory(qtSim));
    // qtSim.endCycleTasks.push(() => { EndCycleActions.cleanSimulationBackground(qtSim); });
    // qtSim.endCycleTasks.push(() => { EndCycleActions.drawQuadTreeGrid(qtSim); });
    // qtSim.endCycleTasks.push(() => { EndCycleActions.bubbleContactBranches(qtSim); });
    // qtSim.endCycleTasks.push(() => { EndCycleActions.unmarkBubbles(qtSim); });
    // qtSim.endCycleTasks.push(() => { EndCycleActions.markClosestBubbles(qtSim, qtSim.bubbles[0]); });
    // qtSim.endCycleTasks.push(() => { EndCycleActions.logSystemsEnergy(qtSim); });
    // qtSim.endCycleTasks.push(() => { EndCycleActions.markCustomQueryBubbles(qtSim, qtSim.bubbles[0], null, (b1, b2) => !Object.is(b1, b2), '120'); });
})();

let currentSimulation = fsSim;
// currentSimulation.bubblesWindowElement.classList.add('bubbles-window_focused');
currentSimulation.bubblesWindowElement.parentElement.classList.add('bubble-simulation_focused');
// let currentSimulation = qtSim;
fsSim.run();
qtSim.run();