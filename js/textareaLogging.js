const logarea = document.getElementById('log-area');
const maxLines = 25;

let logareaCleanupTimeoutId = 0;
let logareaCleanupIntervalId = 0;

function startLogareaCleanup() {
    logareaCleanupIntervalId = setInterval(() => {
        const lines = logarea.value.split('\n');
        if(lines.length < 2) {
            logarea.value = "";
            clearInterval(logareaCleanupIntervalId);
            logareaCleanupIntervalId = 0;
            return;
        }
        lines.pop();
        logarea.value = lines.join('\n');
    }, 50);
}

function scheduleLogareaCleanup() {
    logareaCleanupTimeoutId = setTimeout(() => {
        startLogareaCleanup();
    }, 3000);
}

const logToTextarea = function(obj) {
    clearTimeout(logareaCleanupTimeoutId);
    clearInterval(logareaCleanupIntervalId);

    const lines = logarea.value.split('\n');
    if(lines.length >= maxLines) {
        lines.pop();
    }

    logarea.value = obj.toString() + '\n' + lines.join('\n');

    scheduleLogareaCleanup();
}

const vanilaConsoleLog = console.log;

console.log = (...args) => {
    vanilaConsoleLog(...args);
    logToTextarea(...args);
}