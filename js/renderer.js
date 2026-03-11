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
        this._drawUnits(ctx, engine.allUnits());
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

    /* Units */
    _drawUnits(ctx, units) {
        for (const u of units) {
            if (u.hp <= 0) continue;
            const cx = u.x * this.tileW + this.tileW / 2;
            const cy = u.y * this.tileH + this.tileH / 2;
            const r  = Math.min(this.tileW, this.tileH) * 0.34;
            const color = u.owner === 'human' ? '#58a6ff' : '#f85149';

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(cx + 1, cy + r * 0.8, r * 0.7, r * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body shape varies by type
            ctx.fillStyle = color;
            ctx.strokeStyle = u.owner === 'human' ? '#2f81d9' : '#d13529';
            ctx.lineWidth = 1.5;

            if (u.type === 'worker') {
                // Square with rounded corners
                const s = r * 0.8;
                this._roundRect(ctx, cx - s, cy - s, s * 2, s * 2, 4);
                ctx.fill();
                ctx.stroke();
            } else if (u.type === 'archer') {
                // Diamond
                ctx.beginPath();
                ctx.moveTo(cx, cy - r);
                ctx.lineTo(cx + r, cy);
                ctx.lineTo(cx, cy + r);
                ctx.lineTo(cx - r, cy);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else {
                // Circle (warrior)
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            // Type letter
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(10, r * 1.0)}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const letter = u.type === 'worker' ? 'W' : u.type === 'warrior' ? 'S' : 'A';
            ctx.fillText(letter, cx, cy + 1);

            // HP bar
            const hpPct = Math.max(0, u.hp / u.maxHp);
            this._drawHpBar(ctx, cx, cy - r - 6, this.tileW * 0.7, 3, hpPct, null);

            // Unit ID (tiny)
            ctx.fillStyle = '#ffffff88';
            ctx.font = `${Math.max(7, this.tileH * 0.16)}px monospace`;
            ctx.textBaseline = 'top';
            ctx.fillText('#' + u.id, cx, cy + r + 1);
        }
    }

    /* HP bar helper */
    _drawHpBar(ctx, cx, topY, width, height, pct, overrideColor) {
        const x = cx - width / 2;
        ctx.fillStyle = '#00000066';
        ctx.fillRect(x, topY, width, height);

        let barColor;
        if (overrideColor) {
            barColor = overrideColor;
        } else if (pct > 0.6) {
            barColor = '#3fb950';
        } else if (pct > 0.3) {
            barColor = '#d29922';
        } else {
            barColor = '#f85149';
        }
        ctx.fillStyle = barColor;
        ctx.fillRect(x, topY, width * pct, height);
    }

    /* Rounded rect helper */
    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    /* Effects */
    _drawEffects(ctx, effects) {
        for (const e of effects) {
            if (e.type === 'attack') {
                const fx = e.from.x * this.tileW + this.tileW / 2;
                const fy = e.from.y * this.tileH + this.tileH / 2;
                const tx = e.to.x   * this.tileW + this.tileW / 2;
                const ty = e.to.y   * this.tileH + this.tileH / 2;

                // Line
                ctx.strokeStyle = e.color || '#ffd54f';
                ctx.lineWidth = 2.5;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(fx, fy);
                ctx.lineTo(tx, ty);
                ctx.stroke();
                ctx.setLineDash([]);

                // Impact
                ctx.fillStyle = 'rgba(255,200,50,0.45)';
                ctx.beginPath();
                ctx.arc(tx, ty, this.tileW * 0.25, 0, Math.PI * 2);
                ctx.fill();
            }

            if (e.type === 'death') {
                const cx = e.x * this.tileW + this.tileW / 2;
                const cy = e.y * this.tileH + this.tileH / 2;
                ctx.fillStyle = 'rgba(248,81,73,0.55)';
                ctx.beginPath();
                ctx.arc(cx, cy, this.tileW * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = `${this.tileH * 0.5}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💥', cx, cy);
            }

            if (e.type === 'spawn') {
                const cx = e.x * this.tileW + this.tileW / 2;
                const cy = e.y * this.tileH + this.tileH / 2;
                ctx.strokeStyle = e.color || '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(cx, cy, this.tileW * 0.45, 0, Math.PI * 2);
                ctx.stroke();
            }

            if (e.type === 'gather') {
                const cx = e.x * this.tileW + this.tileW / 2;
                const cy = e.y * this.tileH + this.tileH / 2;
                ctx.fillStyle = 'rgba(227,179,65,0.5)';
                ctx.font = `${this.tileH * 0.4}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('+💰', cx, cy - this.tileH * 0.45);
            }
        }
    }
}
