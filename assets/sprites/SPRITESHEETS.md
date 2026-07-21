# Black Horizon runtime spritesheets

These files are **true runtime atlases**. They are not mockups, screenshots, character boards, or marketing composites.

| Atlas | Grid | Cell | Runtime use |
|---|---:|---:|---|
| `player-atlas-v3.svg` | 8 × 4 | 128 × 128 | four directional rows, eight locomotion frames |
| `enemy-atlas-v3.svg` | 4 × 11 | 128 × 128 | idle, attack, hit and death states for eleven archetypes |
| `pickup-weapon-atlas-v3.svg` | 6 × 2 | 112 × 112 | six pickups and six weapons |
| `environment-atlas-v3.svg` | 6 × 6 | 160 × 160 | six biomes × six tile/prop classes |
| `vfx-atlas-v3.svg` | 8 × 4 | 128 × 128 | muzzle, explosion, smoke and energy sequences |
| `ui-atlas-v3.svg` | 8 × 4 | 96 × 96 | 32 HUD, objective, mutator and doctrine icons |

All sheets use fixed, machine-addressable cells with transparent backgrounds and no embedded labels. The runtime loader upgrades historical atlas paths to these immutable v3 files before the renderer initializes.

`spritesheet-spec.json` is the machine-readable source-rectangle contract. The production presentation WebP remains separate and is used only for full-screen art, comics, menus and showcase panels.
