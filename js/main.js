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
