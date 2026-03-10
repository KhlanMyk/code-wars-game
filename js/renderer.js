/* CodeArena — Canvas Renderer
   Draws the game map, units, bases, mines, and effects */

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d');
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    /* Sizing */
    _resize() {
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const w = container.clientWidth;
        const h = container.clientHeight;

        this.canvas.width  = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width  = w + 'px';
        this.canvas.style.height = h + 'px';

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.w = w;
        this.h = h;
        this.tileW = w / MAP_WIDTH;
        this.tileH = h / MAP_HEIGHT;
    }

    /* Main render */
    render(engine, effects) {
        this._resize();
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.w, this.h);

        this._drawGrid(ctx);
        this._drawMines(ctx, engine.mines);
        this._drawBases(ctx, engine);
        if (effects && effects.length) this._drawEffects(ctx, effects);
    }

    /* Grid */
    _drawGrid(ctx) {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                ctx.fillStyle = (x + y) % 2 === 0 ? '#141d27' : '#17202c';
                ctx.fillRect(x * this.tileW, y * this.tileH, this.tileW, this.tileH);
            }
        }

        // Grid lines
        ctx.strokeStyle = '#1e2a38';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= MAP_WIDTH; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.tileW, 0);
            ctx.lineTo(x * this.tileW, this.h);
            ctx.stroke();
        }
        for (let y = 0; y <= MAP_HEIGHT; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.tileH);
            ctx.lineTo(this.w, y * this.tileH);
            ctx.stroke();
        }
    }

    /* Gold mines */
    _drawMines(ctx, mines) {
        for (const m of mines) {
            if (m.gold <= 0) continue;
            const x = m.x * this.tileW;
            const y = m.y * this.tileH;
            const cx = x + this.tileW / 2;
            const cy = y + this.tileH / 2;

            // Tile highlight
            const pct = m.gold / m.maxGold;
            ctx.fillStyle = `rgba(227, 179, 65, ${0.08 + pct * 0.12})`;
            ctx.fillRect(x, y, this.tileW, this.tileH);

            // Diamond shape
            const s = Math.min(this.tileW, this.tileH) * 0.25;
            ctx.fillStyle = `rgba(227, 179, 65, ${0.5 + pct * 0.5})`;
            ctx.beginPath();
            ctx.moveTo(cx, cy - s);
            ctx.lineTo(cx + s, cy);
            ctx.lineTo(cx, cy + s);
            ctx.lineTo(cx - s, cy);
            ctx.closePath();
            ctx.fill();

            // Gold amount text
            ctx.fillStyle = '#e3b341';
            ctx.font = `bold ${Math.max(9, this.tileH * 0.22)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(m.gold + 'g', cx, y + this.tileH * 0.72);
        }
    }

    /* Bases */
    _drawBases(ctx, engine) {
        this._drawBase(ctx, engine.human.base, '#58a6ff', 'YOU');
        this._drawBase(ctx, engine.bot.base,   '#f85149', 'BOT');
    }

    _drawBase(ctx, base, color, label) {
        const x = base.x * this.tileW;
        const y = base.y * this.tileH;
        const cx = x + this.tileW / 2;
        const cy = y + this.tileH / 2;

        // Glow
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.tileW * 1.2);
        grad.addColorStop(0, color + '22');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(x - this.tileW * 0.6, y - this.tileH * 0.6, this.tileW * 2.2, this.tileH * 2.2);

        // Building
        const bw = this.tileW * 0.8;
        const bh = this.tileH * 0.8;
        ctx.fillStyle = color + '33';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        const bx = cx - bw / 2;
        const by = cy - bh / 2;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);

        // Turret top
        ctx.fillStyle = color + '66';
        const tw = bw * 0.4;
        const th = bh * 0.3;
        ctx.fillRect(cx - tw/2, by - th * 0.3, tw, th);

        // Label
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.max(10, this.tileH * 0.28)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy);

        // HP bar
        const hpPct = Math.max(0, base.hp / base.maxHp);
        this._drawHpBar(ctx, cx, by - 8, bw, 5, hpPct, color);
    }
}
