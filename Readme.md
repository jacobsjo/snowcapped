
![Snowcapped](docs/header.svg)
===============================

## Use online at https://snowcapped.jacobsjo.eu
--------

Snowcapped: A Minecraft dimension layout editor for Minecraft 1.18 (snapshots). It is based on the vanilla overworld biome builder.

You define the biomes in each cell of the 5 dimensional grid in an iterative way.
1. There are Layouts that define different biome configurations depending on temperature and humidity.
2. There are Slices that define which layout to use depending on continentalness and erosion.
3. Each slice is then assigned to different weirdness ranges.

Snowcapped also includes a map that lets you imediatly see your changes.

When done, the tool can export the configuration as a multi-noise json file. There is a basic optimizer for that so that adjacent grid cells with the same biome are reduced to a single entry. The resulting json file is thus much smaller than even the vanilla one.


Code instalation
----------------
Install Dependencies:
``` bash
npm i
```

Build into `dist/`:
``` bash
npm run build
```

To directly serve as local web server: (on http://localhost:8080)
``` bash
npm run start
```
