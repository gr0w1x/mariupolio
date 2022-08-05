animateLogo("SNAKE", document.getElementById("logo"), {});

const size = document.getElementById("size");
const speed = document.getElementById("speed");

const sizeCounter = new Counter(size, 10);
sizeCounter.decrement.disabled = true;
sizeCounter.onincrement = () => {
    sizeCounter.value = Math.max(Math.min(sizeCounter.value + 1, 25), 10);
    checkSize();
}
sizeCounter.ondecrement = () => {
    sizeCounter.value = Math.max(Math.min(sizeCounter.value - 1, 25), 10);
    checkSize();
}

const checkSize = () => {
    sizeCounter.increment.disabled = sizeCounter.value >= 25;
    sizeCounter.decrement.disabled = sizeCounter.value <= 10;
}

const speedCounter = new Counter(speed, 2);
speedCounter.onincrement = () => {
    speedCounter.value = Math.max(Math.min(speedCounter.value + 1, 5), 1);
    checkSpeed();
}
speedCounter.ondecrement = () => {
    speedCounter.value = Math.max(Math.min(speedCounter.value - 1, 5), 1);
    checkSpeed();
}

const checkSpeed = () => {
    speedCounter.increment.disabled = speedCounter.value >= 5;
    speedCounter.decrement.disabled = speedCounter.value <= 1;
}

submit.onclick = () => {
    location.href = `../../games/snake/game.html?size=${sizeCounter.value}&speed=${speedCounter.value}`
}
