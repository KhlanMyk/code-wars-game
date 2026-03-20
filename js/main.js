/* CodeArena — Main Application
   Python bridge (Skulpt), UI controls, game loop */

/* Example strategies */
const EXAMPLES = {
    rush: `def strategy():
    """Rush Strategy: mass warriors, charge the enemy base!"""
    # Spend all gold on warriors
    while my_gold() >= 100:
        spawn("warrior")

    base = enemy_base()
    enemies = enemy_units()

    for unit in my_units():
        # Attack any enemy in range
        attacked = False
        for enemy in enemies:
            if dist(unit["x"], unit["y"], enemy["x"], enemy["y"]) <= unit["range"]:
                attack(unit["id"], enemy["id"])
                attacked = True
                break
        if attacked:
            continue

        # Attack base if in range
        if dist(unit["x"], unit["y"], base["x"], base["y"]) <= unit["range"]:
            attack_base(unit["id"])
            continue

        # Move toward enemy base
        move_towards(unit["id"], base["x"], base["y"])
`,

    economy: `def strategy():
    """Economy Strategy: workers first, then overwhelming army."""
    gold = my_gold()
    units = my_units()
    workers = [u for u in units if u["type"] == "worker"]
    warriors = [u for u in units if u["type"] == "warrior"]
    archers = [u for u in units if u["type"] == "archer"]

    # Phase 1: Build workers (up to 4)
    if len(workers) < 4 and gold >= 50:
        spawn("worker")
    # Phase 2: Build army
    elif gold >= 120 and len(archers) < 3:
        spawn("archer")
    elif gold >= 100:
        spawn("warrior")

    # Extra spending
    if gold >= 200:
        spawn("warrior")

    enemies = enemy_units()
    base = enemy_base()

    for unit in units:
        if unit["type"] == "worker":
            # Gather or go to mine
            if not gather(unit["id"]):
                mines = get_mines()
                if mines:
                    nearest = min(mines, key=lambda m: dist(unit["x"], unit["y"], m["x"], m["y"]))
                    move_towards(unit["id"], nearest["x"], nearest["y"])
        else:
            # Fighters: attack or advance
            attacked = False
            for enemy in enemies:
                if dist(unit["x"], unit["y"], enemy["x"], enemy["y"]) <= unit["range"]:
                    attack(unit["id"], enemy["id"])
                    attacked = True
                    break
            if not attacked:
                if dist(unit["x"], unit["y"], base["x"], base["y"]) <= unit["range"]:
                    attack_base(unit["id"])
                else:
                    move_towards(unit["id"], base["x"], base["y"])
`,

    balanced: `def strategy():
    """Balanced Strategy: workers + warriors + archers."""
    gold = my_gold()
    units = my_units()
    workers = [u for u in units if u["type"] == "worker"]
    warriors = [u for u in units if u["type"] == "warrior"]
    archers = [u for u in units if u["type"] == "archer"]

    # Keep 2 workers, then alternate warriors/archers
    if len(workers) < 2 and gold >= 50:
        spawn("worker")
    elif gold >= 120 and len(archers) <= len(warriors):
        spawn("archer")
    elif gold >= 100:
        spawn("warrior")

    enemies = enemy_units()
    base = enemy_base()
    my_b = my_base()

    for unit in units:
        if unit["type"] == "worker":
            if not gather(unit["id"]):
                mines = get_mines()
                if mines:
                    nearest = min(mines, key=lambda m: dist(unit["x"], unit["y"], m["x"], m["y"]))
                    move_towards(unit["id"], nearest["x"], nearest["y"])
            continue

        # Check for threats near our base
        threats = [e for e in enemies
                   if dist(e["x"], e["y"], my_b["x"], my_b["y"]) <= 4]

        if unit["type"] == "archer" and threats:
            # Defend
            target = min(threats, key=lambda e: e["hp"])
            if dist(unit["x"], unit["y"], target["x"], target["y"]) <= unit["range"]:
                attack(unit["id"], target["id"])
            else:
                move_towards(unit["id"], target["x"], target["y"])
            continue

        # Attack or advance
        attacked = False
        for enemy in enemies:
            if dist(unit["x"], unit["y"], enemy["x"], enemy["y"]) <= unit["range"]:
                attack(unit["id"], enemy["id"])
                attacked = True
                break
        if not attacked:
            if dist(unit["x"], unit["y"], base["x"], base["y"]) <= unit["range"]:
                attack_base(unit["id"])
            else:
                move_towards(unit["id"], base["x"], base["y"])
`,

    archer: `def strategy():
    """Archer Defense: ranged superiority + warrior cleanup."""
    gold = my_gold()
    units = my_units()
    archers = [u for u in units if u["type"] == "archer"]
    warriors = [u for u in units if u["type"] == "warrior"]
    workers = [u for u in units if u["type"] == "worker"]

    # 1 worker for income, then archers, then warriors
    if len(workers) < 1 and gold >= 50:
        spawn("worker")
    elif gold >= 120:
        spawn("archer")
    elif gold >= 100 and len(warriors) < 3:
        spawn("warrior")

    enemies = enemy_units()
    base = enemy_base()

    for unit in units:
        if unit["type"] == "worker":
            if not gather(unit["id"]):
                mines = get_mines()
                if mines:
                    nearest = min(mines, key=lambda m: dist(unit["x"], unit["y"], m["x"], m["y"]))
                    move_towards(unit["id"], nearest["x"], nearest["y"])
            continue

        # Archers: pick off weakest in range, advance slowly
        if unit["type"] == "archer":
            in_range = [e for e in enemies
                        if dist(unit["x"], unit["y"], e["x"], e["y"]) <= unit["range"]]
            if in_range:
                weakest = min(in_range, key=lambda e: e["hp"])
                attack(unit["id"], weakest["id"])
            elif dist(unit["x"], unit["y"], base["x"], base["y"]) <= unit["range"]:
                attack_base(unit["id"])
            else:
                move_towards(unit["id"], base["x"], base["y"])
            continue

        # Warriors: rush and tank
        attacked = False
        for enemy in enemies:
            if dist(unit["x"], unit["y"], enemy["x"], enemy["y"]) <= unit["range"]:
                attack(unit["id"], enemy["id"])
                attacked = True
                break
        if not attacked:
            if dist(unit["x"], unit["y"], base["x"], base["y"]) <= unit["range"]:
                attack_base(unit["id"])
            else:
                move_towards(unit["id"], base["x"], base["y"])
`
};

const DEFAULT_CODE = `def strategy():
    """Your strategy function — called every turn!
    Use the API to spawn units, move, attack, and gather.
    Open the 'API Reference' tab below for details."""

    gold = my_gold()
    units = my_units()
    enemies = enemy_units()
    base = enemy_base()

    # Spawn a warrior if you can afford one
    if gold >= 100:
        spawn("warrior")

    for unit in units:
        # If an enemy is in range — attack!
        attacked = False
        for enemy in enemies:
            if dist(unit["x"], unit["y"], enemy["x"], enemy["y"]) <= unit["range"]:
                attack(unit["id"], enemy["id"])
                attacked = True
                break

        if attacked:
            continue

        # If near enemy base — attack it!
        if dist(unit["x"], unit["y"], base["x"], base["y"]) <= unit["range"]:
            attack_base(unit["id"])
            continue

        # Otherwise move toward the enemy base
        move_towards(unit["id"], base["x"], base["y"])
`;

/* App initialisation */

let engine, renderer, botAI, editor;
let running = false;
let paused  = false;
let stepMode = false;
let speedDelay = 250;   // ms between turns
let skulptReady = false;

document.addEventListener('DOMContentLoaded', () => {
    engine   = new GameEngine();
    renderer = new Renderer(document.getElementById('game-canvas'));
    botAI    = new BotAI();

    initEditor();
    initUI();
    checkSkulpt();

    renderer.render(engine, []);
    appendLog('Welcome to CodeArena! Write a strategy() function and click ▶ Run Battle.', 'system');
    appendLog('Use the "API Reference" tab for the full list of commands.', 'system');
});

/* CodeMirror */
function initEditor() {
    editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
        mode: 'python',
        theme: 'material-darker',
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        matchBrackets: true,
        autoCloseBrackets: true,
        lineWrapping: false,
        extraKeys: {
            'Ctrl-Enter': () => startBattle(),
            'Cmd-Enter':  () => startBattle()
        }
    });
    editor.setValue(DEFAULT_CODE);
}

/* Skulpt readiness */
function checkSkulpt() {
    if (typeof Sk !== 'undefined') {
        skulptReady = true;
        appendLog('Python engine loaded ✓', 'system');
    } else {
        appendLog('⏳ Loading Python engine (Skulpt)…', 'system');
        const check = setInterval(() => {
            if (typeof Sk !== 'undefined') {
                skulptReady = true;
                clearInterval(check);
                appendLog('Python engine loaded ✓', 'system');
            }
        }, 500);
        // Timeout after 15s
        setTimeout(() => {
            if (!skulptReady) {
                clearInterval(check);
                appendLog('⚠ Failed to load Skulpt. Check your internet connection and reload.', 'error');
            }
        }, 15000);
    }
}

/* UI wiring */
function initUI() {
    document.getElementById('btn-run').addEventListener('click', startBattle);
    document.getElementById('btn-step').addEventListener('click', stepOnce);
    document.getElementById('btn-pause').addEventListener('click', togglePause);
    document.getElementById('btn-reset').addEventListener('click', resetGame);
    document.getElementById('overlay-btn').addEventListener('click', resetGame);
    document.getElementById('btn-clear-console').addEventListener('click', () => {
        document.getElementById('console-log').innerHTML = '';
    });

    // Speed slider
    document.getElementById('speed-slider').addEventListener('input', e => {
        const v = parseInt(e.target.value);
        speedDelay = [800, 400, 200, 80, 30][v - 1] || 200;
    });

    // Example loader
    document.getElementById('example-select').addEventListener('change', e => {
        const key = e.target.value;
        if (EXAMPLES[key]) {
            editor.setValue(EXAMPLES[key]);
        }
        e.target.value = '';
    });

    // Console tabs
    document.querySelectorAll('.console-tabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.console-tabs .tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.console-content').forEach(c => c.classList.remove('active-tab'));
            tab.classList.add('active');
            document.getElementById('console-' + tab.dataset.tab).classList.add('active-tab');
        });
    });
}

/* Game loop */

async function startBattle() {
    if (running) return;
    if (!skulptReady) {
        appendLog('⚠ Python engine not ready yet. Please wait…', 'error');
        return;
    }

    running  = true;
    paused   = false;
    stepMode = false;
    setButtons('running');

    if (engine.state === 'finished') resetGame();

    engine.state = 'running';
    appendLog(`— Battle started! —`, 'system');

    await gameLoop();
}

async function stepOnce() {
    if (!skulptReady) {
        appendLog('⚠ Python engine not ready yet.', 'error');
        return;
    }

    if (engine.state === 'finished') return;
    if (running && !paused) return;

    running  = true;
    paused   = false;
    stepMode = true;
    engine.state = 'running';
    setButtons('running');

    await executeTurn();

    running  = false;
    stepMode = false;
    setButtons(engine.state === 'finished' ? 'finished' : 'idle');
}

function togglePause() {
    if (!running) return;
    paused = !paused;
    document.getElementById('btn-pause').textContent = paused ? '▶ Resume' : '⏸ Pause';
    if (paused) appendLog('⏸ Paused', 'system');
    else appendLog('▶ Resumed', 'system');
}

function resetGame() {
    running = false;
    paused  = false;
    engine.reset();

    document.getElementById('game-overlay').classList.add('hidden');
    setButtons('idle');
    updateHUD();
    renderer.render(engine, []);
    appendLog('— Game reset —', 'system');
}

async function gameLoop() {
    while (running && engine.state !== 'finished') {
        if (paused) {
            await delay(100);
            continue;
        }

        await executeTurn();

        if (stepMode) break;
        await delay(speedDelay);
    }

    running = false;
    setButtons(engine.state === 'finished' ? 'finished' : 'idle');

    if (engine.state === 'finished') showEndOverlay();
}

async function executeTurn() {
    // Player turn
    engine.beginTurn();
    await runPlayerPython();

    // Capture player effects before bot clears them
    const playerEffects = [...engine.turnEffects];

    // Bot turn
    engine._acted.clear();          // reset acted set for bot
    engine.turnEffects = [];        // fresh effects for bot
    botAI.execute(engine);

    // Merge effects from both halves
    const effects = [...playerEffects, ...engine.turnEffects];

    // End turn
    engine.endTurn();
    renderer.render(engine, effects);
    updateHUD();

    // Brief pause to show effects
    if (effects.length > 0) {
        await delay(Math.min(speedDelay, 150));
        renderer.render(engine, []);
    }
}

/* Python bridge (Skulpt) */

async function runPlayerPython() {
    const code = editor.getValue();

    const fullCode = code + '\n\nstrategy()\n';

    Sk.configure({
        output: text => appendLog(text.replace(/\n$/, ''), 'info'),
        read: x => {
            if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
                throw "File not found: '" + x + "'";
            return Sk.builtinFiles["files"][x];
        },
        __future__: Sk.python3 || {},
        execLimit: 10000      // prevent infinite loops
    });

    // Inject API builtins (must be after Sk.configure)
    injectAPI();

    try {
        await Sk.misceval.asyncToPromise(() =>
            Sk.importMainWithBody("<stdin>", false, fullCode, true)
        );
    } catch (err) {
        const msg = err.toString();
        appendLog('❌ Python Error: ' + msg, 'error');
        // Stop battle on error
        running = false;
        engine.state = 'idle';
    }
}

function injectAPI() {
    const B = Sk.builtin;
    const ffi = Sk.ffi;

    const pyFunc = fn => new B.func(fn);
    const toJs   = v  => ffi.remapToJs(v);
    const toPy   = v  => ffi.remapToPy(v);

    // Query functions
    const my_gold = pyFunc(() => new B.int_(engine.human.gold));

    const my_units = pyFunc(() => {
        const list = engine.human.units.filter(u => u.hp > 0).map(u => ({
            id: u.id, type: u.type, x: u.x, y: u.y,
            hp: u.hp, max_hp: u.maxHp, atk: u.atk, range: u.range
        }));
        return toPy(list);
    });

    const enemy_units = pyFunc(() => {
        const list = engine.bot.units.filter(u => u.hp > 0).map(u => ({
            id: u.id, type: u.type, x: u.x, y: u.y,
            hp: u.hp, max_hp: u.maxHp, atk: u.atk, range: u.range
        }));
        return toPy(list);
    });

    const my_base = pyFunc(() => {
        const b = engine.human.base;
        return toPy({ x: b.x, y: b.y, hp: b.hp, max_hp: b.maxHp });
    });

    const enemy_base = pyFunc(() => {
        const b = engine.bot.base;
        return toPy({ x: b.x, y: b.y, hp: b.hp, max_hp: b.maxHp });
    });

    const get_mines = pyFunc(() => {
        return toPy(engine.mines.filter(m => m.gold > 0).map(m => ({ x: m.x, y: m.y, gold: m.gold })));
    });

    const get_turn = pyFunc(() => new B.int_(engine.turn));

    // Action functions
    const spawn = pyFunc(function (unitType) {
        const result = engine.spawn('human', toJs(unitType));
        return toPy(result);
    });

    const move = pyFunc(function (unitId, direction) {
        return toPy(engine.move('human', toJs(unitId), toJs(direction)));
    });

    const move_towards = pyFunc(function (unitId, tx, ty) {
        return toPy(engine.moveTowards('human', toJs(unitId), toJs(tx), toJs(ty)));
    });

    const attack = pyFunc(function (unitId, targetId) {
        return toPy(engine.attack('human', toJs(unitId), toJs(targetId)));
    });

    const attack_base = pyFunc(function (unitId) {
        return toPy(engine.attackBase('human', toJs(unitId)));
    });

    const gather = pyFunc(function (unitId) {
        return toPy(engine.gather('human', toJs(unitId)));
    });

    // Utility
    const dist = pyFunc(function (x1, y1, x2, y2) {
        return new B.int_(Math.abs(toJs(x1) - toJs(x2)) + Math.abs(toJs(y1) - toJs(y2)));
    });

    const log = pyFunc(function (msg) {
        appendLog(String(toJs(msg)), 'player');
        return B.none.none$;
    });

    // Register all API functions as Python builtins
    Sk.builtins.my_gold     = my_gold;
    Sk.builtins.my_units    = my_units;
    Sk.builtins.enemy_units = enemy_units;
    Sk.builtins.my_base     = my_base;
    Sk.builtins.enemy_base  = enemy_base;
    Sk.builtins.get_mines   = get_mines;
    Sk.builtins.get_turn    = get_turn;
    Sk.builtins.spawn       = spawn;
    Sk.builtins.move        = move;
    Sk.builtins.move_towards = move_towards;
    Sk.builtins.attack      = attack;
    Sk.builtins.attack_base = attack_base;
    Sk.builtins.gather      = gather;
    Sk.builtins.dist        = dist;
    Sk.builtins.log         = log;
}

/* HUD & Console helpers */

function updateHUD() {
    document.getElementById('player-gold').textContent  = engine.human.gold;
    document.getElementById('enemy-gold').textContent    = '???';
    document.getElementById('turn-counter').textContent  = `${engine.turn} / ${MAX_TURNS}`;

    const php = engine.human.base.hp;
    const ehp = engine.bot.base.hp;
    document.getElementById('player-hp').textContent = `${Math.max(0, php)} / ${BASE_HP}`;
    document.getElementById('enemy-hp').textContent  = `${Math.max(0, ehp)} / ${BASE_HP}`;
    document.getElementById('player-health').style.width = Math.max(0, php / BASE_HP * 100) + '%';
    document.getElementById('enemy-health').style.width  = Math.max(0, ehp / BASE_HP * 100) + '%';
}

function appendLog(msg, type) {
    const el = document.getElementById('console-log');
    const line = document.createElement('div');
    line.className = 'log-line log-' + (type || 'info');
    line.textContent = `[${engine ? engine.turn : 0}] ${msg}`;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
}

function showEndOverlay() {
    const overlay = document.getElementById('game-overlay');
    const title   = document.getElementById('overlay-title');
    const message = document.getElementById('overlay-message');

    if (engine.winner === 'human') {
        title.textContent   = '🎉 Victory!';
        title.style.color   = '#3fb950';
        message.textContent = `You destroyed the enemy base in ${engine.turn} turns!`;
    } else {
        title.textContent   = '💀 Defeat';
        title.style.color   = '#f85149';
        message.textContent = 'The bot destroyed your base. Improve your strategy and try again!';
    }
    overlay.classList.remove('hidden');
}

function setButtons(state) {
    const run   = document.getElementById('btn-run');
    const step  = document.getElementById('btn-step');
    const pause = document.getElementById('btn-pause');
    const reset = document.getElementById('btn-reset');

    if (state === 'running') {
        run.disabled   = true;
        step.disabled  = true;
        pause.disabled = false;
        pause.textContent = '⏸ Pause';
        reset.disabled = false;
    } else if (state === 'finished') {
        run.disabled   = true;
        step.disabled  = true;
        pause.disabled = true;
        reset.disabled = false;
    } else {
        run.disabled   = false;
        step.disabled  = false;
        pause.disabled = true;
        reset.disabled = false;
    }
}

/* Utilities */
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
