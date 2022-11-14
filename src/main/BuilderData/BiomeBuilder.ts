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
import { max, sortedIndex, sortedIndexBy, takeWhile } from "lodash"
import { VERSION_INFO } from "../Vanilla/VersionInfo"
import { CompositeDatapack, Datapack, PromiseDatapack, ZipDatapack } from "mc-datapack-loader"
import { LegacyConfigDatapack } from "./LegacyConfigDatapack"

export type MultiNoiseIndexes = { d: number, w: number, c: number, e: number, h: number, t: number }
export type PartialMultiNoiseIndexes = Partial<MultiNoiseIndexes>

export type NoiseSetting = { firstOctave: number, amplitudes: number[] }
export type NoiseType = "continentalness" | "weirdness" | "erosion" | "temperature" | "humidity" | "shift"


export class BiomeBuilder {
    hasChanges: boolean

    continentalnesses: number[]
    erosions: number[]
    weirdnesses: number[]
    temperatures: number[]
    humidities: number[]
    depths: number[]

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

    dimensionName: string = "minecraft:overworld"
    targetVersion: string = '1_19'
    noiseSettingsName: string = "minecraft:overworld"
    exportSplines: boolean = true;

    legacyConfigDatapack: LegacyConfigDatapack
    vanillaDatapack: Datapack
    datapacks: CompositeDatapack

    constructor() {
        this.gridElements = new Map<string, GridElement>();
        this.vanillaBiomes = new Map<string, Biome>();
        this.slices = []
        this.layouts = []
        this.biomes = []

        this.layoutElementUnassigned = GridElementUnassigned.create(this)

        this.dimensionName = ""

        this.legacyConfigDatapack = new LegacyConfigDatapack(this)
        this.vanillaDatapack = new PromiseDatapack(ZipDatapack.fromUrl(`./vanilla_datapacks/vanilla_datapack_1_19.zip`, `Default`))
        this.datapacks = new CompositeDatapack([this.vanillaDatapack, this.legacyConfigDatapack])
    }

    loadJSON(json: any) {
        if (json.version !== DATA_VERSION) {
            throw new Error("Datafixer did output json in version " + json.version + ". Newest version is " + DATA_VERSION)
        }

        this.dimensionName = json.dimensionName ?? "minecraft:overworld"

        this.continentalnesses = json.continentalnesses
        this.erosions = json.erosions
        this.weirdnesses = json.weirdnesses
        this.temperatures = json.temperatures
        this.humidities = json.humidities
        this.depths = json.depths

        console.log(json.continentalnesses)
        console.log(this.continentalnesses)

        this.gridElements.clear()
        this.vanillaBiomes.clear()
        this.layouts.length = 0
        this.biomes.length = 0
        this.slices.length = 0

        this.targetVersion = json.targetVersion
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

    public findIndex(array: number[], number: number): number {
        return Math.min(Math.max(sortedIndex(array, number) - 1, 0), array.length - 2)
//        return number <= array[0].min ? 0 : number > array[array.length - 1].max ? array.length - 1 : array.findIndex(e => e.min <= number && e.max > number)
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


    public lookupClosest(params: Climate.TargetPoint){
        const ids = this.getIndexes(params)
        var biome = this.lookupRecursive(ids)

        if (biome)
            return biome


    }

    public lookupRecursive(indexes: MultiNoiseIndexes, stopAtHidden: boolean = false): Biome {
        if (indexes === undefined)
            return undefined

        const w = this.weirdnesses[indexes.w]

        if (w === undefined) {
            return undefined
        }

        const element = this.dimension.lookupRecursive(indexes, "Any", stopAtHidden)
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
                const midPoint = (this.humidities[id] + this.humidities[id + 1]) / 2
                this.humidities.splice(id + 1, 0, midPoint)
            } else {
                const midPoint = (this.temperatures[id] + this.temperatures[id + 1]) / 2
                this.temperatures.splice(id + 1, 0, midPoint)
            }
        } else if (param === "continentalness" || param === "erosion") {
            this.slices.forEach(slice => slice.splitParam(param, id))
            if (param === "continentalness") {
                const midPoint = (this.continentalnesses[id] + this.continentalnesses[id + 1]) / 2
                this.continentalnesses.splice(id + 1, 0, midPoint)
            } else {
                const midPoint = (this.erosions[id] + this.erosions[id + 1]) / 2
                this.erosions.splice(id + 1, 0, midPoint)
            }
        } else if (param === "weirdness" || param === "depth") {
            this.dimension.splitParam(param, id)
            if (param === "weirdness") {
                const midPoint = (this.weirdnesses[id] + this.weirdnesses[id + 1]) / 2
                this.weirdnesses.splice(id + 1, 0, midPoint)
            } else {
                const midPoint = position == "start" ? this.depths[id] : position == "end" ? this.depths[id+1] : (this.depths[id] + this.depths[id + 1]) / 2
                this.depths.splice(id + 1, 0, midPoint)
            }
        }
    }

    getNumTemperatures() {
        return this.temperatures.length - 1
    }

    getNumHumidities() {
        return this.humidities.length - 1 
    }

    getNumContinentalnesses() {
        return this.continentalnesses.length - 1
    }

    getNumErosions() {
        return this.erosions.length - 1
    }

    getNumWeirdnesses() {
        return this.weirdnesses.length - 1
    }

    getNumDepths() {
        return this.depths.length - 1
    }

    getVersionInfo() {
        return VERSION_INFO[this.targetVersion]
    }

}