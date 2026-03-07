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

    /* Initialisation */
    reset() {
        this.turn        = 0;
        this.state       = 'idle';   // idle | running | paused | finished
        this.winner      = null;
        this._nextId     = 1;
        this.logs        = [];
        this.turnEffects = [];       // visual effects for the renderer

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

    /* Actions */

    /** Spawn a unit at the player's base. Returns true on success. */
    spawn(who, unitType) {
        const p   = this.player(who);
        const def = UNIT_DEFS[unitType];
        if (!def) { this.log(`Unknown unit type: ${unitType}`, 'error'); return false; }
        if (p.gold < def.cost) { this.log(`Not enough gold for ${unitType} (need ${def.cost}, have ${p.gold})`, 'error'); return false; }

        // Find a free spawn tile near the base
        const b = p.base;
        const dx = who === 'human' ? 1 : -1;
        const candidates = [
            { x: b.x,      y: b.y },
            { x: b.x,      y: b.y - 1 },
            { x: b.x,      y: b.y + 1 },
            { x: b.x + dx, y: b.y },
            { x: b.x + dx, y: b.y - 1 },
            { x: b.x + dx, y: b.y + 1 },
            { x: b.x,      y: b.y - 2 },
            { x: b.x,      y: b.y + 2 },
        ];

        let pos = null;
        for (const c of candidates) {
            if (this.inBounds(c.x, c.y) && !this.unitAt(c.x, c.y)) { pos = c; break; }
        }
        if (!pos) { this.log(`No space to spawn ${unitType}`, 'error'); return false; }

        const unit = {
            id: this._nextId++,
            type: unitType,
            owner: who,
            x: pos.x, y: pos.y,
            hp: def.hp, maxHp: def.hp,
            atk: def.atk, range: def.range,
            gather: def.gather
        };

        p.units.push(unit);
        p.gold -= def.cost;
        this._acted.add(unit.id);   // newly spawned units can't act this turn

        const tag = who === 'human' ? 'player' : 'bot';
        this.log(`${who} spawned ${unitType} #${unit.id} at (${pos.x},${pos.y})`, tag);
        this.turnEffects.push({ type: 'spawn', x: pos.x, y: pos.y, color: who === 'human' ? '#58a6ff' : '#f85149' });
        return true;
    }

    /** Move unit one step in a cardinal direction. */
    move(who, unitId, direction) {
        const unit = this._getOwnAliveUnit(who, unitId);
        if (!unit || this._acted.has(unitId)) return false;

        const dirs = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
        const d = dirs[direction];
        if (!d) { this.log(`Bad direction: ${direction}`, 'error'); return false; }

        const nx = unit.x + d[0], ny = unit.y + d[1];
        if (!this.canStep(nx, ny)) return false;

        unit.x = nx; unit.y = ny;
        this._acted.add(unitId);
        return true;
    }

    /** Move one step toward (tx, ty). Picks the best cardinal direction. */
    moveTowards(who, unitId, tx, ty) {
        const unit = this._getOwnAliveUnit(who, unitId);
        if (!unit || this._acted.has(unitId)) return false;

        const dirs = [
            { name: 'right', dx: 1, dy: 0 },
            { name: 'left',  dx:-1, dy: 0 },
            { name: 'down',  dx: 0, dy: 1 },
            { name: 'up',    dx: 0, dy:-1 }
        ];

        dirs.sort((a, b) => {
            const da = this.dist(unit.x + a.dx, unit.y + a.dy, tx, ty);
            const db = this.dist(unit.x + b.dx, unit.y + b.dy, tx, ty);
            return da - db;
        });

        for (const d of dirs) {
            const nx = unit.x + d.dx, ny = unit.y + d.dy;
            if (this.canStep(nx, ny)) {
                return this.move(who, unitId, d.name);
            }
        }
        return false;
    }
}
