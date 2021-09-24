import { Biome } from "../BuilderData/Biome";
import { BiomeBuilder } from "../BuilderData/BiomeBuilder";



export class VanillaBiomes{
    static biomes = [
        {
            key: "minecraft:mushroom_fields",
            name: "minecraft:mushroom_fields",
            color: "#fa91f8"
        },
        {
            key: "minecraft:deep_frozen_ocean",
            name: "minecraft:deep_frozen_ocean",
            color: "#3478a2"
        },
        {
            key: "minecraft:deep_cold_ocean",
            name: "minecraft:deep_cold_ocean",
            color: "#004785"
        },
        {
            key: "minecraft:deep_ocean",
            name: "minecraft:deep_ocean",
            color: "#03009e"
        },
        {
            key: "minecraft:deep_warm_ocean",
            name: "minecraft:deep_warm_ocean",
            color: "#4100a3"
        },
        {
            key: "minecraft:deep_lukewarm_ocean",
            name: "minecraft:deep_lukewarm_ocean",
            color: "#26008f"
        },
        {
            key: "minecraft:frozen_ocean",
            name: "minecraft:frozen_ocean",
            color: "#20afff"
        },
        {
            key: "minecraft:cold_ocean",
            name: "minecraft:cold_ocean",
            color: "#007bff"
        },
        {
            key: "minecraft:ocean",
            name: "minecraft:ocean",
            color: "#0000ff"
        },
        {
            key: "minecraft:warm_ocean",
            name: "minecraft:warm_ocean",
            color: "#6400ff"
        },
        {
            key: "minecraft:lukewarm_ocean",
            name: "minecraft:lukewarm_ocean",
            color: "#4c00ff"
        },
        {
            key: "minecraft:frozen_river",
            name: "minecraft:frozen_river",
            color: "#a6d4ff"
        },
        {
            key: "minecraft:river",
            name: "minecraft:river",
            color: "#4d82ff"
        },
        {
            key: "minecraft:swamp",
            name: "minecraft:swamp",
            color: "#5dbb8e"
        },
        {
            key: "minecraft:snowy_tundra",
            name: "minecraft:snowy_tundra",
            color: "#ffffff"
        },
        {
            key: "minecraft:ice_spikes",
            name: "minecraft:ice_spikes",
            color: "#c8eefe"
        },
        {
            key: "minecraft:snowy_taiga",
            name: "minecraft:snowy_taiga",
            color: "#d1ffd3"
        },
        {
            key: "minecraft:plains",
            name: "minecraft:plains",
            color: "#73e43f"
        },
        {
            key: "minecraft:forest",
            name: "minecraft:forest",
            color: "#009903"
        },
        {
            key: "minecraft:taiga",
            name: "minecraft:taiga",
            color: "#457119"
        },
        {
            key: "minecraft:giant_spruce_taiga",
            name: "minecraft:giant_spruce_taiga",
            color: "#345011"
        },
        {
            key: "minecraft:giant_tree_taiga",
            name: "minecraft:giant_tree_taiga",
            color: "#444d00"
        },
        {
            key: "minecraft:sunflower_plains",
            name: "minecraft:sunflower_plains",
            color: "#a6ff00"
        },
        {
            key: "minecraft:flower_forest",
            name: "minecraft:flower_forest",
            color: "#77bc01"
        },
        {
            key: "minecraft:birch_forest",
            name: "minecraft:birch_forest",
            color: "#6ac65b"
        },
        {
            key: "minecraft:tall_birch_forest",
            name: "minecraft:tall_birch_forest",
            color: "#59e45a"
        },
        {
            key: "minecraft:dark_forest",
            name: "minecraft:dark_forest",
            color: "#017401"
        },
        {
            key: "minecraft:savanna",
            name: "minecraft:savanna",
            color: "#b3f23d"
        },
        {
            key: "minecraft:jungle",
            name: "minecraft:jungle",
            color: "#00ff00"
        },
        {
            key: "minecraft:eroded_badlands",
            name: "minecraft:eroded_badlands",
            color: "#b85000"
        },
        {
            key: "minecraft:badlands",
            name: "minecraft:badlands",
            color: "#ff6f00"
        },
        {
            key: "minecraft:wooded_badlands_plateau",
            name: "minecraft:wooded_badlands_plateau",
            color: "#db8b00"
        },
        {
            key: "minecraft:stone_shore",
            name: "minecraft:stone_shore",
            color: "#666666"
        },
        {
            key: "minecraft:snowy_beach",
            name: "minecraft:snowy_beach",
            color: "#d6daaa"
        },
        {
            key: "minecraft:beach",
            name: "minecraft:beach",
            color: "#fff98a"
        },
        {
            key: "minecraft:desert",
            name: "minecraft:desert",
            color: "#ffff00"
        },
        {
            key: "minecraft:shattered_savanna",
            name: "minecraft:shattered_savanna",
            color: "#abdb51"
        },
        {
            key: "minecraft:jungle_edge",
            name: "minecraft:jungle_edge",
            color: "#80ff00"
        },
        {
            key: "minecraft:snowy_slopes",
            name: "minecraft:snowy_slopes",
            color: "#8acaea"
        },
        {
            key: "minecraft:grove",
            name: "minecraft:grove",
            color: "#afafe4"
        },
        {
            key: "minecraft:savanna_plateau",
            name: "minecraft:savanna_plateau",
            color: "#80ab30"
        },
        {
            key: "minecraft:gravelly_hills",
            name: "minecraft:gravelly_mountains",
            color: "#819698"
        },
        {
            key: "minecraft:extreme_hills",
            name: "minecraft:mountains",
            color: "#698e91"
        },
        {
            key: "minecraft:wooded_mountains",
            name: "minecraft:wooded_mountains",
            color: "#427b5f"
        },
        {
            key: "minecraft:meadow",
            name: "minecraft:meadow",
            color: "#d2ff3d"
        },
        {
            key: "minecraft:lofty_peaks",
            name: "minecraft:lofty_peaks",
            color: "#d7acd3"
        },
        {
            key: "minecraft:snowcapped_peaks",
            name: "minecraft:snowcapped_peaks",
            color: "#dedede"
        },
        {
            key: "minecraft:stony_peaks",
            name: "minecraft:stony_peaks",
            color: "#adbfe1"
        },
        {
            key: "minecraft:bamboo_jungle",
            name: "minecraft:bamboo_jungle",
            color: "#00ff57"
        },

        {name: "minecraft:nether_wastes", r: 163, g: 62, b: 62},
        {name: "minecraft:soul_sand_valley", r: 140, g: 132, b: 108},
        {name: "minecraft:crimson_forest", r: 68, g: 171, b: 171},
        {name: "minecraft:warped_forest", r: 219, g: 60, b: 46},
        {name: "minecraft:basalt_deltas", r: 79, g: 73, b: 66},

        {name: "minecraft:the_end", r: 252, g: 244, b: 121},
        {name: "minecraft:small_end_islands", r: 234, g: 247, b: 52},
        {name: "minecraft:end_midlands", r: 170, g: 179, b: 55},
        {name: "minecraft:end_highlands", r: 112, g: 117, b: 46},
        {name: "minecraft:end_barrens", r: 199, g: 204, b: 137},
        {name: "minecraft:the_void", r: 0, g: 0, b: 0},

        {name: "minecraft:lush_caves", r: 112, g: 255, b: 79},
        {name: "minecraft:dripstone_caves", r: 140, g: 124, b: 0},

        {name: "minecraft:snowy_mountains", r: 239, g: 255, b: 235},
        {name: "minecraft:mushroom_field_shore", r: 240, g: 187, b: 252},
        {name: "minecraft:desert_hills", r: 181, g: 174, b: 33},
        {name: "minecraft:wooded_hills", r: 17, g: 69, b: 18},
        {name: "minecraft:taiga_hills", r: 30, g: 69, b: 8},
        {name: "minecraft:mountain_edge", r: 110, g: 109, b: 109},
        {name: "minecraft:jungle_hills", r: 33, g: 184, b: 0},
        {name: "minecraft:birch_forest_hills", r: 28, g: 97, b: 29},
        {name: "minecraft:snowy_taiga_hills", r: 103, g: 117, b: 95},
        {name: "minecraft:giant_tree_taiga_hills", r: 23, g: 15, b: 3},
        {name: "minecraft:badlands_plateau", r: 120, g: 83, b: 42},
        {name: "minecraft:desert_lakes", r: 97, g: 179, b: 186},
        {name: "minecraft:taiga_mountains", r: 46, g: 30, b: 8},
        {name: "minecraft:swamp_hills", r: 32, g: 66, b: 50},
        {name: "minecraft:modified_jungle", r: 11, g: 227, b: 37},
        {name: "minecraft:modified_jungle_edge", r: 71, g: 237, b: 91},
        {name: "minecraft:tall_birch_hills", r: 4, g: 74, b: 6},
        {name: "minecraft:dark_forest_hills", r: 0, g: 31, b: 1},
        {name: "minecraft:snowy_taiga_mountains", r: 74, g: 99, b: 74},
        {name: "minecraft:giant_spruce_taiga_hills", r: 13, g: 36, b: 7},
        {name: "minecraft:modified_gravelly_mountains", r: 82, g: 89, b: 99},
        {name: "minecraft:shattered_savanna_plateau", r: 124, g: 158, b: 60},
        {name: "minecraft:modified_wooded_badlands_plateau", r: 128, g: 98, b: 54},
        {name: "minecraft:modified_badlands_plateau", r: 145, g: 101, b: 600},
        {name: "minecraft:bamboo_jungle_hills", r: 98, g: 140, b: 49}
    ]

    static registerVanillaBiomes(builder: BiomeBuilder){
        for (let biome of VanillaBiomes.biomes) {
            const color = biome.color ?? this.colorToHex(biome.r, biome.g, biome.b)
            Biome.create(builder, biome.name, color, biome.key, true)
        }



    }

    private static colorToHex(r: number, g: number, b: number){
        return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, "0")
    }

}