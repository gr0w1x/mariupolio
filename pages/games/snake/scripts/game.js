const side = {
    left: "LEFT",
    right: "RIGHT",
    top: "TOP",
    bottom: "BOTTOM",
}

const state = {
    win: "WIN",
    lose: "LOSE",
    play: "PLAY",
    init: "INIT",
}

const sideOrder = [
    side.right,
    side.top,
    side.left,
    side.bottom,
];

const fruits = [
    "🍎",
    "🍉",
    "🍒",
    "🍋",
    "🥝",
    "🍓",
    "🍐",
];

function range(from, to) {
    if (to === undefined) {
        to = from;
        from = 0;
    }
    return new Array(to - from).fill(0).map((_, i) => from + i);
}

function zip(a, b) {
    return range(a.length).map(i => [a[i], b[i]]);
}

Array.prototype.shuffle = function () {
    return this.map(i => [i, Math.random()])
        .sort(([_f, f], [_s, s]) => s - f)
        .map(([i, _]) => i);
}

class SnakeGame {
    #direction;
    
    constructor (
        width,
        height,
        speed,
    ) {
        this.width = width;
        this.height = height;
        this.speed = speed;

        const center = {
            x: Math.floor(width / 2),
            y: Math.floor(height / 2),
        };
        this.snake = [{
            ...center,
            x: center.x + 1,
        }, center, {
            ...center,
            x: center.x - 1,
        }];
        this.#direction = side.right;
        this.fruit = this.free.shuffle()[0];
        this.fruit.emoji = fruits.shuffle()[0];
        
        this.state = state.init;
    }
    
    static directionToVector = {
        [side.left]: {
            x: -1,
            y: 0,
        },
        [side.right]: {
            x: 1,
            y: 0,
        },
        [side.top]: {
            x: 0,
            y: -1,
        },
        [side.bottom]: {
            x: 0,
            y: 1,
        },
    };
    
    get direction() {
        return this.#direction;
    }
    set direction(value) {
        const prev = this.#direction;
        this.#direction = value;
        const next = this.next;
        const second = this.snake[1];
        if (second.x === next.x && second.y === next.y) {
            this.#direction = prev;
            throw new Error("snake cannot change their direction to opposite");
        }
    }
    
    get next() {
        const head = this.snake[0];
        const v = SnakeGame.directionToVector[this.direction];
        return {
            x: head.x + v.x,
            y: head.y + v.y,
        }
    }
    
    get free() {
        const all = range(this.width * this.height);
        const snake = new Set(this.snake.map(cell => cell.y * this.width + cell.x));
        const free = all.filter(n => !snake.has(n));
        return free.map(n => ({
           x: n % this.width,
           y: Math.floor(n / this.width),
        }));
    }
    
    move() {
        const next = this.next;
        if (this.state === state.init) {
            this.state = state.play;
            this.started = new Date();
        }
        if (
            this.snake.slice(0, -1).some(cell => cell.x === next.x && cell.y === next.y) ||
            next.x < 0 || next.x >= this.width ||
            next.y < 0 || next.y >= this.height
        ) {
            this.state = state.lose
            this.finished = new Date();
return;
        }
        this.snake.unshift(next);
        if (this.fruit.x === next.x && this.fruit.y === next.y) {
            if (this.snake.length === this.width * this.height) {
                this.state = state.win;
                this.finished = new Date();
                delete this.fruit;
            } else {
                this.fruit = this.free.shuffle()[0];
                this.fruit.emoji = fruits.shuffle()[0];
            }
        } else {
            this.snake.pop();
        }
    }
}

function setup(elements) {
    const game = create();
    bind(game, elements);
    render(game, elements);
}

function save(game) {
    if (game.saved) {
        return;
    }

    const name = prompt("Name");

    if (name) {
        STORAGE.scores.push({
            name,
            width: game.width,
            height: game.height,
            speed: game.speed,
            score: game.snake.length,
            time: (+game.finished) - (+game.started),
        });
        localStorage.setItem("snake", JSON.stringify(scores));
        game.saved = true;
    }
}

function create() {
    return new SnakeGame(size, size, speed);
}

function bind(game, elements) {
    const {
        retry,
        save: saveElement,
    } = elements;
 
    const moveEndsHandler = (e) => {
        if (![state.play, state.init].includes(game.state)) {
            return;
        }
        
        const current = {
            x: e.screenX,
            y: e.screenY,
        }

        const last = window.last;
        delete window.last;

        const radius = {
            x: current.x - last.x,
            y: last.y - current.y,
        };
        if (Math.hypot(radius.x, radius.y) < 50) {
            return;
        }
        let angle = Math.atan2(radius.y, radius.x);
        if (angle < 0) {
            angle = 2 * Math.PI + angle;
        }
        let quarter = Math.floor(2 * angle / Math.PI);
        const diff = angle % (Math.PI / 2);
        if (diff > Math.PI / 4) {
            quarter = (quarter + 1) % 4;
        }
        game.direction = sideOrder[quarter];
        
        if (game.state === state.init) {
            game.move();
            render(game, elements);
            window.tickId = setInterval(() => {
                if (game.state === state.play) {
                    game.move();
                    render(game, elements);
                }
            }, 1000 / game.speed);
        }
        
        render(game, elements);
    }

    window.ontouchend = (e) => moveEndsHandler(e.changedTouches[0]);
    window.onmouseup = moveEndsHandler;

    retry.onclick = (e) => {
        unbind(game, elements);
        setup(elements);
        e.stopPropagation();
    }

    saveElement.onclick = () => {
        save(game);
        render(game, elements);
    }
}

function render(game, {
    board,
    score,
    retry,
    save,
}) {
    const [snake, fruit] = board.children;
    for (let [cell, element] of zip(game.snake, snake.children)) {
        if (element === undefined) {
            element = document.createElement("div");
            element.classList.add("snake");
            element.style.width = (100 / game.width) + "%";
            element.style.height = (100 / game.height) + "%";
            snake.appendChild(element);
        }
        if (cell === game.snake[0]) {
            element.classList.remove(...Object.values(side));
            element.classList.add(game.direction);
        }
        element.style.left = (100 * cell.x / game.width) + "%";
        element.style.top = (100 * cell.y / game.height) + "%";
    }
    if (game.fruit) {
        fruit.style.left = (100 * game.fruit.x / game.width) + "%";
        fruit.style.top = (100 * game.fruit.y / game.height) + "%";
        fruit.style.width = (80 / game.width) + "%";
        fruit.style.height = (80 / game.height) + "%";
        fruit.style.fontSize = Math.floor(0.6 * elements.board.clientWidth / game.width) + "px";
        fruit.innerHTML = game.fruit.emoji;
    }
    score.innerText = game.snake.length;
    retry.hidden = ![state.win, state.lose].includes(game.state);
    save.hidden = retry.hidden || game.saved;
}

function unbind(game, {
    board,
}) {
    clearInterval(window.tickId);
    delete window.tickId;
    window.onpointerup = undefined;
    window.onpointercancel = undefined;
    const [snake] = board.children;
    snake.innerText = "";
}

const query = new URL(document.location);

const size = Number(query.searchParams.get("size")) || 10;
const speed = Number(query.searchParams.get("speed")) || 2;

const STORAGE = JSON.parse(localStorage.getItem("2048")) || {
    scores: [],
};

const elements = {
    board: document.getElementById("board"),
    score: document.getElementById("score"),
    retry: document.getElementById("retry"),
    save: document.getElementById("save"),
};

const moveStartsHandler = (e) => {
    window.last = {
        x: e.screenX,
        y: e.screenY,
    }
}

window.onmousedown = moveStartsHandler
window.ontouchstart = (e) => moveStartsHandler(e.touches[0]);

try {
    setup(elements);
} catch (e) {
    console.error(e.name + ":", e.message);
}
