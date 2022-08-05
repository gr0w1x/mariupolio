const side = {
    left: "LEFT",
    right: "RIGHT",
    top: "TOP",
    bottom: "BOTTOM",
};

const SIDE_ORDER = [
    side.right,
    side.top,
    side.left,
    side.bottom,
];

const state = {
    win: "WIN",
    lose: "LOSE",
    play: "PLAY",
};

Array.prototype.shuffle = function () {
    return this
        .map(i => [i, Math.random()])
        .sort(([_f, f], [_s, s]) => f - s)
        .map(([i, ]) => i);
};
Array.prototype.sum = function (mapper = id => id) {
    return this.reduce((p, c) => p + mapper(c), 0);
}
Array.prototype.equal = function (another) {
    if (this.length !== another.length) {
        return false;
    }
    for (let i = 0; i < this.length; i++) {
        if (this[i] !== another[i]) {
            return false;
        }
    }
    return true;
};
Array.range = function (n) {
    return new Array(n).fill(0).map((_, i) => i);
}

function groupBy(iterable, mapper) {
    const map = new Map();
    for (const i of iterable) {
        const key = mapper(i);
        if (!map.has(key)) {
            map.set(key, [i]);
        } else {
            map.get(key).push(i);
        }
    }
    return map;
}

class _2048 {
    constructor(n, goal) {
        this.cells = new Map();
        this.n = n;
        this.goal = goal;
        this.place();
    }

    coordsToId(x, y) {
        return y * this.n + x;
    }
    
    idToCoords(id) {
        return [id % this.n, Math.floor(id / this.n)];
    }
    
    * free() {
        for (let i = 0; i < this.n ** 2; i++) {
            if (!this.cells.has(i)) {
                yield i;
            }
        }
    }
    
    * adjacent(id) {
        const [x, y] = this.idToCoords(id);
        if (x > 0) {
            yield this.coordsToId(x - 1, y);
        }
        if (x < this.n - 1) {
            yield this.coordsToId(x + 1, y);
        }
        if (y > 0) {
            yield this.coordsToId(x, y - 1);
        }
        if (y < this.n - 1) {
            yield this.coordsToId(x, y + 1);
        }
    }
    
    get canPlace() {
        return this.cells.size !== this.n ** 2;
    }
    
    get canMove() {
        if (this.canPlace) {
            return true;
        }
        
        for (const cell of this.cells.keys()) {
            for (const adjacent of this.adjacent(cell)) {
                if (this.cells.get(cell).value === this.cells.get(adjacent).value) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    get state() {
        if (this.canMove) {
            return state.play;
        }
        return this.biggest >= this.goal ? state.win : state.lose;
    }
    
    get biggest() {
        return Math.max(...Array.from(this.cells.values()).map(({ value }) => value));
    }
    
    get score() {
        return Array.from(this.cells.values()).sum(({ value }) => value);
    }
    
    * flow(direction) {
        const cells = Array.from(this.cells.entries());
        const grouper = [side.left, side.right].includes(direction) ? (([id,]) => Math.floor(id / this.n)) : (([id,]) => id % this.n);
        const sorter = [side.left, side.top].includes(direction) ? (([f,], [s,]) => f - s) : (([f,], [s,]) => s - f);
        
        const idGenerators = {
            [side.left]: (i) => Array.range(this.n).map(j => i * this.n + j),
            [side.right]: (i) => idGenerators[side.left](i).reverse(),
            [side.top]: (j) => Array.range(this.n).map(i => i * this.n + j),
            [side.bottom]: (j) => idGenerators[side.top](j).reverse(),
        };
        
        let groups = groupBy(cells, grouper);
        for (const [key, items] of groups.entries()) {
            yield {
                ids: idGenerators[direction](key),
                items: items.sort(sorter),
            };
        }
    }
    
    place() {
        const free = Array.from(this.free());
        if (free.length === 0) {
            throw new Error("no free space");
        }
        const id = free.shuffle()[0];
        this.cells.set(id, {
            value: Math.random() <= 0.75 ? 2 : 4,
            id,
        });
    }
    
    move(direction) {
        const prev = Array.from(this.cells.keys()).sort();
        
        for (const { ids, items } of this.flow(direction)) {
            for (const [id] of items) {
                this.cells.delete(id);
            }
            
            let i = 0;
            let previousMerged = false;
            
            for (const [, item] of items) {
                const previous = this.cells.get(ids[i - 1]);
                if (!previousMerged && previous && previous.value === item.value) {
                    previous.value *= 2;
                    item.merged = previous;
                    previousMerged = true;
                }
                else {
                    this.cells.set(ids[i++], item);
                    previousMerged = false;
                }
                item.id = ids[i - 1];
            }
        }
        
        const current = Array.from(this.cells.keys()).sort();
        
        if (!current.equal(prev) && this.canPlace) {
            this.place();
        }
    }
}

const QUERY = new URL(document.location);
const SIZE = Number(QUERY.searchParams.get("size")) || 4;
const GOAL = Number(QUERY.searchParams.get("goal")) || 2048;

const STORAGE = JSON.parse(localStorage.getItem("2048")) || {
    scores: [],
};

const ELEMENTS = {
    board: document.getElementById("board"),
    score: document.getElementById("score"),
    goal: document.getElementById("goal"),
    retry: document.getElementById("retry"),
    save: document.getElementById("save"),
}

function createGame() {
    return new _2048(SIZE, GOAL);
}

function bindGame(game, elements) {
    const moveStartsHandler = (e) => {
        window.last = {
            x: e.screenX,
            y: e.screenY,
        }
    };
    window.ontouchstart = (e) => moveStartsHandler(e.touches[0]);
    window.onmousedown = moveStartsHandler;

    const moveEndsHandler = (e) => {
        if (game.state !== state.play || elements.board.mergedCount) {
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

        if (!game.started) {
            game.started = new Date();
        }

        const direction = SIDE_ORDER[quarter];
        game.move(direction);
        renderGame(game, elements);

        if (game.state !== state.play) {
            game.finished = new Date();
        }
    };

    window.ontouchend = (e) => moveEndsHandler(e.changedTouches[0]);
    window.onmouseup = moveEndsHandler;

    window.cellElements = new Map();
    
    elements.retry.onclick = () => {
        unbindGame(game, elements);
        setupGame(elements);
    }

    elements.save.onclick = () => {
        if (!elements.save.saved) {
            const name = prompt("name");
            STORAGE.scores.push({
                name,
                score: game.score,
                size: game.n,
                goal: game.goal,
                biggest: game.biggest,
                time: (+game.finished) - (+game.started),
            });
        }
        localStorage.setItem("2048", JSON.stringify(STORAGE));
        elements.save.saved = true;
    }
}

const CELL_STYLES = [{
    "--accent": "#ff583c", // 2
}, {
    "--accent": "#2d92e5", // 4
}, {
    "--accent": "#bae88a", // 8
}, {
    "--accent": "#bf57dc", // 16
}, {
    "--accent": "#34de4a", // 32
}, {
    "--accent": "#d0475e", // 64
}, {
    "--accent": "#3a3ce6", // 128
}, {
    "--accent": "#d529b4", // 256
}, {
    "--accent": "#4aa90d", // 512
}, {
    "--accent": "#daa23b", // 1024
}, {
    "--accent": "#aaaaaa", // 2048
}].map(style => ({
    ...style,
    "--background": style["--accent"] + "33",
}));

function cellToStyle(value)  {
    return CELL_STYLES[(Math.log2(value) - 1) % CELL_STYLES.length];
}

function renderGame(game, elements) {
    function renderCell(cell, element) {
        element.innerText = cell.value;
        element.style.fontSize = `${0.6 * elements.board.clientWidth / game.n / Math.sqrt(String(cell.value).length)}px`;
        for (const [property, value] of Object.entries(cellToStyle(cell.value))) {
            element.style.setProperty(property, value);
        }
    }

    elements.board.mergedCount = Array.from(window.cellElements.keys()).filter(cell => cell.merged).length;

    for (const cell of game.cells.values()) {
        if (!window.cellElements.has(cell)) {
            const element = document.createElement("div");
            element.classList.add("cell");
            element.style.width = `${100 / game.n}%`;
            element.style.height = `${100 / game.n}%`;
            element.ontransitionend = () => {
                if (cell.merged) {
                    window.cellElements.delete(cell);
                    elements.board.removeChild(element);
                    renderCell(cell.merged, window.cellElements.get(cell.merged));
                    elements.board.mergedCount--;
                } else {
                    renderCell(cell, element);
                }
            }
            renderCell(cell, element);
            window.cellElements.set(cell, element);
            elements.board.appendChild(element);
        }
    }

    for (const [cell, element] of window.cellElements.entries()) {
        const [x, y] = game.idToCoords(cell.id);
        element.style.left = `${100 * x / game.n}%`;
        element.style.top = `${100 * y / game.n}%`;
    }

    const s = game.state;

    elements.score.innerText = game.score;
    elements.goal.innerText =
        s === state.play ? `${game.biggest}/${game.goal}` :
            s === state.win ? "YOU WIN" : "YOU LOSE";

    elements.retry.hidden = s === state.play;
    elements.save.hidden = s === state.play;
    elements.save.disable = elements.save.saved;
}

function unbindGame(game, elements) {
    window.ontouchstart = null;
    window.ontouchend = null;
    window.onmousedown = null;
    window.onmouseup = null;
    delete window.cellElements;
    elements.board.innerText = "";
    delete elements.save.saved;
}

function setupGame() {
    const game = createGame();
    bindGame(game, ELEMENTS);
    renderGame(game, ELEMENTS);
}

try {
    setupGame();
} catch (e) {
    console.error(e);
}
