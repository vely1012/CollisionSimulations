function clearSimsCallbacks() {
    fsSim.endCycleTasks = [
        () => { fsSim.moveBubbles(); },
        () => { fsSim.render(); }
    ];

    qtSim.endCycleTasks = [
        () => { qtSim.moveBubbles(); },
        () => { qtSim.render(); }
    ];

    
    EndCycleActions.unmarkBubbles(qtSim);
    qtSim.bubblesWindowElement.style.setProperty('background', '');
    qtSim.bubbles[0].element.style.setProperty('outline', '');
}

function togglePlayStop() {
    currentSimulation.runningIntervalId ? currentSimulation.stop() : currentSimulation.run();
    document.getElementById('togglePlayStop').value = currentSimulation.runningIntervalId ? 'stop' : 'run';
}

function restartSimulation() {
    currentSimulation.stop();
    currentSimulation.generateBubbles(generatingRules);
}

function quickRestartSimulation() {
    currentSimulation.stop();
    currentSimulation.generateBubbles(generatingRules);
    currentSimulation.run();
}

function saveSimulationState() {
    currentSimulation.saveState();
    stopAutoSave();
}

function loadSimulationState() {
    currentSimulation.loadState();

    document.getElementById('toggleAutoSave').value = 'start autosave';
}

function startAutoSave() {
    currentSimulation.startAutoSave(150);

    document.getElementById('toggleAutoSave').value = '🔴 recording';
}

function stopAutoSave() {
    currentSimulation.stopAutoSave();

    document.getElementById('toggleAutoSave').value = 'start autosave';
}

function iterateSimulation() {
    if (!currentSimulation.runningIntervalId) {
        currentSimulation.doCycle(true);
        currentSimulation.endCycleTasks.forEach(callback => callback?.());
    }
}

function iterateSimulationReverse() {
    if (!currentSimulation.runningIntervalId) {
        currentSimulation.simulationSpeed *= -1;
        currentSimulation.doCycle(true);
        currentSimulation.endCycleTasks.forEach(callback => callback?.());
        currentSimulation.simulationSpeed *= -1;
    }
}

function toggleConstantCycleTime() {
    let launchWhenDone = false;
    if(currentSimulation.runningIntervalId) {
        currentSimulation.stop();
        launchWhenDone = true;
    }
    currentSimulation.constantCycleTime = !currentSimulation.constantCycleTime;

    if(launchWhenDone) {
        currentSimulation.run();
    }
}

function iterateBothSimulations() {
    if (!fsSim.runningIntervalId && !qtSim.runningIntervalId) {
        fsSim.doCycle(true);
        fsSim.endCycleTasks.forEach(callback => callback?.());
        qtSim.doCycle(true);
        qtSim.endCycleTasks.forEach(callback => callback?.());
    }
}

function iterateBothSimulationsReverse() {
    if (!fsSim.runningIntervalId && !qtSim.runningIntervalId) {
        fsSim.simulationSpeed *= -1;
        qtSim.simulationSpeed *= -1;

        fsSim.doCycle(true);
        fsSim.endCycleTasks.forEach(callback => callback?.());
        qtSim.doCycle(true);
        qtSim.endCycleTasks.forEach(callback => callback?.());

        fsSim.simulationSpeed *= -1;
        qtSim.simulationSpeed *= -1;
    }
}

function increaseSimulationSpeed() {
    currentSimulation.simulationSpeed += 0.1;
}

function decreaseSimulationSpeed() {
    currentSimulation.simulationSpeed -= 0.1;
}

function switchSimulationFocus() {
    const condition = Object.is(currentSimulation, fsSim);
    currentSimulation = condition === true ? qtSim : fsSim;
    for(let sim of document.querySelectorAll('.bubble-simulation')) {
        sim.classList.toggle('bubble-simulation_focused');
    }
    let radioFss = document.getElementById("swtichSimFss");
    radioFss.checked = !condition;
    let radioQts = document.getElementById("swtichSimQts");
    radioQts.checked = condition;

    clearSimsCallbacks();
    document.getElementById('0').checked = true;

    const qtsimOnlyControlIds = ['2','4','5','6','7'];
    const fssimOnlyControlIds = ['1', '3'];

    const [toTurnOn, toTurnOff] = condition === true ? [qtsimOnlyControlIds, fssimOnlyControlIds] : [fssimOnlyControlIds, qtsimOnlyControlIds];

    for(let controlId of toTurnOn) {
        document.getElementById(controlId).disabled = false;
        document.getElementById(controlId).checked = false;
    }
    for(let controlId of toTurnOff) {
        document.getElementById(controlId).disabled = true;
        document.getElementById(controlId).checked = false;
    }

    document.getElementById('ConstantCycleTime').checked = currentSimulation.constantCycleTime;
    document.getElementById('simulationSpeed').value = currentSimulation.simulationSpeed;
    document.getElementById('simulationSpeedRange').value = currentSimulation.simulationSpeed;
    
    document.getElementById('togglePlayStop').value = currentSimulation.runningIntervalId ? 'stop' : 'run';
}

function rewindSimulation() {
    const numberOfCycles = Number(prompt('Input a number of cycles to rewind. Number could be negative', 50));
    if (!numberOfCycles) {
        alert("Incorrect value for number of cycles, try inputting a number");
        return;
    }
    const rewindConfirmed = confirm(`Are you sure you want to rewind ${Math.abs(numberOfCycles)} ${numberOfCycles < 0 ? "backwards" : ""}?`);
    if (!rewindConfirmed) {
        return;
    }

    const start = new Date().getTime();
    currentSimulation.rewind(numberOfCycles);
    const end = new Date().getTime();

    alert(`Rewinding \n${Math.abs(numberOfCycles)} cycles ${numberOfCycles < 0 ? "backwards" : ""}\ntook: ${end - start}ms`);
}

function clearSimulationCallbacks() {
    clearSimsCallbacks();
}

function logFullSearchAvgCycle() {
    clearSimsCallbacks();
    fsSim.endCycleTasks.push(EndCycleActions._logAvgCycleFactory(fsSim));
}

function logQuadTreeAvgCycle() {
    clearSimsCallbacks();
    qtSim.endCycleTasks.push(EndCycleActions._logAvgCycleFactory(qtSim));
}

function logFullSearchEnergy() {
    clearSimsCallbacks();
    fsSim.endCycleTasks.push(() => { EndCycleActions.logSystemsEnergy(fsSim); });
}

function logQuadTreeEnergy() {
    clearSimsCallbacks();
    qtSim.endCycleTasks.push(() => { EndCycleActions.logSystemsEnergy(qtSim); });
}

function drawQuadTreeGrid() {
    clearSimsCallbacks();
    qtSim.endCycleTasks.push(() => { EndCycleActions.cleanSimulationBackground(qtSim); });
    qtSim.endCycleTasks.push(() => { EndCycleActions.drawQuadTreeGrid(qtSim); });
}

function drawBubbleContactBranches() {
    clearSimsCallbacks();
    let bubble = qtSim.bubbles[0];
    
    const initialHue = bubble.element.style.getPropertyValue('--hue');
    bubble.element.style.setProperty('--hue-init', initialHue);
    bubble.element.style.setProperty('--hue', '0');

    qtSim.endCycleTasks.push(() => { EndCycleActions.cleanSimulationBackground(qtSim); });
    qtSim.endCycleTasks.push(() => { EndCycleActions.drawQuadTreeGrid(qtSim); });
    qtSim.endCycleTasks.push(() => { EndCycleActions.bubbleContactBranches(qtSim); });
}

function markClosestBubbles() {
    clearSimsCallbacks();
    qtSim.endCycleTasks.push(() => { EndCycleActions.unmarkBubbles(qtSim); });
    qtSim.endCycleTasks.push(() => { EndCycleActions.markClosestBubbles(qtSim, qtSim.bubbles[0]); });
}

// rather an easter egg than actual functionality
function toggleKeyControls() {
    [controlFuncs, controlFuncsBackup] = controlFuncsBackup ? [controlFuncsBackup, null] : [{ '\\': toggleKeyControls }, controlFuncs];
}

let controlFuncsBackup = null;
let controlFuncs = {
    ' ': togglePlayStop,
    'x': restartSimulation,
    'q': quickRestartSimulation,
    's': saveSimulationState,
    'b': loadSimulationState,
    'S': startAutoSave,
    'c': stopAutoSave,
    'i': iterateSimulation,
    'I': iterateSimulationReverse,
    'v': toggleConstantCycleTime,
    '.': iterateBothSimulations,
    ',': iterateBothSimulationsReverse,
    'ArrowUp': increaseSimulationSpeed,
    'ArrowDown': decreaseSimulationSpeed,
    'a': switchSimulationFocus,
    'r': rewindSimulation,
    '0': clearSimulationCallbacks,
    '1': logFullSearchAvgCycle,
    '2': logQuadTreeAvgCycle,
    '3': logFullSearchEnergy,
    '4': logQuadTreeEnergy,
    '5': drawQuadTreeGrid,
    '6': drawBubbleContactBranches,
    '7': markClosestBubbles,
    '\\': toggleKeyControls,
};

document.addEventListener('keydown', (e) => {
    controlFuncs[e.key] ? controlFuncs[e.key]() : console.log(`${e.key}`);
});


document.getElementById('randomisePositions').addEventListener('change', e => generatingRules.randomisePositions = e.target.checked);

for(let numInput of document.querySelectorAll('#bubbleGenerationSettings .gui__input_number:nth-of-type(n + 2)')) {
    numInput.addEventListener('mousewheel', e => {
        syncControlValues(e.target.id, e.target.previousElementSibling.id);
        // e.target.dispatchEvent(new Event('change'));
        generatingRules[e.target.id] = Number(e.target.value);
    });
}

document.getElementById('simulationSpeed').addEventListener('mousewheel', e => {
    syncControlValues(e.target.id, e.target.previousElementSibling.id);
    // e.target.dispatchEvent(new Event('change'));
    currentSimulation.simulationSpeed = e.target.value;
});

document.getElementById("EndCycleCallbacks").addEventListener("change", e => {
    if(!e.target.matches(".gui__input_radio")) {
        return;
    }

    controlFuncs[e.target.id]();
});


function syncControlValues(sourceControl, targetControl) {
    document.getElementById(targetControl).value = document.getElementById(sourceControl).value;
}





function startDragging(e, callback) {
    e.target.dataset.dragging = 'yes';
    callback?.(e);
}

function continueDragging(e, callback) {
    if (!e.target.dataset.dragging) {
        return;
    }
    callback?.(e);
}

function stopDragging(e, callback) {
    delete e.target.dataset.dragging;
    callback?.(e);
}

function setupDragResponsiveRange(rangeEl, callback) {
    rangeEl.addEventListener('mousedown', e => { startDragging(e, callback); } );
    rangeEl.addEventListener('mousemove', e => { continueDragging(e, callback); });
    rangeEl.addEventListener('mouseup', e => { stopDragging(e, callback); });
}

for(let rangeInput of document.querySelectorAll('input[type="range"]')) {
    if(rangeInput.id === 'simulationSpeedRange') {
        continue;
    }
    setupDragResponsiveRange(rangeInput, e => {
        const min = Number(e.target.min);
        const max = Number(e.target.max);
        const step = Number(e.target.step);

        let cursorPosition = (e.clientX - e.target.getBoundingClientRect().x) / e.target.getBoundingClientRect().width;
        cursorPosition = cursorPosition > 0 ? cursorPosition : 0;
        cursorPosition = cursorPosition < 1 ? cursorPosition : 1;
        
        const newValue = Math.ceil((max - min) / step * cursorPosition) * step + min;
        
        e.target.value = newValue;
        e.target.nextElementSibling.value = newValue;
        
        generatingRules[e.target.nextElementSibling.id] = newValue;
        restartSimulation();
    });
}

setupDragResponsiveRange(document.getElementById('hueRange'), e => {
    const newHue = Math.ceil(360 * (e.clientX - e.target.getBoundingClientRect().x) / e.target.getBoundingClientRect().width);
    e.target.style.setProperty('--hue', newHue);
    e.target.dataset.info = `Selected hue: ${newHue}`;
    e.target.nextElementSibling.value = newHue;

    generatingRules['hue'] = newHue;
    currentSimulation.tintBubbles(newHue);
});

setupDragResponsiveRange(document.getElementById('simulationSpeedRange'), e => {
    const min = Number(e.target.min);
    const max = Number(e.target.max);
    const step = Number(e.target.step);

    let cursorPosition = (e.clientX - e.target.getBoundingClientRect().x) / e.target.getBoundingClientRect().width;
    cursorPosition = cursorPosition > 0 ? cursorPosition : 0;
    cursorPosition = cursorPosition < 1 ? cursorPosition : 1;
    
    const newSpeed = Math.ceil((max - min) / step * cursorPosition) * step + min;
    
    e.target.nextElementSibling.value = newSpeed;
    e.target.style.setProperty('--hue', newSpeed);
    e.target.dataset.info = `Selected hue: ${newSpeed}`;

    currentSimulation.simulationSpeed = newSpeed;
});