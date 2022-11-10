import { Identifier } from "deepslate";
import { Datapack, DataType } from "mc-datapack-loader";
import { BiomeBuilder } from "./BiomeBuilder";

const DENSITY_FUNCTIONS = [
    "minecraft:overworld/offset",
    "minecraft:overworld/factor",
    "minecraft:overworld/jaggedness"
]

const OFFSET_DF = (spline: unknown) => {
    return {
        "argument": {
            "argument": {
                "argument1": {
                    "argument1": {
                        "type": "minecraft:blend_offset"
                    },
                    "argument2": {
                        "argument1": 1.0,
                        "argument2": {
                            "argument1": -1.0,
                            "argument2": {
                                "argument": {
                                    "type": "minecraft:blend_alpha"
                                },
                                "type": "minecraft:cache_once"
                            },
                            "type": "minecraft:mul"
                        },
                        "type": "minecraft:add"
                    },
                    "type": "minecraft:mul"
                },
                "argument2": {
                    "argument1": {
                        "argument1": -0.5037500262260437,
                        "argument2": {
                            "spline": spline,
                            "type": "minecraft:spline"
                        },
                        "type": "minecraft:add"
                    },
                    "argument2": {
                        "argument": {
                            "type": "minecraft:blend_alpha"
                        },
                        "type": "minecraft:cache_once"
                    },
                    "type": "minecraft:mul"
                },
                "type": "minecraft:add"
            },
            "type": "minecraft:cache_2d"
        },
        "type": "minecraft:flat_cache"
    }
}

const FACTOR_DF = (spline: unknown) => {
    return {
        "argument": {
            "argument": {
                "argument1": 10.0,
                "argument2": {
                    "argument1": {
                        "type": "minecraft:blend_alpha"
                    },
                    "argument2": {
                        "argument1": -10.0,
                        "argument2": {
                            "spline": spline,
                            "type": "minecraft:spline"
                        },
                        "type": "minecraft:add"
                    },
                    "type": "minecraft:mul"
                },
                "type": "minecraft:add"
            },
            "type": "minecraft:cache_2d"
        },
        "type": "minecraft:flat_cache"
    }
}

const JAGGEDNESS_DF = (spline: unknown) => {
    return {
        "argument": {
            "argument": {
                "argument1": 0.0,
                "argument2": {
                    "argument1": {
                        "type": "minecraft:blend_alpha"
                    },
                    "argument2": {
                        "argument1": -0.0,
                        "argument2": {
                            "spline": spline,
                            "type": "minecraft:spline"
                        },
                        "type": "minecraft:add"
                    },
                    "type": "minecraft:mul"
                },
                "type": "minecraft:add"
            },
            "type": "minecraft:cache_2d"
        },
        "type": "minecraft:flat_cache"
    }
}

export class LegacyConfigDatapack implements Datapack {

    constructor(private builder: BiomeBuilder) {

    }

    async has(type: DataType, id: Identifier): Promise<boolean> {
        if (type === "worldgen/density_function") {
            return DENSITY_FUNCTIONS.includes(id.toString())
        } else {
            return false
        }
    }

    async getIds(type: DataType): Promise<Identifier[]> {
        if (type === "worldgen/density_function") {
            return DENSITY_FUNCTIONS.map((str) => Identifier.parse(str))
        } else {
            return []
        }
    }

    async get(type: DataType, id: Identifier): Promise<unknown> {
        if (type === "worldgen/density_function" && id.namespace === "minecraft") {
            if (id.path === "overworld/offset")
                return OFFSET_DF(this.builder.splines["offset"].export())
            else if (id.path === "overworld/factor")
                return FACTOR_DF(this.builder.splines["factor"].export())
            else if (id.path === "overworld/jaggedness")
                return JAGGEDNESS_DF(this.builder.splines["jaggedness"].export())
            else
                return undefined
        } else {
            return undefined
        }
    }

}