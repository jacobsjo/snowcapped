
# Snowcapped

## Use online at https://snowcapped.jacobsjo.eu

Snowcapped is a Minecraft dimension layout editor for Minecraft. It is based on the vanilla overworld biome builder.

You define the biomes in each cell of the 5 dimensional grid in an iterative way.
1. There are Layouts that define different biome configurations depending on temperature and humidity.
2. There are Slices that define which layout to use depending on continentalness and erosion.
3. Each slice is then assigned to different weirdness ranges.

Snowcapped also includes a map that lets you imediatly see your changes.

When done, the tool can export the configuration as a multi-noise json file. There is a basic optimizer for that so that adjacent grid cells with the same biome are reduced to a single entry. The resulting json file is thus much smaller than even the vanilla one.

For more details, see the [wiki](https://github.com/jacobsjo/snowcapped/wiki)

### Video introduction and tutorial:
[![Intro to Snowcapped | Smithed Summit Panel](https://img.youtube.com/vi/9S0LRcq7-Wk/mqdefault.jpg)](https://www.youtube.com/watch?v=9S0LRcq7-Wk)


# Contributing
Contributions are welcome! For significant feature additions please ask beforehand by opening an issue or on discord.

## Setup dev environment:

1. Install python dependencies: `pip install -r requirements.txt`
2. Install node dependencies: `npm i`
3. Create vanilla datapack zip files: `npm run createZips`
4. Start dev server: `npm run dev` and open http://localhost:5173/ 
5. Build final page: `npm run build`
6. Test build version: `npm run preview` and open https://localhost:4173/
