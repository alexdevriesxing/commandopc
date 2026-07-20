# Commando PC: Operation Cinder

A complete original web arcade shooter inspired by the urgency and readability of classic top-down run-and-gun games, rebuilt with a modern comic-book presentation. The game uses no copied franchise assets and no runtime dependencies: rendering is custom HTML5 Canvas, while the score and sound effects are synthesized live with WebAudio.

![Operation Cinder key art](assets/key-art.svg)

## Play locally

```bash
npm run dev
```

Open `http://localhost:4173`.

## Campaign

American Special Forces operator Captain Mara Vance, callsign Ranger One, enters Iran's central desert to recover a stolen plutonium core from the fictional Cinder Directorate. The story is presented through a five-panel original comic intro and six distinct missions:

1. **Dust Knife** — canyon border cordon
2. **Green Mirage** — oasis and qanat settlement
3. **Broken Crown** — mountain fortress ruins
4. **White Horizon** — salt-flat convoy pursuit
5. **Black Glass** — night refinery sabotage
6. **Cinder Vault** — isotope facility and boss encounter

The narrative and factions are fictional. No real operation, unit deployment, person, flag, or faction insignia is depicted.

## Deep campaign systems

- Four distinct difficulty tiers: **Story**, **Operative**, **Veteran**, and **Nightmare**
- Difficulty-specific hostile durability, damage, aggression, formation density, elite frequency, supply scarcity, starting resources, and score multipliers
- A dynamic combat director that reacts to mission progress, player health, and combo pressure with reinforcement squads and emergency supplies
- Eight operation mutators including crossfire teams, armored columns, drone swarms, hunter teams, medics, volatile elites, minefields, and tactical blackouts
- Eight persistent field doctrines selected between missions, enabling different health, armor, damage, reload, dash, scavenging, explosive, and combo builds
- Optional mission operations, S/A/B/C mission ranks, elite bonuses, and difficulty-adjusted scoring

## Features

- Six complete campaign levels with individual palettes, weather, props, objectives and music patterns
- Ten standard enemy archetypes: rifleman, rusher, grenadier, marksman, shield unit, heavy unit, drone, rocketeer, field medic, and hunter, plus a multi-phase boss
- Elite enemy variants with stronger stats, bonus scoring, unique UI treatment, improved drops, and volatile death behavior on selected operations
- Six weapons: carbine, SMG, shotgun, LMG, grenade launcher and arc prototype
- Dash invulnerability, grenades, armor, pickups, reloads, weapon cycling and combo scoring
- Destructible relays, coolant pumps, convoy and recoverable plutonium core
- Original key art, logo, comic panels, HUD, menu, difficulty screen, field armory, briefing, pause, victory, defeat and campaign-complete screens
- Procedural muzzle flashes, shell ejection, impact sparks, smoke, dust, explosions, screen shake, decals and enemy-specific death treatments
- Original synthesized soundtrack with mission-specific patterns and procedural SFX
- Keyboard, mouse and touch controls
- Local progress/high-score/difficulty saving, offline service-worker cache and GitHub Pages deployment workflow

## Controls

| Action | Input |
| --- | --- |
| Move | WASD or arrow keys |
| Aim | Mouse |
| Fire | Mouse button or J |
| Reload | R |
| Throw grenade | Space |
| Dash | Shift |
| Cycle weapon | Q or Tab |
| Pause | P or Escape |
| Toggle audio | M |

Touch devices receive an analog movement stick, fire, dash and grenade controls. Touch movement automatically aims at the nearest active threat.

## Validation

```bash
npm run check
```

This performs JavaScript syntax checks and verifies the shell, campaign data, assets, audio engine, four difficulty presets, operation mutators, field doctrines, combat director, weapon roster, and expanded enemy roster.

## Asset policy

All visual assets in `assets/`, all Canvas-rendered art, the story, music patterns, audio synthesis, UI, VFX and source code were created specifically for this repository. There are no stock packs, copied sprites, sample tracks or placeholder assets.
