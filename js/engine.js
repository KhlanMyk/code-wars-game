/* CodeArena — Game Engine
   Core game state, rules, and action resolution */

const UNIT_DEFS = {
    worker:  { cost: 50,  hp: 40,  atk: 5,  range: 1, gather: 15 },
    warrior: { cost: 100, hp: 150, atk: 30, range: 1, gather: 0 },
    archer:  { cost: 120, hp: 70,  atk: 18, range: 3, gather: 0 }
};

const MAP_WIDTH  = 20;
const MAP_HEIGHT = 12;
const MAX_TURNS  = 150;
const BASE_HP    = 1000;
const START_GOLD = 200;
const INCOME     = 10;

class GameEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.turn        = 0;
        this.state       = 'idle';
        this.winner      = null;
        this._nextId     = 1;
        this.logs        = [];
        this.turnEffects = [];

        this.human = this._makePlayer(1, Math.floor(MAP_HEIGHT / 2));
        this.bot   = this._makePlayer(MAP_WIDTH - 2, Math.floor(MAP_HEIGHT / 2));

        this.mines = [
            { x: 4,  y: 2,  gold: 500, maxGold: 500 },
            { x: 4,  y: 9,  gold: 500, maxGold: 500 },
            { x: 10, y: 3,  gold: 700, maxGold: 700 },
            { x: 10, y: 8,  gold: 700, maxGold: 700 },
            { x: 15, y: 2,  gold: 500, maxGold: 500 },
            { x: 15, y: 9,  gold: 500, maxGold: 500 }
        ];

        this._acted = new Set();
    }

    _makePlayer(bx, by) {
        return {
            gold: START_GOLD,
            base: { x: bx, y: by, hp: BASE_HP, maxHp: BASE_HP },
            units: []
        };
    }

    /* Helpers */
    player(name)  { return name === 'human' ? this.human : this.bot; }
    enemy(name)   { return name === 'human' ? this.bot   : this.human; }
    allUnits()    { return [...this.human.units, ...this.bot.units]; }

    unitAt(x, y)  { return this.allUnits().find(u => u.x === x && u.y === y && u.hp > 0); }
    unitById(id)  { return this.allUnits().find(u => u.id === id); }
    mineAt(x, y)  { return this.mines.find(m => m.x === x && m.y === y && m.gold > 0); }

    dist(x1, y1, x2, y2) { return Math.abs(x1 - x2) + Math.abs(y1 - y2); }
    inBounds(x, y) { return x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT; }
    canStep(x, y)  { return this.inBounds(x, y) && !this.unitAt(x, y); }

    log(msg, type = 'info') {
        this.logs.push({ msg, type, turn: this.turn });
    }
}
