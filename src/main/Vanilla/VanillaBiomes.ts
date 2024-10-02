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
            name: "minecraft:snowy_plains",
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
            name: "minecraft:old_growth_spruce_taiga",
            color: "#345011"
        },
        {
            key: "minecraft:giant_tree_taiga",
            name: "minecraft:old_growth_pine_taiga",
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
            name: "minecraft:old_growth_birch_forest",
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
            name: "minecraft:wooded_badlands",
            color: "#db8b00"
        },
        {
            key: "minecraft:stone_shore",
            name: "minecraft:stony_shore",
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
            name: "minecraft:windswept_savanna",
            color: "#abdb51"
        },
        {
            key: "minecraft:jungle_edge",
            name: "minecraft:sparse_jungle",
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
            name: "minecraft:windswept_gravelly_hills",
            color: "#819698"
        },
        {
            key: "minecraft:extreme_hills",
            name: "minecraft:windswept_hills",
            color: "#698e91"
        },
        {
            key: "minecraft:wooded_mountains",
            name: "minecraft:windswept_forest",
            color: "#427b5f"
        },
        {
            key: "minecraft:meadow",
            name: "minecraft:meadow",
            color: "#d2ff3d"
        },
        {
            key: "minecraft:lofty_peaks",
            name: "minecraft:jagged_peaks",
            color: "#d7acd3"
        },
        {
            key: "minecraft:snowcapped_peaks",
            name: "minecraft:frozen_peaks",
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
        {
            key: "minecraft:mangrove_swamp",
            name: "minecraft:mangrove_swamp",
            color: "#275442"
        },
        {
            key: "minecraft:deep_dark",
            name: "minecraft:deep_dark",
            color: "#08271f"
        },
        {
            key: "minecraft:cherry_grove",
            name: "minecraft:cherry_grove",
            color: "#dc8add"
        },
        {
            key: "minecraft:pale_garden",
            name: "minecraft:pale_garden",
            color: "#909090"
        },
        {key: "minecraft:soul_sand_valley", name: "minecraft:soul_sand_valley", r: 140, g: 132, b: 108},
        {key: "minecraft:nether_wastes", name: "minecraft:nether_wastes", r: 163, g: 62, b: 62},
        {key: "minecraft:crimson_forest", name: "minecraft:crimson_forest", r: 219, g: 60, b: 46},
        {key: "minecraft:warped_forest", name: "minecraft:warped_forest", r: 68, g: 171, b: 171},
        {key: "minecraft:basalt_deltas", name: "minecraft:basalt_deltas", r: 79, g: 73, b: 66},

        {key: "minecraft:the_end", name: "minecraft:the_end", r: 252, g: 244, b: 121},
        {key: "minecraft:small_end_islands", name: "minecraft:small_end_islands", r: 234, g: 247, b: 52},
        {key: "minecraft:end_midlands", name: "minecraft:end_midlands", r: 170, g: 179, b: 55},
        {key: "minecraft:end_highlands", name: "minecraft:end_highlands", r: 112, g: 117, b: 46},
        {key: "minecraft:end_barrens", name: "minecraft:end_barrens", r: 199, g: 204, b: 137},
        {key: "minecraft:the_void", name: "minecraft:the_void", r: 0, g: 0, b: 0},

        {key: "minecraft:lush_caves", name: "minecraft:lush_caves", r: 112, g: 255, b: 79},
        {key: "minecraft:dripstone_caves", name: "minecraft:dripstone_caves", r: 140, g: 124, b: 0}
    ]

    static registerVanillaBiomes(builder: BiomeBuilder){
        for (let biome of VanillaBiomes.biomes) {
            if (!biome.color){
                biome.color = this.colorToHex(biome.r, biome.g, biome.b)
            }
            const color = biome.color
            Biome.create(builder, biome.name, color, biome.key, true)
        }



    }

    private static colorToHex(r: number, g: number, b: number){
        return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, "0")
    }

}