# Layered Head Avatar Asset

`david-head-layered-v2.glb` is the current fixed-gaze development avatar. It
embeds the aligned transparent renders from:

- `public/images/avatar/david-head-rest-v3.png`
- `public/images/avatar/david-head-blink-v3.png`

Build it from the repository root with:

```sh
node scripts/build-avatar-glb.mjs
```

## Runtime contract

```text
DavidAvatarRoot
└── HeadPivot
    ├── HeadRest
    └── HeadBlink
```

`HeadRest` is a full transparent plane preserving the complete 1254×1254 source
frame. `HeadBlink` remains one mesh node, but its geometry contains only two
disjoint eye-region patch grids sampling the blink texture. Both use the same
5.82×5.82 frame coordinate system and are centered at the local origin.
`HeadRest` is at z=0; `HeadBlink` is at z=0.002.

Each eye patch is a 4×4 grid. Its outer vertex ring has alpha 0 and its inner
four vertices have alpha 1 through normalized glTF `COLOR_0`, feathering the
closed-eye render into the resting face. Exact source pixel and UV bounds are:

| Eye | Bounds | Pixels `(left, top, right, bottom)` | UV bounds |
| --- | --- | --- | --- |
| Left | Outer | `(395, 535, 620, 665)` | `(0.314992, 0.426635, 0.494418, 0.530303)` |
| Left | Inner | `(415, 560, 600, 645)` | `(0.330941, 0.446571, 0.478469, 0.514354)` |
| Right | Outer | `(635, 535, 860, 665)` | `(0.506380, 0.426635, 0.685805, 0.530303)` |
| Right | Inner | `(655, 560, 840, 645)` | `(0.522329, 0.446571, 0.669856, 0.514354)` |

`HeadRestMaterial` starts at opacity `1`; `HeadBlinkMaterial` starts at opacity
`0`, so the blink patches are hidden without a first-frame flash. The animation
controller should animate the blink material from 0 to 1 and back while it
applies subtle idle and pointer rotation only to `HeadPivot`. The gaze remains
fixed. Because no blink geometry exists outside the eye patches, mouth, jaw,
ears, and hair cannot switch to the edited frame during a blink; any skin
transition is confined to the feathered periocular regions.

This is deliberately labeled `layered-card-not-facial-sculpt` and
`temporary-development-avatar` in the GLB extras. It preserves the approved
selfie-derived identity render without inventing facial depth. A future
selfie-derived volumetric model can replace it behind the same `HeadPivot`
interface and expose `blinkLeft` / `blinkRight` morph targets.
