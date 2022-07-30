import { Climate } from "deepslate";
import { Biome } from "./Biome";
import { GridSpline } from "./GridSpline";
import { GridElement, Mode } from "./GridElement";
import { GridElementUnassigned } from "./GridElementUnassigned";
import { Grid } from "./Grid";
export declare type MultiNoiseParameters = {
    w: number;
    c: number;
    e: number;
    h: number;
    t: number;
    d: number;
};
export declare type MultiNoiseIndexes = {
    d: number;
    w: number;
    c: number;
    e: number;
    h: number;
    t: number;
};
export declare type PartialMultiNoiseIndexes = {
    d?: number;
    w?: number;
    c?: number;
    e?: number;
    h?: number;
    t?: number;
};
export declare type NoiseSetting = {
    firstOctave: number;
    amplitudes: number[];
};
export declare type NoiseType = "continentalness" | "weirdness" | "erosion" | "temperature" | "humidity" | "shift";
export declare class BiomeBuilder {
    hasChanges: boolean;
    continentalnesses: Climate.Param[];
    erosions: Climate.Param[];
    weirdnesses: Climate.Param[];
    temperatures: Climate.Param[];
    humidities: Climate.Param[];
    depths: Climate.Param[];
    splines: {
        [key: string]: GridSpline;
    };
    gridElements: Map<string, GridElement>;
    vanillaBiomes: Map<string, Biome>;
    slices: Grid[];
    layouts: Grid[];
    biomes: Biome[];
    dimension: Grid;
    modes: ("A" | "B")[];
    layoutElementUnassigned: GridElementUnassigned;
    noiseSettings: {
        "continentalness": NoiseSetting;
        "erosion": NoiseSetting;
        "weirdness": NoiseSetting;
        "humidity": NoiseSetting;
        "temperature": NoiseSetting;
        "shift": NoiseSetting;
    };
    fixedNoises: {
        [key: string]: number;
    };
    vis_y_level: number | "surface";
    seed: bigint;
    dimensionName: string;
    targetVersion: string;
    exportDimension: boolean;
    noiseSettingsName: string;
    exportSplines: boolean;
    exportNoises: boolean;
    useLegacyRandom: boolean;
    constructor();
    loadJSON(json: any): void;
    toJSON(): {
        dimensionName: string;
        seed: string;
        noiseSettings: {
            continentalness: NoiseSetting;
            erosion: NoiseSetting;
            weirdness: NoiseSetting;
            humidity: NoiseSetting;
            temperature: NoiseSetting;
            shift: NoiseSetting;
        };
        useLegacyRandom: boolean;
        continentalnesses: Climate.Param[];
        erosions: Climate.Param[];
        weirdnesses: Climate.Param[];
        temperatures: Climate.Param[];
        humidities: Climate.Param[];
        depths: Climate.Param[];
        dimension: Grid;
        modes: ("A" | "B")[];
        layouts: Grid[];
        slices: Grid[];
        biomes: Biome[];
        targetVersion: string;
        exportDimension: boolean;
        exportNoises: boolean;
        exportSplines: boolean;
        noiseSettingsName: string;
        splines: {
            offset: {
                continentalnesses: number[];
                erosions: number[];
                splines: {
                    coordinate: string;
                    points: {
                        location: number;
                        value: number;
                        derivative: number;
                    }[];
                }[][];
            };
            factor: {
                continentalnesses: number[];
                erosions: number[];
                splines: {
                    coordinate: string;
                    points: {
                        location: number;
                        value: number;
                        derivative: number;
                    }[];
                }[][];
            };
            jaggedness: {
                continentalnesses: number[];
                erosions: number[];
                splines: {
                    coordinate: string;
                    points: {
                        location: number;
                        value: number;
                        derivative: number;
                    }[];
                }[][];
            };
        };
        version: number;
    };
    getSlice(name: string): GridElement;
    getLayoutElement(name: string): GridElement;
    registerVanillaBiome(biome: Biome): void;
    registerGridElement(element: GridElement): void;
    registerSlice(element: Grid): void;
    registerLayout(element: Grid): void;
    registerBiome(element: Biome): void;
    removeGridElement(element: GridElement): void;
    findIndex(array: Climate.Param[], number: number): number;
    getIndexes(params: MultiNoiseParameters): MultiNoiseIndexes;
    lookupRecursive(indexes: MultiNoiseIndexes): Biome;
    lookupRecursiveWithTracking(indexes: MultiNoiseIndexes): {
        slice?: Grid;
        mode?: Mode;
        layout?: Grid;
        biome?: Biome;
    };
    deleteParam(param: "humidity" | "temperature" | "continentalness" | "erosion" | "weirdness" | "depth", id: number): void;
    splitParam(param: "humidity" | "temperature" | "continentalness" | "erosion" | "weirdness" | "depth", id: number, position?: "mid" | "start" | "end"): void;
    getNumTemperatures(): number;
    getNumHumidities(): number;
    getNumContinentalnesses(): number;
    getNumErosions(): number;
    getNumWeirdnesses(): number;
    getNumDepths(): number;
    getVersionInfo(): import("../Vanilla/VersionInfo").VersionInfo;
}
//# sourceMappingURL=BiomeBuilder.d.ts.map