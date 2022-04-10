

export interface VersionInfo{
    hasTerrainShaper: boolean,
    hasDensityFunctions: boolean,
    fixedSeed: boolean
}

export const VERSION_INFO: {[version: string]: VersionInfo} = {
    "1_18_1":
        {
            hasTerrainShaper: true,
            hasDensityFunctions: false,
            fixedSeed: true
        },
    "1_18_2":
        {
            hasTerrainShaper: true,
            hasDensityFunctions: true,
            fixedSeed: true
        },
    "1_19":
        {
            hasTerrainShaper: false,
            hasDensityFunctions: true,
            fixedSeed: false
        }
}

