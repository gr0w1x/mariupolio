animateLogo("MINESWEEPER", document.getElementById("logo"), {});

const width = document.getElementById("width");
const height = document.getElementById("height");
const bombs = document.getElementById("bombs");

const widthCounter = new Counter(width, 10);
widthCounter.decrement.disabled = true;
widthCounter.onincrement = () => {
    widthCounter.value = Math.max(Math.min(widthCounter.value + 1, 50), 10);
    checkWidth(), checkBombs();
}
widthCounter.ondecrement = () => {
    widthCounter.value = Math.max(Math.min(widthCounter.value - 1, 50), 10);
    checkWidth(), checkBombs();
}

const checkWidth = () => {
    widthCounter.increment.disabled = widthCounter.value >= 50;
    widthCounter.decrement.disabled = widthCounter.value <= 10;
}

const heightCounter = new Counter(height, 10);
heightCounter.decrement.disabled = true;
heightCounter.onincrement = () => {
    heightCounter.value = Math.max(Math.min(heightCounter.value + 1, 50), 10);
    checkHeight(), checkBombs();
}
heightCounter.ondecrement = () => {
    heightCounter.value = Math.max(Math.min(heightCounter.value - 1, 50), 10);
    checkHeight(), checkBombs();
}

const checkHeight = () => {
    heightCounter.increment.disabled = heightCounter.value >= 50;
    heightCounter.decrement.disabled = heightCounter.value <= 10;
}

const bombsCounter = new Counter(bombs, 15);

bombsCounter.onincrement = () => {
    bombsCounter.value += 1;
    checkBombs();
}

bombsCounter.ondecrement = () => {
    bombsCounter.value -= 1;
    checkBombs();
}

const checkBombs = () => {
    const max = widthCounter.value * heightCounter.value - 1;
    if (bombsCounter.value >= max) {
        bombsCounter.value = max;
        bombsCounter.increment.disabled = true;
    } else {
        bombsCounter.increment.disabled = false;
    }
    if (bombsCounter.value <= 1) {
        bombsCounter.value = 1;
        bombsCounter.decrement.disabled = true;
    } else {
        bombsCounter.decrement.disabled = false;
    }
}

submit.onclick = () => {
    location.href = `../../games/minesweeper/game.html?width=${widthCounter.value}&height=${heightCounter.value}&bombs=${bombsCounter.value}`
}
