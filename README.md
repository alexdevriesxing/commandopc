# Black Horizon: Cinder Protocol

**Black Horizon: Cinder Protocol** is an original top-down desert extraction shooter with a six-mission campaign, persistent field doctrines, dynamic threat escalation, and a complete production visual system. It has no runtime dependencies: gameplay renders through HTML5 Canvas, the soundtrack and SFX are synthesized with WebAudio, and the shipped visual pack combines web-native gameplay atlases with a cache-efficient raster presentation atlas.

![Black Horizon key art](assets/key-art.svg)

## Play locally

```bash
npm run dev
```

Open `http://localhost:4173`.

## Campaign

American Special Forces operator Captain Mara Vance, callsign Ranger One, enters Iran's central desert to recover a stolen plutonium core from the fictional Cinder Directorate. The narrative is presented through a production comic intro and six distinct operations:

1. **Dust Knife** — canyon border cordon
2. **Green Mirage** — oasis and qanat settlement
3. **Broken Crown** — mountain fortress ruins
4. **White Horizon** — salt-flat convoy pursuit
5. **Black Glass** — night refinery sabotage
6. **Cinder Vault** — isotope facility and multi-phase boss encounter

The story, characters, organizations, insignia, and operation are fictional.

## Deep campaign systems

- Four difficulties: Story, Operative, Veteran, and Nightmare
- Dynamic combat director reacting to route progress, health, and combo pressure
- Ten standard enemy archetypes plus a multi-phase boss
- Elite variants, reinforcement formations, medics, hunters, drones, shields, heavies, and rocketeers
- Eight mission mutators including blackout, minefields, drone swarms, armored patrols, and volatile elites
- Eight persistent field doctrines supporting damage, armor, mobility, scavenging, explosives, reload, and combo builds
- Optional operations, S/A/B/C mission ranks, difficulty score multipliers, and local progression
- Six weapons, grenades, dash invulnerability, armor, pickups, destructible objectives, convoy interception, and core recovery

## Production asset system

The visual overhaul replaces the original placeholder presentation with a two-layer production pipeline:

### Gameplay atlases

- `assets/sprites/player-atlas.svg` — 32 directional player animation frames
- `assets/sprites/enemy-atlas.svg` — 44 enemy state frames across eleven archetypes
- `assets/sprites/pickup-weapon-atlas.svg` — pickups and six weapon silhouettes
- `assets/tiles/environment-atlas.svg` — six biome rows with ground, feature, vehicle, structure, and barrier tiles
- `assets/vfx/vfx-atlas.svg` — 32 muzzle, explosion, smoke, and energy frames
- `assets/ui/ui-atlas.svg` — difficulty, objective, mutator, doctrine, and resource icons

### Presentation boards

A 10-region production board atlas supplies the menu key art, comic introduction, operator animation showcase, enemy roster, boss phases, arsenal and pickups, VFX showcase, complete HUD/UI language, environment kit, and final logo treatment. The WebP atlas is stored as fourteen labeled repository parts and rebuilt in memory by the loader, keeping GitHub transport and offline caching deterministic.

- `src/production-raster.js` — production-board rendering and branded emergency fallbacks
- `assets/raster/production-board-atlas-00.part` … `production-board-atlas-13.part` — encoded WebP atlas payload
- `assets/asset-manifest.json` — exact vector grids, raster regions, dimensions, and source paths
- `assets/intro/comic-intro.svg` and `assets/portraits/hero.svg` — scalable supporting artwork
- Rebuilt logo, favicon, and key art for the **Black Horizon** identity

Every normal and failure-state screen now remains **Black Horizon** branded. The historical renderer is no longer exposed as a user-visible fallback; lightweight Black Horizon geometry is used only when both production layers fail to decode.

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

Touch devices receive an analog movement stick, fire, dash, and grenade controls with nearest-threat aim assistance.

## Validation

```bash
npm run check
```

Validation assembles every source chunk, parses both production layers, reconstructs the raster atlas, validates every SVG and manifest entry, checks the branded fallback path, and verifies the campaign, difficulty, director, doctrine, mutator, weapon, and enemy systems.

## Asset policy

All repository visuals, UI, animation atlases, story material, music patterns, audio synthesis, and source code were created specifically for this project. There are no stock packs, copied sprites, sample tracks, external fonts, third-party runtime libraries, or placeholder assets.
