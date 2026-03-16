/* CodeArena — Bot AI
   Simple but challenging opponent */

class BotAI {
    /**
     * Execute one turn for the bot.
     * @param {GameEngine} engine
     */
    execute(engine) {
        const bot     = engine.bot;
        const human   = engine.human;
        const gold    = bot.gold;
        const units   = bot.units.filter(u => u.hp > 0);
        const workers  = units.filter(u => u.type === 'worker');
        const warriors = units.filter(u => u.type === 'warrior');
        const archers  = units.filter(u => u.type === 'archer');

        /* Spawning strategy */
        const totalFighters = warriors.length + archers.length;

        // Phase 1: get a couple workers
        if (workers.length < 2 && bot.gold >= 50) {
            engine.spawn('bot', 'worker');
        }
        // Phase 2: build army — mix warriors and archers
        if (bot.gold >= 120 && archers.length < warriors.length) {
            engine.spawn('bot', 'archer');
        }
        if (bot.gold >= 100) {
            engine.spawn('bot', 'warrior');
        }
        // Spend remaining gold on warriors if rich
        if (bot.gold >= 200) {
            engine.spawn('bot', 'warrior');
        }

        /* Unit actions */
        const enemyUnits = human.units.filter(u => u.hp > 0);
        const enemyBase  = human.base;

        for (const unit of units) {
            // Workers: gather or move to mine
            if (unit.type === 'worker') {
                if (!engine.gather('bot', unit.id)) {
                    // Move to nearest mine with gold
                    const openMines = engine.mines.filter(m => m.gold > 0);
                    if (openMines.length) {
                        const nearest = openMines.reduce((best, m) => {
                            const d = engine.dist(unit.x, unit.y, m.x, m.y);
                            return d < best.d ? { m, d } : best;
                        }, { m: openMines[0], d: Infinity }).m;
                        engine.moveTowards('bot', unit.id, nearest.x, nearest.y);
                    }
                }
                continue;
            }

            // Fighters: attack or advance
            // Priority 1: attack nearby enemy unit
            let attacked = false;
            if (enemyUnits.length > 0) {
                // Find weakest enemy in range
                const inRange = enemyUnits
                    .map(e => ({ e, d: engine.dist(unit.x, unit.y, e.x, e.y) }))
                    .filter(({ d }) => d <= unit.range)
                    .sort((a, b) => a.e.hp - b.e.hp);

                if (inRange.length > 0) {
                    engine.attack('bot', unit.id, inRange[0].e.id);
                    attacked = true;
                }
            }

            if (attacked) continue;

            // Priority 2: attack enemy base if in range
            const baseDist = engine.dist(unit.x, unit.y, enemyBase.x, enemyBase.y);
            if (baseDist <= unit.range) {
                engine.attackBase('bot', unit.id);
                continue;
            }

            // Priority 3: if enemies are threatening our base, defend
            const threatsNearBase = enemyUnits.filter(
                e => engine.dist(e.x, e.y, bot.base.x, bot.base.y) <= 4
            );

            if (threatsNearBase.length > 0 && totalFighters > 3) {
                // Some units defend
                const nearest = threatsNearBase.reduce((best, e) => {
                    const d = engine.dist(unit.x, unit.y, e.x, e.y);
                    return d < best.d ? { e, d } : best;
                }, { e: threatsNearBase[0], d: Infinity }).e;
                engine.moveTowards('bot', unit.id, nearest.x, nearest.y);
                continue;
            }

            // Priority 4: advance toward enemy base
            engine.moveTowards('bot', unit.id, enemyBase.x, enemyBase.y);
        }
    }
}
