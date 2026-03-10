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
}
