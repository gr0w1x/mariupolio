const COLORS = {
    white: "WHITE",
    black: "BLACK",
}

const STATE = {
    play: "PLAY",
    check: "CHECK",
    checkmate: "CHECKMATE",
    pat: "PAT",
}

class Chess {
    constructor() {
        this.figures = [
            new King(3, 0, COLORS.white),
            new King(3, 7, COLORS.black),
            new Queen(4, 0, COLORS.white),
            new Queen(4, 7, COLORS.black),
            new Rook(0, 0, COLORS.white),
            new Rook(7, 0, COLORS.white),
            new Rook(7, 7, COLORS.black),
            new Rook(0, 7, COLORS.black),
            new Bishop(2, 0, COLORS.white),
            new Bishop(5, 0, COLORS.white),
            new Bishop(2, 7, COLORS.black),
            new Bishop(5, 7, COLORS.black),
            new Knight(1, 0, COLORS.white),
            new Knight(6, 0, COLORS.white),
            new Knight(1, 7, COLORS.black),
            new Knight(6, 7, COLORS.black),
            ...Array.range(8).flatMap(i => [
                new Pawn(i, 1, COLORS.white),
                new Pawn(i, 6, COLORS.black),
            ]),
        ];
        this.turn = COLORS.white;
        this.undo = [];
        this.redo = [];
    }

    findFigure(x, y) {
        return this.figures.find(figure => figure.x === x && figure.y === y);
    }
    
    legalCoords(x, y) {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    }
    
    attackedCoords(x, y, color) {
        const opposite = this.figures.filter(f => f.color !== color && !f.disabled);
        
        return opposite.some(f => Array.from(f.moves(this)).some(([fx, fy]) => fx === x && fy === y));
    }
    
    attacked(figure) {
        return this.attackedCoords(figure.x, figure.y, figure.color);
    }

    * possibleMoves(figure) {
        const { x, y } = figure;
        const king = this.figures.find(f => f instanceof King && f.color === figure.color);

        for (const move of figure.moves(this)) {
            const attacked = this.findFigure(...move);
            if (attacked) {
                attacked.disabled = true;
            }

            figure.x = move[0];
            figure.y = move[1];
            
            const kingAttacked = king && this.attacked(king);

            figure.x = x;
            figure.y = y;

            if (attacked) {
                delete attacked.disabled;
            }

            if (!kingAttacked) {
                yield move;
            }
        }
    }
    
    get state() {
        const king = this.figures.find(f => f instanceof King && f.color === this.turn);
        
        const hasMoves = this.figures.filter(f => f.color === this.turn).some(f => Array.from(this.possibleMoves(f)).length !== 0);
        
        if (this.attacked(king)) {
            return hasMoves ? STATE.check : STATE.checkmate;
        } else {
            return hasMoves ? STATE.play : STATE.pat;
        }
    }

    makeMove(move) {
        move.exec(this);
        this.undo.push(move);
        this.redo = [];
    }

    undoCommand() {
        if (this.undo.length !== 0) {
            const move = this.undo.pop();
            move.undo(this);
            this.redo.unshift(move);
        }
    }

    redoCommand() {
        if (this.redo.length !== 0) {
            const move = this.redo.shift();
            move.exec(this);
            this.undo.push(move);
        }
    }
}

// FIGURE
class Figure {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }
    
    createMoveCommand(x, y, chess) {
        return new MoveFigureCommand(this, [x, y]);
    }
}

class MoveFigureCommand {
    constructor(figure, to) {
        this.figure = figure;
        this.to = to;
    }
    
    exec(chess) {
        this.from = [this.figure.x, this.figure.y];
        const attacked = chess.findFigure(...this.to);
        if (attacked) {
            this.attacked = attacked;
            chess.figures.splice(chess.figures.findIndex(f => f === attacked), 1);
        }
        this.figure.x = this.to[0];
        this.figure.y = this.to[1];
        chess.turn = chess.turn === COLORS.white ? COLORS.black : COLORS.white;
    }
    
    undo(chess) {
        this.figure.x = this.from[0];
        this.figure.y = this.from[1];
        delete this.from;
        if (this.attacked) {
            chess.figures.push(this.attacked);
            delete this.attacked;
        }
        chess.turn = chess.turn === COLORS.white ? COLORS.black : COLORS.white;
    }
}

class MoveFirstCommand extends MoveFigureCommand {
    constructor(figure, to) {
        super(figure, to);
    }
    
    exec(chess) {
        super.exec(chess);
        this.figure.moved = true
    }
    
    undo(chess) {
        super.undo(chess);
        delete this.figure.moved;
    }
}

// FLOW
class FlowFigure extends Figure {
    static AXIS_FLOWS = [
        [-1,  0],
        [+1,  0],
        [ 0, -1],
        [ 0, +1],
    ];
    
    static DIAGONAL_FLOWS = [
        [+1, +1],
        [-1, +1],
        [-1, -1],
        [+1, -1],
    ];
    
    * moves(chess) {
        for (const [vx, vy] of this.flows) {
            for (
                let currentX = this.x + vx, currentY = this.y + vy;
                chess.legalCoords(currentX, currentY);
                currentX += vx, currentY += vy
            ) {
                const f = chess.findFigure(currentX, currentY);
                if (f) {
                    if (f.color !== this.color) {
                        yield [currentX, currentY];
                    }
                    break;
                }
                yield [currentX, currentY];
            }
        }
    }
}

// ROOK
class Rook extends FlowFigure {
    get price() { return 5; }
    toString() {
        return "♜";
    }
    createMoveCommand(x, y, chess) {
        if (!this.moved) {
            return new MoveFirstCommand(this, [x, y]);
        }
        return new MoveFigureCommand(this, [x, y]);
    }
}
Rook.prototype.flows = [
    [-1,  0],
    [+1,  0],
    [ 0, -1],
    [ 0, +1],
];

// BISHOP
class Bishop extends FlowFigure {
    get price() { return 3; }
    toString() {
        return "♝";
    }
}
Bishop.prototype.flows = [
    [+1, +1],
    [-1, +1],
    [-1, -1],
    [+1, -1],
];

// QUEEN
class Queen extends FlowFigure {
    get price() { return 7; }
    toString() {
        return "♛";
    }
}
Queen.prototype.flows = [
    ...Rook.prototype.flows,
    ...Bishop.prototype.flows,
];

// RELATIVE
class RelativeFigure extends Figure {
    * moves(chess) {
        for (const [dx, dy] of this.relative) {
            const x = this.x + dx, y = this.y + dy;
            if (chess.legalCoords(x, y)) {
                const figure = chess.findFigure(x, y);
                if (!figure || figure.color !== this.color) {
                    yield [x, y];
                }
            }
        }
    }
}

// KNIGHT
class Knight extends RelativeFigure {
    get price() { return 3; }
    toString() {
        return "♞";
    }
}
Knight.prototype.relative = [
    [-2, -1],
    [-1, -2],
    [+2, -1],
    [+1, -2],
    [+2, +1],
    [+1, +2],
    [-2, +1],
    [-1, +2],
];

// KING
class King extends RelativeFigure {
    * moves(chess) {
        for (const move of super.moves(chess)) {
            yield move;
        }
        if (!this.moved && this.color === chess.turn && !chess.attacked(this)) {
            for (const vx of [-1, 1]) {
                if (chess.attackedCoords(this.x + vx, this.y, this.color)) {
                    continue;
                }
                for (let cx = this.x + vx; chess.legalCoords(cx, this.y); cx += vx) {
                    const figure = chess.findFigure(cx, this.y);
                    if (figure) {
                        if (figure instanceof Rook && !figure.moved) {
                            yield [this.x + 2 * vx, this.y];
                        }
                        else {
                            break;
                        }
                    }

                }
            }
        }
    }
    
    createMoveCommand(x, y, chess) {
        if (Math.abs(this.x - x) <= 1) {
            return new (!this.moved ? MoveFirstCommand : MoveFigureCommand)(this, [x, y]);
        } else {
            return new RoqueMoveCommand(this, [x, y]);
        }
    }

    get price() { return 0; }
    toString() {
        return "♚";
    }
}
King.prototype.relative = [
    [-1, -1],
    [-1,  0],
    [-1, +1],
    [ 0, -1],
    [ 0, +1],
    [+1, -1],
    [+1,  0],
    [+1, +1],
];

class RoqueMoveCommand extends MoveFirstCommand {
    constructor(figure, to) {
        super(figure, to);
    }
    
    exec(chess) {
        const vx = this.to[0] - this.figure.x;
        this.rook =
            chess.figures.find(
                f => f instanceof Rook
                    && f.color === this.figure.color
                    && Math.sign(f.x - this.figure.x) === Math.sign(vx)
            );
        super.exec(chess);
        this.rook.moved = true;
        this.prevRook = this.rook.x;
        this.rook.x = this.to[0] - Math.sign(vx);
    }
    
    undo(chess) {
        super.undo(chess);
        this.rook.x = this.prevRook;
        delete this.prevRook;
        delete this.rook.moved;
        delete this.rook;
    }
}

// PAWN
class Pawn extends Figure {
    * moves(chess) {
        const dy = this.color === COLORS.white ? 1 : -1;
        if (chess.legalCoords(this.x, this.y + dy) && !chess.findFigure(this.x, this.y + dy)) {
            yield [this.x, this.y + dy];
            if (
                !this.moved
                && chess.legalCoords(this.x, this.y + 2 * dy)
                && !chess.findFigure(this.x, this.y + 2 * dy)
            ) {
                yield [this.x, this.y + 2 * dy];
            }
        }
        for (const vx of [-1, 1]) {
            if (chess.legalCoords(this.x + vx, this.y + dy)) {
                const figure = chess.findFigure(this.x + vx, this.y + dy);
                if (figure) {
                    if (figure.color !== this.color) {
                        yield [this.x + vx, this.y + dy];
                    }
                } else {
                    const pawn = chess.findFigure(this.x + vx, this.y);
                    if (
                        pawn instanceof Pawn
                        && pawn.color !== this.color
                        && pawn.doubleMoved
                        && pawn.doubleMoveIndex === chess.undo.length - 1
                    ) {
                        yield [this.x + vx, this.y + dy];
                    }
                }
            }
        }
    }
    toString() {
        return "♟";
    }

    createMoveCommand(x, y, chess) {
        if (Math.abs(this.y - y) === 2) {
            return new DoubleMoveCommand(this, [x, y]);
        } else if (Math.abs(this.x - x) !== 0 && !chess.findFigure(x, y)) {
            return new PassingMoveCommand(this, [x, y]);
        } else if (!this.moved) {
            return new MoveFirstCommand(this, [x, y]);
        } else if (y === (this.color === COLORS.white ? 7 : 0)) {
            return new PromotionCommand(this, [x, y]);
        } else {
            return new MoveFigureCommand(this, [x, y]);
        }
    }
}

class DoubleMoveCommand extends MoveFirstCommand {
    exec(chess) {
        super.exec(chess);
        this.figure.doubleMoved = true;
        this.figure.doubleMoveIndex = chess.undo.length;
    }

    undo(chess) {
        super.undo(chess);
        delete this.figure.doubleMoved;
        delete this.figure.doubleMoveIndex;
    }
}

class PassingMoveCommand extends MoveFigureCommand {
    exec(chess) {
        super.exec(chess);
        this.attacked = chess.findFigure(this.to[0], this.to[1] - (this.figure.color === COLORS.white ? 1 : -1));
        chess.figures.splice(chess.figures.findIndex(f => f === this.attacked), 1);
    }

    undo(chess) {
        super.undo(chess);
    }
}

class PromotionCommand extends MoveFigureCommand {
    exec(chess) {
        super.exec(chess);
        this.promoted = new (this.preference)(...this.to, this.figure.color);
        chess.figures.splice(chess.figures.findIndex(f => f === this.figure), 1);
        chess.figures.push(this.promoted);
    }

    undo(chess) {
        super.undo(chess);
        chess.figures.splice(chess.figures.findIndex(f => f === this.promoted), 1);
        chess.figures.push(this.figure);
        delete this.promoted;
    }
}
