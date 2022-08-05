animateLogo("2048", document.getElementById("logo"), {});

const size = document.getElementById("size");
const goal = document.getElementById("goal");
const submit = document.getElementById("submit");

const sizeCounter = new Counter(size, 4);
sizeCounter.decrement.disabled = true;
sizeCounter.onincrement = () => {
    sizeCounter.value = Math.max(Math.min(sizeCounter.value + 1, 10), 4);
    checkSize(), checkGoal();
}
sizeCounter.ondecrement = () => {
    sizeCounter.value = Math.max(Math.min(sizeCounter.value - 1, 10), 4);
    checkSize(), checkGoal();
}

const goalCounter = new Counter(goal, 2048n);
goalCounter.decrement.disabled = true;

const checkSize = () => {
    sizeCounter.increment.disabled = sizeCounter.value >= 10;
    sizeCounter.decrement.disabled = sizeCounter.value <= 4;
}

const checkGoal = () => {
    const max = 2n ** (BigInt(sizeCounter.value) ** 2n);
    if (goalCounter.value >= max) {
        goalCounter.value = max;
        goalCounter.increment.disabled = true;
    } else {
        goalCounter.increment.disabled = false;
    }
    if (goalCounter.value <= 2048n) {
        goalCounter.value = 2048n;
        goalCounter.decrement.disabled = true;
    } else {
        goalCounter.decrement.disabled = false;
    }
}

goalCounter.onincrement = () => {
    goalCounter.value *= 2n;
    checkGoal();
}
goalCounter.ondecrement = () => {
    goalCounter.value /= 2n;
    checkGoal();
}

submit.onclick = () => {
    location.href = `../../games/2048/game.html?size=${sizeCounter.value}&goal=${goalCounter.value}`
}
