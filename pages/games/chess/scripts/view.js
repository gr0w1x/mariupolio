const figures = "♔♕♖♗♘♙♚♛♜♝♞♟";

const ELEMENTS = {
    board: document.getElementById("board"),
    state: document.getElementById("state"),
    undo: document.getElementById("undo"),
    redo: document.getElementById("redo"),
    promote: document.getElementById("promote"),
    promoteOptions: document.getElementById("promote-options"),
}

function createGame() {
    return new Chess();
}

const stringToFigureConstructor = {
    "♛": Queen,
    "♜": Rook,
    "♝": Bishop,
    "♞": Knight,
}

function bindGame(game, elements) {
    const boardBackground = document.createElement("div");
    boardBackground.classList.add("board-background");
    Array.range(8).forEach(() => {
        const rowElement = document.createElement("div");
        rowElement.classList.add("row");
        Array.range(8).forEach(() => {
            const cellElement = document.createElement("div");
            cellElement.classList.add("cell");
            rowElement.appendChild(cellElement);
        });
        boardBackground.appendChild(rowElement);
    });
    elements.board.appendChild(boardBackground);
    
    elements.moves = document.createElement("div");
    elements.moves.classList.add("moves");
    elements.board.appendChild(elements.moves);
    
    elements.figures = document.createElement("div");
    elements.figures.classList.add("figures");
    elements.figures.onclick = () => {
        elements.target = null;
        elements.renderMoves();
    };
    elements.board.appendChild(elements.figures);
    
    elements.figures.figureElements = new Map();

    elements.undo.onclick = () => {
        game.undoCommand();
        renderGame(game, elements);
        elements.target = undefined;
        elements.renderMoves();
    };
    elements.redo.onclick = () => {
        game.redoCommand();
        renderGame(game, elements);
        elements.target = undefined;
        elements.renderMoves();
    }

    for (const [key, value] of Object.entries(stringToFigureConstructor)) {
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "promote";
        radio.id = `promote-${key}`;
        const label = document.createElement("label");
        radio.onchange = () => {
            elements.pawnPromoted.preference = value;
            game.makeMove(elements.pawnPromoted);
            elements.closeModal();
            renderGame(game, elements);
        }
        label.htmlFor = radio.id;
        label.innerText = key;
        elements.promoteOptions.appendChild(radio);
        elements.promoteOptions.appendChild(label);
    }
    elements.promote.hidden = true;

    elements.closeModal = () => {
        delete elements.pawnPromoted;
        elements.promote.hidden = true;
    }

    elements.promote.onclick = elements.closeModal;
    elements.promoteOptions.onclick = (e) => {
        e.stopPropagation();
    }

    elements.renderMoves = () => {
        elements.moves.innerText = "";
        if (elements.target) {
            for (const [x, y] of game.possibleMoves(elements.target)) {
                const element = document.createElement("div");
                element.classList.add("move", elements.target.color.toLowerCase());
                element.innerHTML = "\u2a2f";
                element.style.top = `${(7 - y) * 100 / 8}%`;
                element.style.left = `${x * 100 / 8}%`;
                element.onclick = () => {
                    const figure = elements.target;
                    elements.target = null;
                    elements.renderMoves();
                    const command = figure.createMoveCommand(x, y, game);
                    if (command instanceof PromotionCommand) {
                        elements.pawnPromoted = command;
                        elements.promote.hidden = false;
                    } else {
                        game.makeMove(command);
                    }
                    renderGame(game, elements);
                }
                elements.moves.appendChild(element);
            }
        }
    }
}

function unbindGame(game, elements) {
    elements.board.innerText = "";
}

function renderGame(game, elements) {
    game.figures.forEach(figure => {
        if (!elements.figures.figureElements.has(figure)) {
            const element = document.createElement("div");
            element.classList.add("figure", figure.color.toLowerCase());
            element.innerText = figure.toString();
            element.onclick = (e) => {
                elements.target = figure.color === game.turn ? figure : null;
                if (figure.color === game.turn) {
                    e.stopPropagation();
                }
                elements.renderMoves();
            };
            elements.figures.figureElements.set(figure, element);
            elements.figures.appendChild(element);
        }
        const figureElement = elements.figures.figureElements.get(figure);
        figureElement.style.top = `${(7 - figure.y) * 100 / 8}%`;
        figureElement.style.left = `${figure.x * 100 / 8}%`;
    });

    for (const [figure, element] of elements.figures.figureElements.entries()) {
        if (!game.figures.includes(figure)) {
            elements.figures.figureElements.delete(figure);
            elements.figures.removeChild(element);
        }
    }

    const s = game.state;
    
    elements.state.innerText = s === STATE.play ? "" : s;

    game.figures.sum(f => f.price);

    elements.undo.disabled = ![STATE.play, STATE.check].includes(s) || game.undo.length === 0;
    elements.redo.disabled = ![STATE.play, STATE.check].includes(s) || game.redo.length === 0;
}

function setupGame(elements) {
    const game = createGame();
    bindGame(game, elements);
    renderGame(game, elements);
}

try {
    setupGame(ELEMENTS);
} catch (e) {
    alert(e);
}
