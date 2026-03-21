# CodeArena — Python Strategy Game

**Write Python code to command your army and destroy the enemy base!**

CodeArena is a browser-based real-time strategy game where you write Python code to control units, gather resources, and defeat a bot opponent.

## How to Play

1. Open `index.html` in your browser
2. Write a `strategy()` function in the code editor (right panel)
3. Click **▶ Run Battle** (or press `Ctrl+Enter`)
4. Watch your army fight the bot!

## Game Overview

You and the bot each have:
- A **base** with 1000 HP — if it's destroyed, you lose
- **200 starting gold** to spend on units
- **+10 gold** passive income every turn
- Access to **gold mines** on the map for extra income

The game lasts up to **150 turns**. If neither base is destroyed, the player with the highest score wins (base HP + units + gold).

## Getting Started

The simplest strategy — spawn warriors and send them to attack:

```python
def strategy():
    gold = my_gold()
    
    # Spawn a warrior if you can afford one
    if gold >= 100:
        spawn("warrior")
    
    # Send all units toward enemy base
    base = enemy_base()
    for unit in my_units():
        move_towards(unit["id"], base["x"], base["y"])
```

Your `strategy()` function is called **every turn**. Each unit can do **one action** per turn: move, attack, or gather.
