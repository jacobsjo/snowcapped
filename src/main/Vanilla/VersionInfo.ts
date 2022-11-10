

export interface VersionInfo{
    hasTerrainShaper: boolean,
    hasDensityFunctions: boolean,
    fixedSeed: boolean
}

export const VERSION_INFO: {[version: string]: VersionInfo} = {
    "1_19":
        {
            hasTerrainShaper: false,
            hasDensityFunctions: true,
            fixedSeed: false
        }
}

