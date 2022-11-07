import { Climate } from "deepslate"
import { VanillaBiomes } from "../Vanilla/VanillaBiomes"
import { VanillaNoiseSettings } from "../Vanilla/VanillaNoiseSettings"
import { VanillaSpline } from "../Vanilla/VanillaSplines"
import { ABElement } from "./ABBiome"
import { Biome } from "./Biome"
import { GridSpline } from "./GridSpline"
import { GridElement, Mode } from "./GridElement"
import { GridElementUnassigned } from "./GridElementUnassigned"
import { DimensionMultiNoiseIndexesAccessor, Grid, LayoutMultiNoiseIndexesAccessor, SliceMultiNoiseIndexesAccessor } from "./Grid"
import { DataFixer } from "./DataFixer"
import { DATA_VERSION } from "../../SharedConstants"
import { version } from "leaflet"
import { sortedIndexBy, takeWhile } from "lodash"
import { VERSION_INFO } from "../Vanilla/VersionInfo"
import { CompositeDatapack, Datapack, PromiseDatapack, ZipDatapack } from "mc-datapack-loader"
import { LegacyConfigDatapack } from "./LegacyConfigDatapack"

export type MultiNoiseParameters = { w: number, c: number, e: number, h: number, t: number, d: number }
export type MultiNoiseIndexes = { d: number, w: number, c: number, e: number, h: number, t: number }
export type PartialMultiNoiseIndexes = { d?: number, w?: number, c?: number, e?: number, h?: number, t?: number }

export type NoiseSetting = { firstOctave: number, amplitudes: number[] }
export type NoiseType = "continentalness" | "weirdness" | "erosion" | "temperature" | "humidity" | "shift"

export class BiomeBuilder {
    hasChanges: boolean

    continentalnesses: Climate.Param[]
    erosions: Climate.Param[]
    weirdnesses: Climate.Param[]
    temperatures: Climate.Param[]
    humidities: Climate.Param[]
    depths: Climate.Param[]

    splines: {
        [key: string]: GridSpline,
    } = {}

    gridElements: Map<string, GridElement>
    vanillaBiomes: Map<string, Biome>

    slices: Grid[]
    layouts: Grid[]
    biomes: Biome[]

    dimension: Grid
    modes: ("A" | "B")[]

    layoutElementUnassigned: GridElementUnassigned

    noiseSettings: {
        "continentalness": NoiseSetting,
        "erosion": NoiseSetting,
        "weirdness": NoiseSetting,
        "humidity": NoiseSetting,
        "temperature": NoiseSetting,
        "shift": NoiseSetting
    } = VanillaNoiseSettings.default()

    vis_y_level: number | "surface" = "surface"

    seed: bigint = BigInt("1")
    dimensionName: string = "minecraft:overworld"
    targetVersion: string = '1_18_2'
    exportDimension: boolean = true;
    noiseSettingsName: string = "minecraft:overworld"
    exportSplines: boolean = true;
    exportNoises: boolean = true;

    useLegacyRandom: boolean = false;

    legacyConfigDatapack: LegacyConfigDatapack
    datapacks: CompositeDatapack

    constructor() {
        this.gridElements = new Map<string, GridElement>();
        this.vanillaBiomes = new Map<string, Biome>();
        this.slices = []
        this.layouts = []
        this.biomes = []

        this.layoutElementUnassigned = GridElementUnassigned.create(this)

        this.dimensionName = ""
        this.seed = BigInt(1)
        this.noiseSettings = {
            continentalness: {firstOctave: 0, amplitudes:[1.0]},
            erosion: {firstOctave: 0, amplitudes:[1.0]},
            weirdness: {firstOctave: 0, amplitudes:[1.0]},
            temperature: {firstOctave: 0, amplitudes:[1.0]},
            humidity: {firstOctave: 0, amplitudes:[1.0]},
            shift: {firstOctave: 0, amplitudes:[1.0]},
        }

        this.legacyConfigDatapack = new LegacyConfigDatapack(this)
        this.datapacks = new CompositeDatapack([new PromiseDatapack(ZipDatapack.fromUrl(`./vanilla_datapacks/vanilla_datapack_1_19.zip`)), this.legacyConfigDatapack])
    }

    loadJSON(json: any) {
        if (json.version !== DATA_VERSION) {
            throw new Error("Datafixer did output json in version " + json.version + ". Newest version is " + DATA_VERSION)
        }

        this.dimensionName = json.dimensionName ?? "minecraft:overworld"
        this.seed = BigInt(json.seed ?? "1")
        this.noiseSettings = json.noiseSettings ?? VanillaNoiseSettings.default()
        this.useLegacyRandom = json.useLegacyRandom ?? false;

        this.continentalnesses = json.continentalnesses
        this.erosions = json.erosions
        this.weirdnesses = json.weirdnesses
        this.temperatures = json.temperatures
        this.humidities = json.humidities
        this.depths = json.depths

        this.gridElements.clear()
        this.vanillaBiomes.clear()
        this.layouts.length = 0
        this.biomes.length = 0
        this.slices.length = 0

        this.targetVersion = json.targetVersion
        this.exportDimension = json.exportDimension
        this.exportNoises = json.exportNoises
        this.exportSplines = json.exportSplines
        this.noiseSettingsName = json.noiseSettingsName

        this.dimension = Grid.fromJSON(this, json.dimension, new DimensionMultiNoiseIndexesAccessor(this))
        this.modes = json.modes

        VanillaBiomes.registerVanillaBiomes(this)
        this.gridElements.set("unassigned", this.layoutElementUnassigned)

        json.slices?.forEach((slice: any) => {
            Grid.fromJSON(this, slice, new SliceMultiNoiseIndexesAccessor())
        });

        json.layouts?.forEach((layout: any) => {
            Grid.fromJSON(this, layout, new LayoutMultiNoiseIndexesAccessor())
        });

        json.biomes?.forEach((biome: any) => {
            Biome.fromJSON(this, biome)
        });

        if (json.splines) {
            this.splines.offset = GridSpline.fromJSON(json.splines.offset)
            this.splines.factor = GridSpline.fromJSON(json.splines.factor)
            this.splines.jaggedness = GridSpline.fromJSON(json.splines.jaggedness)
        } else {
            this.splines.offset = GridSpline.fromMinecraftJSON(VanillaSpline.offset);
            this.splines.factor = GridSpline.fromMinecraftJSON(VanillaSpline.factor);
            this.splines.jaggedness = GridSpline.fromMinecraftJSON(VanillaSpline.jaggedness);
        }
    }

    toJSON() {
        return {
            dimensionName: this.dimensionName,
            seed: this.seed.toString(),
            noiseSettings: this.noiseSettings,
            useLegacyRandom: this.useLegacyRandom,

            continentalnesses: this.continentalnesses,
            erosions: this.erosions,
            weirdnesses: this.weirdnesses,
            temperatures: this.temperatures,
            humidities: this.humidities,
            depths: this.depths,

            dimension: this.dimension,
            modes: this.modes,

            layouts: this.layouts,
            slices: this.slices,
            biomes: this.biomes,

            targetVersion: this.targetVersion,
            exportDimension: this.exportDimension,
            exportNoises: this.exportNoises,
            exportSplines: this.exportSplines,
            noiseSettingsName: this.noiseSettingsName,

            splines: {
                offset: this.splines.offset.toJSON(),
                factor: this.splines.factor.toJSON(),
                jaggedness: this.splines.jaggedness.toJSON()
            },

            version: DATA_VERSION
        }
    }

    public getSlice(name: string) {
        return this.gridElements.get(name) ?? this.layoutElementUnassigned;
    }

    public getLayoutElement(name: string): GridElement {
        var element = this.gridElements.get(name)

        if (element === undefined) {
            const biomeKeys = name.split('/')
            if (biomeKeys.length !== 2) {
                return this.layoutElementUnassigned
            }

            const biomeA: Biome = this.getLayoutElement(biomeKeys[0]) as Biome
            const biomeB: Biome = this.getLayoutElement(biomeKeys[1]) as Biome

            return ABElement.create(this, biomeA.getKey(), biomeB.getKey())
        } else {

            return element
        }
    }

    public registerVanillaBiome(biome: Biome) {
        this.vanillaBiomes.set(biome.getKey(), biome);
    }

    public registerGridElement(element: GridElement) {
        this.gridElements.set(element.getKey(), element)
    }

    public registerSlice(element: Grid) {
        this.gridElements.set(element.getKey(), element)
        this.slices.push(element)
    }


    public registerLayout(element: Grid) {
        this.gridElements.set(element.getKey(), element)
        this.layouts.push(element)
    }

    public registerBiome(element: Biome) {
        this.gridElements.set(element.getKey(), element)
        this.biomes.push(element)
    }

    public removeGridElement(element: GridElement) {
        this.gridElements.delete(element.getKey())

        this.dimension.deleteGridElement(element.getKey())
        this.slices.forEach(s => s.deleteGridElement(element.getKey()))
        this.layouts.forEach(l => l.deleteGridElement(element.getKey()))

        if (element instanceof Grid) {
            const si = this.slices.indexOf(element)
            if (si >= 0)
                this.slices.splice(si, 1)

            const li = this.layouts.indexOf(element)
            if (li >= 0)
                this.layouts.splice(li, 1)
        }
        if (element instanceof Biome) {
            const index = this.biomes.indexOf(element)
            this.biomes.splice(index, 1)
        }
    }

    public findIndex(array: Climate.Param[], number: number): number {
        return number <= array[0].min ? 0 : number > array[array.length - 1].max ? array.length - 1 : array.findIndex(e => e.min <= number && e.max > number)
    }


    public getIndexes(params: Climate.TargetPoint): MultiNoiseIndexes {
        const w_idx = this.findIndex(this.weirdnesses, params.weirdness)
        const c_idx = this.findIndex(this.continentalnesses, params.continentalness)
        const e_idx = this.findIndex(this.erosions, params.erosion)
        const t_idx = this.findIndex(this.temperatures, params.temperature)
        const h_idx = this.findIndex(this.humidities, params.humidity)
        const d_idx = this.findIndex(this.depths, params.depth)
        return { w: w_idx, e: e_idx, c: c_idx, t: t_idx, h: h_idx, d: d_idx }
    }

    public lookupRecursive(indexes: MultiNoiseIndexes): Biome {
        if (indexes === undefined)
            return undefined

        const w = this.weirdnesses[indexes.w]

        if (w === undefined) {
            return undefined
        }

        const element = this.dimension.lookupRecursive(indexes, "Any", false)
        if (element instanceof Biome)
            return element
        else 
            return undefined
    }

    public lookupRecursiveWithTracking(indexes: MultiNoiseIndexes): { slice?: Grid, mode?: Mode, layout?: Grid, biome?: Biome } {
        if (indexes === undefined)
            return undefined

        const w = this.weirdnesses[indexes.w]

        if (w === undefined) {
            return {}
        }

        const lookup = this.dimension.lookupRecursiveWithTracking(indexes, "Any", true)
        return { slice: lookup.slice, layout: lookup.layout, biome: lookup.biome, mode: lookup.mode }

    }

    deleteParam(param: "humidity" | "temperature" | "continentalness" | "erosion" | "weirdness" | "depth", id: number) {
        if (param === "humidity" || param === "temperature") {
            this.layouts.forEach(layout => layout.deleteParam(param, id))
            if (param === "humidity") {
                this.humidities.splice(id, 1)
            } else {
                this.temperatures.splice(id, 1)
            }
        } else if (param === "continentalness" || param === "erosion") {
            this.slices.forEach(slice => slice.deleteParam(param, id))
            if (param === "continentalness") {
                this.continentalnesses.splice(id, 1)
            } else {
                this.erosions.splice(id, 1)
            }
        } else if (param === "weirdness" || param === "depth") {
            this.dimension.deleteParam(param, id)
            if (param === "weirdness") {
                this.weirdnesses.splice(id, 1)
            } else {
                this.depths.splice(id, 1)
            }
        }
    }

    splitParam(param: "humidity" | "temperature" | "continentalness" | "erosion" | "weirdness" | "depth", id: number, position: "mid" | "start" | "end" = "mid") {
        if (param === "humidity" || param === "temperature") {
            this.layouts.forEach(layout => layout.splitParam(param, id))
            if (param === "humidity") {
                const midPoint = (this.humidities[id].min + this.humidities[id].max) / 2

                const newHumid1 = new Climate.Param(this.humidities[id].min, midPoint)
                const newHumid2 = new Climate.Param(midPoint, this.humidities[id].max)

                this.humidities.splice(id, 1, newHumid1, newHumid2)
            } else {
                const midPoint = (this.temperatures[id].min + this.temperatures[id].max) / 2

                const newTemp1 = new Climate.Param(this.temperatures[id].min, midPoint)
                const newTemp2 = new Climate.Param(midPoint, this.temperatures[id].max)

                this.temperatures.splice(id, 1, newTemp1, newTemp2)
            }
        } else if (param === "continentalness" || param === "erosion") {
            this.slices.forEach(slice => slice.splitParam(param, id))
            if (param === "continentalness") {
                const midPoint = (this.continentalnesses[id].min + this.continentalnesses[id].max) / 2

                const newCont1 = new Climate.Param(this.continentalnesses[id].min, midPoint)
                const newCont2 = new Climate.Param(midPoint, this.continentalnesses[id].max)

                this.continentalnesses.splice(id, 1, newCont1, newCont2)
            } else {
                const midPoint = (this.erosions[id].min + this.erosions[id].max) / 2

                const newEro1 = new Climate.Param(this.erosions[id].min, midPoint)
                const newEro2 = new Climate.Param(midPoint, this.erosions[id].max)

                this.erosions.splice(id, 1, newEro1, newEro2)
            }
        } else if (param === "weirdness" || param === "depth") {
            this.dimension.splitParam(param, id)
            if (param === "weirdness") {
                const midPoint = (this.weirdnesses[id].min + this.weirdnesses[id].max) / 2

                const newCont1 = new Climate.Param(this.weirdnesses[id].min, midPoint)
                const newCont2 = new Climate.Param(midPoint, this.weirdnesses[id].max)

                this.weirdnesses.splice(id, 1, newCont1, newCont2)
            } else {
                const midPoint = position === "mid" ? (this.depths[id].min + this.depths[id].max) / 2 : (position === "start" ? this.depths[id].min : this.depths[id].max)

                const newEro1 = new Climate.Param(this.depths[id].min, midPoint)
                const newEro2 = new Climate.Param(midPoint, this.depths[id].max)

                this.depths.splice(id, 1, newEro1, newEro2)
            }
        }
    }

    getNumTemperatures() {
        return this.temperatures.length
    }

    getNumHumidities() {
        return this.humidities.length
    }

    getNumContinentalnesses() {
        return this.continentalnesses.length
    }

    getNumErosions() {
        return this.erosions.length
    }

    getNumWeirdnesses() {
        return this.weirdnesses.length
    }

    getNumDepths() {
        return this.depths.length
    }

    getVersionInfo() {
        return VERSION_INFO[this.targetVersion]
    }

}