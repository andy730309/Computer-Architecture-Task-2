# Anatomy figure: mechanical arm

Interactive isometric robot arm built with the [Anatomy](https://github.com/wheresryan22/anatomy) kit (MIT).

## Open

After building, open in a browser:

- `mechanical-arm/mechanical-arm-light.html` — light theme (default craft target)
- `mechanical-arm/mechanical-arm.html` — dark theme

## Build

```sh
cd mechanical-arm
node build.mjs          # dark
node build.mjs --light  # light
```

Requires Node.js 20.10+.

## Interaction

- **Drag** on the figure: base yaw, shoulder pitch, elbow pitch
- **Arrow keys**: base (left/right) and shoulder (up/down)
- **`[` / `]`**: elbow bend

The card readout shows joint angles in degrees.
