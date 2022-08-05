const gameState = {
    win: "WIN",
    lose: "LOSE",
    play: "PLAY",
}

const gameStateToString = {
    [gameState.win]: "😎",
    [gameState.lose]: "💀",
    [gameState.play]: "🙂",
}

function range(f, t) {
    if (t === undefined) {
        t = f;
        f = 0;
    }
    return new Array(t - f).fill(0).map((_, i) => f + i);
}

function* zip(f, s) {
    for (let i = 0; i < f.length; i++) {
        yield [f[i], s[i]];
    }
}

Array.prototype.shuffle = function () {
    return this.map(i => [i, Math.random()])
        .sort(([_f, f], [_s, s]) => s - f)
        .map(([i, _]) => i);
}

function variative(n, k) {
    return Math.min(k, n - k);
}

function* A(n, k) {
    if (k > n || n < 0 || k < 0) {
        return;
    }
    if (k === 0 || n === k) {
        yield new Array(n).fill(n === k);
        return;
    }
    for (const head of [false, true]) {
        for (const tail of A(n - 1, k - head)) {
            yield [head, ...tail];
        }
    }
}

class Minesweeper {
    constructor(
        width,
        height
    ) {
        this.board = range(height)
            .map(_ => range(width).map(_ => ({
                opened: false,
                marked: false,
                isBomb: false,
            })));
    }
    
    get width() {
        return this.board[0].length;
    }
    
    get height() {
        return this.board.length;
    }
    
    fillBombs(bombs, x, y) {
        this.board
            .flatMap(
                (r, i) => r.map(
                    (c, j) => {
                        if (i !== y || j !== x) {
                            return c;
                        }
                    }
            ))
            .filter(c => c)
            .map(c => [c, Math.random()])
            .sort(([_f, f], [_s, s]) => s - f)
            .slice(0, bombs)
            .forEach(([c, _]) => {
                c.isBomb = true;
            });
    }
    
    getCell(x, y) {
        return this.board[y][x];
    }
    
    setCell(x, y, value) {
        this.board[y][x] = value;
    }
    
    coordsToId(x, y) {
        return y * this.width + x;
    }
    
    idToCoords(id) {
        return [id % this.width, Math.floor(id / this.width)];
    }
    
    * adjacent(x, y) {
        for (let i of [-1, 0, 1]) {
            if (y + i >= 0 && y + i < this.height) {
                for (let j of [-1, 0, 1]) {
                    if (x + j >= 0 && x + j < this.width && (i !== 0 || j !== 0)) {
                        yield [x + j, y + i];
                    }
                }
            }
        }
    }
    
    count(x, y) {
        return Array.from(this.adjacent(x, y))
        .map(([x, y]) => {
            const cell = this.getCell(x, y);
            return cell.isBomb;
        })
        .filter(id => id)
        .length;
    }
    
    get state() {
        const cells = this.board.flatMap(id => id);
        if (cells.some(c => c.opened && c.isBomb)) {
            return gameState.lose;
        }
        if (cells.every(c => c.opened || c.isBomb)) {
            return gameState.win;
        }
        return gameState.play;
    }

    get front() {
        return this.board.flatMap((row, i) =>
        row.map((cell, j) => {
            if (!cell.opened) { return; }
            const closed = Array.from(this.adjacent(j, i)).filter(([x, y]) => !this.getCell(x, y).opened);
            const k = closed.filter(([x, y]) => this.getCell(x, y).isBomb).length;
            
            if (closed.length === 0) { return; }
            
            return {
                id: this.coordsToId(j, i),
                closed: closed.map(coords => this.coordsToId(...coords)),
                k,
            };
        }).filter(id => id));
    }
    
    get back() {
        return this.board.flatMap((row, i) =>
        row.map((cell, j) => {
            if (cell.opened) { return; }
            const adjacent = Array.from(this.adjacent(j, i));
            if (adjacent.every(([x, y]) => !this.getCell(x, y).opened)) {
                return cell;
            }
        }).filter(id => id));
    }
    
    get closed() {
        return this.board.flatMap((row, i) => row.map((cell, j) => ({
            cell,
            coords: [j, i],
        })).filter(({ cell }) => !cell.opened));
    }
}

function* possibleBombs(
    front,
    closed,
    bombs,
    back,
) {
    if (bombs < 0) {
        return;
    }
    
    let [head, ...tail] = front;
    if (!head) {
        if (bombs <= back) {
            yield [closed, bombs];
        }
        return;
    }
    
    head = {
        ...head,
        closed: head.closed.filter(id => closed[id] === undefined),
        k: head.k - head.closed.filter(id => closed[id] === true).length,
    }
    
    for (const placed of A(head.closed.length, head.k)) {
        const newClosed = { ...closed };
        for (let i = 0; i < placed.length; i++) {
            newClosed[head.closed[i]] = placed[i];
        }
        
        for (const solution of possibleBombs(tail, newClosed, bombs - head.k, back)) {
            yield solution;
        }
    }
}

class MinesweeperController {
    constructor(game) {
        this.game = game;
    }
    
    start(x, y, bombs) {
        this.game.fillBombs(bombs, x, y);
        this.started = new Date();
        this.smartOpen(x, y);
    }
    
    smartOpen(x, y) {
        const cell = this.game.getCell(x, y);
        if (cell.isBomb) {
            cell.opened = true;
            cell.marked = false;
            this.render && this.render();
            return;
        }
        const width = this.game.width;
        const queue = [y * width + x];
        const visited = new Set();
        visited.add(y * width + x);
        while (queue.length !== 0) {
            const c = queue.pop();
            const x = c % width;
            const y = Math.floor(c / width);

            const cell = this.game.getCell(x, y);
            cell.opened = true;
            cell.marked = false;
            
            if (this.game.count(x, y) === 0) {
                for (const coords of this.game.adjacent(x, y)) {
                    const hashed = coords[1] * width + coords[0];
                    if (!visited.has(hashed) && !this.game.getCell(coords[0], coords[1]).opened) {
                        visited.add(hashed);
                        queue.push(hashed);
                    }
                }
            }
        }
        this.render && this.render();
    }
    
    toggleMarked(x, y) {
        const cell = this.game.getCell(x, y);
        cell.marked = !cell.opened && !cell.marked;
        this.render && this.render();
    }
    
    openAdjacent(x, y) {
        const adjacent = Array.from(this.game.adjacent(x, y));
        const marked = adjacent
            .map(([x, y]) => this.game.getCell(x, y).marked)
            .filter(id => id)
            .length;
        
        if (this.game.count(x, y) === marked) {
           for (let [x, y] of adjacent) {
               if (!this.game.getCell(x, y).marked) {
                   this.smartOpen(x, y);
               }
           }
           this.render && this.render()
        }
    }
    
    hasSafeCell() {
        if (this.game.board.every(row => row.every(cell => !cell.isBomb))) {
            return true;
        }
        
        const front = this.game.front.sort((f, s) => variative(f.closed.length, f.k) - variative(s.closed.length, s.k));
        
        const closed = {};
        front.forEach(({ closed: c, k }) => {
            c.forEach(id => {
                closed[id] = undefined;
            });
        });
        
        const back = this.game.back.length;
        
        const count = {};
        for (const key of Object.keys(closed)) {
            count[key] = 0;
        }
        let safeCells = Array.from(Object.keys(count)).length;
        
        let backIsFree = back !== 0;
        
        for (const [solution, bombsOnBack] of possibleBombs(front, closed, bombs, back)) {
            if (bombsOnBack !== 0) {
                backIsFree = false;
            }
            
            for (const [key, value] of Object.entries(solution)) {
                if (value) {
                    if (count[key] === 0) {
                        safeCells--;
                    }
                    count[key]++;
                }
            }
            
            if (safeCells === 0 && !backIsFree) {
                break;
            }
        }
    
        return backIsFree || safeCells > 0;
    }
}

function initBoard(game, board, controller) {
    board.className = "minesweeper-board";
    game.board.forEach((row, i) => {
       const rowElement = document.createElement("div");
       rowElement.classList.add("minesweeper-row");
       row.forEach((cell, j) => {
            const cellElement = document.createElement("button");
            cellElement.classList.add("minesweeper-cell");
            cellElement.onpointerdown = () => {
                cellElement.touch = new Date();
            }
            cellElement.onpointerup = () => {
                const timeDiff = (+new Date()) - (+cellElement.touch);
                delete cellElement.touch;
                if (game.state !== gameState.play) {
                    return
                }
                if (timeDiff < 500) {
                    if (!game.getCell(j, i).marked) {
                        if (controller.started) {
                            controller.smartOpen(j, i);
                        } else {
                            controller.start(j, i, bombs);
                        }
                    }
                    return;
                } else {
                    if (!controller.started) {
                        return;
                    }
                    if (cell.opened) {
                        controller.openAdjacent(j, i);
                    } else {
                        controller.toggleMarked(j, i);
                    }
                }
            }
            rowElement.appendChild(cellElement);
        });
        board.appendChild(rowElement);
    });
}

function renderBoard(game, controller, element) {
    const showBombs = game.state === gameState.lose;

    Array.from(zip(game.board, element.children)).forEach(([row, rowElement], i) => {
        Array.from(zip(row, rowElement.children)).forEach(([cell, cellElement], j) => {
            cellElement.innerText = "";
            cellElement.className = "minesweeper-cell";
            if (cell.opened) {
                cellElement.classList.add("opened");
                if (!cell.isBomb) {
                    const count = game.count(j, i);
                    cellElement.classList.add(`count-${count}`);
                    if (count) {
                        cellElement.innerHTML = `<div>${count}</div>`;
                    }
                }
            } else if (cell.marked) {
                cellElement.classList.add("marked");
                cellElement.innerText = "⚑";
            }
            if (cell.isBomb && showBombs) {
                cellElement.classList.add("bomb");
                cellElement.innerText = "💣";
            }
        });
    });
}

function renderWrapper(game, controller, {
    boardElement,
    stateElement,
    countElement,
    timerElement,
    saveElement,
    randomElement,
}) {
    return () => {
        renderBoard(game, controller, boardElement);
        const state = game.state;
        stateElement.innerHTML = `<div>${gameStateToString[state]}</div>`;
        const flatten = game.board.flatMap(id => id);
        countElement.innerText = Math.max(0, flatten.filter(c => c.isBomb).length - flatten.filter(c => c.marked).length);
        countElement.hidden = !controller.started;
        if (controller.started && !timerElement.timerId) {
            const tick = () => {
                const diff = (+new Date()) - controller.started;
                const seconds = Math.floor(diff / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                timerElement.innerText = `${hours}:${minutes % 60}:${seconds % 60}`;
            }
            timerElement.timerId = setInterval(tick, 1000);
            tick();
        }
        if (state !== gameState.play) {
            clearInterval(timerElement.timerId);
        } else {
            new Promise((res, rej) => {
                if (!controller.hasSafeCell()) {
                    res(null);
                } else {
                    rej(null);
                }
            })
                .then(() => {
                    randomElement.hidden = false;
                })
                .catch(() => {});
        }
        saveElement.hidden = !(state === gameState.win && !controller.saved);
        randomElement.hidden = true;
    };
}

function setupGame({
    width,
    height,
    bombs
}, {
    boardElement,
    stateElement,
    countElement,
    timerElement,
    saveElement,
    randomElement,
}) {
    const game = new Minesweeper(width, height);
    
    const controller = new MinesweeperController(game);
    
    initBoard(game, boardElement, controller);
    
    stateElement.onclick = () => {
        deleteGame(game, controller, {
            boardElement,
            stateElement,
            countElement,
            timerElement,
            saveElement,
            randomElement,
        });
        setupGame({
            width,
            height,
            bombs
        }, {
            boardElement,
            stateElement,
            countElement,
            timerElement,
            saveElement,
            randomElement,
        });
    }
    
    saveElement.onclick = () => {
        const name = prompt("Save result");
        if (name) {
            STORAGE.scores.push({
                name,
                time: (+new Date()) - (+controller.started),
                width: game.width,
                height: game.height,
                date: new Date(),
            });
            localStorage.setItem("minesweeper", JSON.stringify(saves));
            controller.saved = true;
            controller.render();
        }
    };
    
    randomElement.onclick = () => {
        const safeClosed = game.closed.filter(({ cell }) => !cell.isBomb).map(item => ({ ...item, count: game.count(...item.coords) })).sort((f, s) => f.count - s.count);
        
        controller.smartOpen(...safeClosed[0].coords);
        controller.render();
    }
    
    controller.render = renderWrapper(game, controller, {
        boardElement,
        stateElement,
        countElement,
        timerElement,
        saveElement,
        randomElement,
    });
    
    controller.render();
}

function deleteGame(game, controller, {
    boardElement,
    stateElement,
    countElement,
    timerElement,
    saveElement,
    randomElement,
}) {
    boardElement.innerText = "";
    clearInterval(timerElement.timerId);
    delete timerElement.timerId;
    timerElement.innerText = "";
}

const query = new URL(window.location);

const width = Number(query.searchParams.get("width")) || 10;
const height = Number(query.searchParams.get("height")) || 10;
const bombs = Number(query.searchParams.get("bombs")) || 15;

const STORAGE = JSON.parse(localStorage.getItem("minesweeper")) || {
    scores: [],
};

const boardElement = document.getElementById("board");
const stateElement = document.getElementById("state");
const countElement = document.getElementById("count");
const timerElement = document.getElementById("timer");
const saveElement = document.getElementById("save");
const randomElement = document.getElementById("random");

try {
    setupGame({
        width,
        height,
        bombs
    }, {
        boardElement,
        stateElement,
        countElement,
        timerElement,
        saveElement,
        randomElement,
    });
} catch(e) {
    console.error(e);
    alert(e);
}
