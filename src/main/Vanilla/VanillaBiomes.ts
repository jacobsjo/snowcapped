import { Biome } from "../BuilderData/Biome";
import { BiomeBuilder } from "../BuilderData/BiomeBuilder";



export class VanillaBiomes{
    private static biomes = [
        {name: "minecraft:ocean", r: 50, g: 50, b: 255},
        {name: "minecraft:plains", r: 61, g: 196, b: 12},
        {name: "minecraft:desert", r: 247, g: 237, b: 40},
        {name: "minecraft:mountains", r: 66, g: 66, b: 66, key: "minecraft:extreme_hills"},
        {name: "minecraft:forest", r: 21, g: 107, b: 23},
        {name: "minecraft:taiga", r: 105, g: 69, b: 19},
        {name: "minecraft:swamp", r: 60, g: 130, b: 96},
        {name: "minecraft:river", r: 53, g: 116, b: 232},
        {name: "minecraft:nether_wastes", r: 163, g: 62, b: 62},
        {name: "minecraft:the_end", r: 252, g: 244, b: 121},
        {name: "minecraft:frozen_ocean", r: 209, g: 237, b: 255},
        {name: "minecraft:frozen_river", r: 166, g: 212, b: 255},
        {name: "minecraft:snowy_tundra", r: 239, g: 255, b: 235},
        {name: "minecraft:snowy_mountains", r: 239, g: 255, b: 235},
        {name: "minecraft:mushroom_fields", r: 250, g: 145, b: 248},
        {name: "minecraft:mushroom_field_shore", r: 240, g: 187, b: 252},
        {name: "minecraft:beach", r: 255, g: 249, b: 138},
        {name: "minecraft:desert_hills", r: 181, g: 174, b: 33},
        {name: "minecraft:wooded_hills", r: 17, g: 69, b: 18},
        {name: "minecraft:taiga_hills", r: 30, g: 69, b: 8},
        {name: "minecraft:mountain_edge", r: 110, g: 109, b: 109},
        {name: "minecraft:jungle", r: 45, g: 227, b: 5},
        {name: "minecraft:jungle_hills", r: 33, g: 184, b: 0},
        {name: "minecraft:jungle_edge", r: 66, g: 207, b: 35},
        {name: "minecraft:deep_ocean", r: 5, g: 10, b: 82},
        {name: "minecraft:stone_shore", r: 166, g: 166, b: 166},
        {name: "minecraft:snowy_beach", r: 211, g: 212, b: 193},
        {name: "minecraft:birch_forest", r: 31, g: 145, b: 33},
        {name: "minecraft:birch_forest_hills", r: 28, g: 97, b: 29},
        {name: "minecraft:dark_forest", r: 7, g: 46, b: 7},
        {name: "minecraft:snowy_taiga", r: 179, g: 207, b: 163},
        {name: "minecraft:snowy_taiga_hills", r: 103, g: 117, b: 95},
        {name: "minecraft:giant_tree_taiga", r: 46, g: 23, b: 6},
        {name: "minecraft:giant_tree_taiga_hills", r: 23, g: 15, b: 3},
        {name: "minecraft:wooded_mountains", r: 37, g: 64, b: 36},
        {name: "minecraft:savanna", r: 179, g: 242, b: 61},
        {name: "minecraft:savanna_plateau", r: 132, g: 181, b: 40},
        {name: "minecraft:badlands", r: 212, g: 82, b: 42},
        {name: "minecraft:wooded_badlands_plateau", r: 230, g: 171, b: 62},
        {name: "minecraft:badlands_plateau", r: 120, g: 83, b: 42},
        {name: "minecraft:small_end_islands", r: 234, g: 247, b: 52},
        {name: "minecraft:end_midlands", r: 170, g: 179, b: 55},
        {name: "minecraft:end_highlands", r: 112, g: 117, b: 46},
        {name: "minecraft:end_barrens", r: 199, g: 204, b: 137},
        {name: "minecraft:warm_ocean", r: 95, g: 70, b: 224},
        {name: "minecraft:lukewarm_ocean", r: 80, g: 40, b: 212},
        {name: "minecraft:cold_ocean", r: 120, g: 188, b: 222},
        {name: "minecraft:deep_warm_ocean", r: 64, g: 54, b: 99},
        {name: "minecraft:deep_lukewarm_ocean", r: 49, g: 35, b: 87},
        {name: "minecraft:deep_cold_ocean", r: 59, g: 84, b: 102},
        {name: "minecraft:deep_frozen_ocean", r: 116, g: 133, b: 145},
        {name: "minecraft:the_void", r: 0, g: 0, b: 0},
        {name: "minecraft:sunflower_plains", r: 198, g: 255, b: 92},
        {name: "minecraft:desert_lakes", r: 97, g: 179, b: 186},
        {name: "minecraft:gravelly_mountains", r: 85, g: 101, b: 102, key: "minecraft:gravelly_hills"},
        {name: "minecraft:flower_forest", r: 172, g: 252, b: 33},
        {name: "minecraft:taiga_mountains", r: 46, g: 30, b: 8},
        {name: "minecraft:swamp_hills", r: 32, g: 66, b: 50},
        {name: "minecraft:ice_spikes", r: 194, g: 237, b: 255},
        {name: "minecraft:modified_jungle", r: 11, g: 227, b: 37},
        {name: "minecraft:modified_jungle_edge", r: 71, g: 237, b: 91},
        {name: "minecraft:tall_birch_forest", r: 31, g: 173, b: 34},
        {name: "minecraft:tall_birch_hills", r: 4, g: 74, b: 6},
        {name: "minecraft:dark_forest_hills", r: 0, g: 31, b: 1},
        {name: "minecraft:snowy_taiga_mountains", r: 74, g: 99, b: 74},
        {name: "minecraft:giant_spruce_taiga", r: 25, g: 61, b: 15},
        {name: "minecraft:giant_spruce_taiga_hills", r: 13, g: 36, b: 7},
        {name: "minecraft:modified_gravelly_mountains", r: 82, g: 89, b: 99},
        {name: "minecraft:shattered_savanna", r: 171, g: 219, b: 81},
        {name: "minecraft:shattered_savanna_plateau", r: 124, g: 158, b: 60},
        {name: "minecraft:eroded_badlands", r: 110, g: 44, b: 24},
        {name: "minecraft:modified_wooded_badlands_plateau", r: 128, g: 98, b: 54},
        {name: "minecraft:modified_badlands_plateau", r: 145, g: 101, b: 600},
        {name: "minecraft:bamboo_jungle", r: 158, g: 224, b: 83},
        {name: "minecraft:bamboo_jungle_hills", r: 98, g: 140, b: 49},
        {name: "minecraft:soul_sand_valley", r: 140, g: 132, b: 108},
        {name: "minecraft:crimson_forest", r: 68, g: 171, b: 171},
        {name: "minecraft:warped_forest", r: 219, g: 60, b: 46},
        {name: "minecraft:basalt_deltas", r: 79, g: 73, b: 66},
        {name: "minecraft:snowy_slopes", r: 140, g: 195, b: 222},
        {name: "minecraft:lofty_peaks", r: 196, g: 168, b: 193},
        {name: "minecraft:snowcapped_peaks", r: 200, g: 198, b: 200},
        {name: "minecraft:stony_peaks", r: 82, g: 92, b: 103},
        {name: "minecraft:grove", r: 150, g: 150, b: 189},
        {name: "minecraft:meadow", r: 169, g: 197, b: 80},
        {name: "minecraft:lush_caves", r: 112, g: 255, b: 79},
        {name: "minecraft:dripstone_caves", r: 140, g: 124, b: 0}
    ]

    static registerVanillaBiomes(builder: BiomeBuilder){
        for (let biome of VanillaBiomes.biomes) {
            Biome.create(builder, biome.name, this.colorToHex(biome.r, biome.g, biome.b), biome.key, true)
        }



    }

    private static colorToHex(r: number, g: number, b: number){
        return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, "0")
    }

}