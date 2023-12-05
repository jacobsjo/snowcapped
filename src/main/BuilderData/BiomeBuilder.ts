import { Climate } from "deepslate"
import { VanillaBiomes } from "../Vanilla/VanillaBiomes"
import { VanillaSpline } from "../Vanilla/VanillaSplines"
import { ABElement } from "./ABBiome"
import { Biome } from "./Biome"
import { GridSpline } from "./GridSpline"
import { GridElement, Mode } from "./GridElement"
import { GridElementUnassigned } from "./GridElementUnassigned"
import { DimensionMultiNoiseIndexesAccessor, Grid, LayoutMultiNoiseIndexesAccessor, SliceMultiNoiseIndexesAccessor } from "./Grid"
import { DATA_VERSION, DEFAULT_DATAPACK_FORMAT, MAX_DATAPACK_FORMAT, MIN_DATAPACK_FORMAT } from "../../SharedConstants"
import { VERSION_INFO } from "../Vanilla/VersionInfo"
import { sortedIndex } from "lodash"

export type MultiNoiseIndexes = { depth: number, weirdness: number, continentalness: number, erosion: number, humidity: number, temperature: number }
export type PartialMultiNoiseIndexes = Partial<MultiNoiseIndexes>

export type NoiseSetting = { firstOctave: number, amplitudes: number[] }
export type NoiseType = "continentalness" | "weirdness" | "erosion" | "temperature" | "humidity" | "shift"


export class BiomeBuilder {
    hasChanges: boolean

    gridCells: {
        continentalness: number[]
        erosion: number[]
        weirdness: number[]
        temperature: number[]
        humidity: number[]
        depth: number[]
    }

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
    datapackFormat: number = 15
    noiseSettingsName: string = "minecraft:overworld"
    exportSplines: boolean = true;
    exportBiomeColors: boolean = true;


    constructor() {
        this.gridElements = new Map<string, GridElement>();
        this.vanillaBiomes = new Map<string, Biome>();
        this.slices = []
        this.layouts = []
        this.biomes = []

        this.layoutElementUnassigned = GridElementUnassigned.create(this)

        this.dimensionName = ""

        this.datapackFormat = DEFAULT_DATAPACK_FORMAT

    }

    loadJSON(json: any) {
        if (json.version !== DATA_VERSION) {
            throw new Error("Datafixer did output json in version " + json.version + ". Newest version is " + DATA_VERSION)
        }

        this.dimensionName = json.dimensionName ?? "minecraft:overworld"

        this.gridCells = {
            continentalness: json.continentalnesses,
            erosion: json.erosions,
            weirdness: json.weirdnesses,
            temperature: json.temperatures,
            humidity: json.humidities,
            depth: json.depths
        }

        this.gridElements.clear()
        this.vanillaBiomes.clear()
        this.layouts.length = 0
        this.biomes.length = 0
        this.slices.length = 0

        this.targetVersion = json.targetVersion
        this.exportSplines = json.exportSplines
        this.exportBiomeColors = json.exportBiomeColors ?? false
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

        this.datapackFormat = json.datapackVersion
    }

    toJSON() {
        return {
            dimensionName: this.dimensionName,

            continentalnesses: this.gridCells.continentalness,
            erosions: this.gridCells.erosion,
            weirdnesses: this.gridCells.weirdness,
            temperatures: this.gridCells.temperature,
            humidities: this.gridCells.humidity,
            depths: this.gridCells.depth,

            dimension: this.dimension,
            modes: this.modes,

            layouts: this.layouts,
            slices: this.slices,
            biomes: this.biomes,

            targetVersion: this.targetVersion,
            exportSplines: this.exportSplines,
            exportBiomeColors: this.exportBiomeColors,
            noiseSettingsName: this.noiseSettingsName,

            splines: {
                offset: this.splines.offset.toJSON(),
                factor: this.splines.factor.toJSON(),
                jaggedness: this.splines.jaggedness.toJSON()
            },

            datapackVersion: this.datapackFormat,

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
        for (var i = 1; i < array.length - 1; i++) {
            if (number <= array[i]) {
                return i - 1
            }
        }
        return array.length - 2
    }


    public getIndexes(params: Climate.TargetPoint): MultiNoiseIndexes {
        const w_idx = this.findIndex(this.gridCells.weirdness, params.weirdness)
        const c_idx = this.findIndex(this.gridCells.continentalness, params.continentalness)
        const e_idx = this.findIndex(this.gridCells.erosion, params.erosion)
        const t_idx = this.findIndex(this.gridCells.temperature, params.temperature)
        const h_idx = this.findIndex(this.gridCells.humidity, params.humidity)
        const d_idx = this.findIndex(this.gridCells.depth, params.depth)
        return { weirdness: w_idx, erosion: e_idx, continentalness: c_idx, temperature: t_idx, humidity: h_idx, depth: d_idx }
    }

    /*
    private getDistance(start_params: Climate.TargetPoint, start_ids: MultiNoiseIndexes, end_ids: MultiNoiseIndexes): number{
        var distance = 0
        for (const axis of (Object.keys(start_ids) as (keyof MultiNoiseIndexes)[])){
            if (start_ids[axis] < end_ids[axis]){
                distance += (this.gridCells[axis][end_ids[axis] + 1] - start_params[axis])**2
            } else if (start_ids[axis] > end_ids[axis]){
                distance += (this.gridCells[axis][end_ids[axis]] - start_params[axis])**2
            }
        }
        return distance
    }

    public lookupClosest(params: Climate.TargetPoint){
        const start_ids = this.getIndexes(params)
        const check_list: {distance: number, ids: MultiNoiseIndexes}[] = [{distance: 0, ids: start_ids}]
        
        while (check_list.length > 0) {
            const {ids: ids} = check_list.pop()
            var biome = this.lookupRecursive(ids)
            if (biome){
                return biome
            }

            for (const axis of (Object.keys(ids) as (keyof MultiNoiseIndexes)[])){
                if (ids[axis] <= start_ids[axis] && ids[axis] > 0){
                    const new_ids = {...ids, [axis]: ids[axis] - 1}
                    const new_entry = {ids: new_ids, distance: this.getDistance(params, start_ids, new_ids)}
                    check_list.splice(sortedIndexBy(check_list, new_entry, "distance"), 0, new_entry)
                } 
                
                if (ids[axis] >= start_ids[axis] && ids[axis] < this.gridCells[axis].length - 1){
                    const new_ids = {...ids, [axis]: ids[axis] + 1}
                    const new_entry = {ids: new_ids, distance: this.getDistance(params, start_ids, new_ids)}
                    check_list.splice(sortedIndexBy(check_list, new_entry, "distance"), 0, new_entry)
                }
            }

        }

        return undefined
    }*/

    public lookupRecursive(indexes: MultiNoiseIndexes, stopAtHidden: boolean = false): Biome {
        if (indexes === undefined)
            return undefined

        const element = this.dimension.lookupRecursive(indexes, "Any", stopAtHidden)
        if (element instanceof Biome)
            return element
        else
            return undefined
    }

    public lookupRecursiveWithTracking(indexes: MultiNoiseIndexes): { slice?: Grid, mode?: Mode, layout?: Grid, biome?: Biome } {
        if (indexes === undefined)
            return undefined

        const lookup = this.dimension.lookupRecursiveWithTracking(indexes, "Any", true)
        return { slice: lookup.slice, layout: lookup.layout, biome: lookup.biome, mode: lookup.mode }

    }

    deleteParam(param: "humidity" | "temperature" | "continentalness" | "erosion" | "weirdness" | "depth", id: number) {
        if (param === "humidity" || param === "temperature") {
            this.layouts.forEach(layout => layout.deleteParam(param, id))
            if (param === "humidity") {
                this.gridCells.humidity.splice(id, 1)
            } else {
                this.gridCells.temperature.splice(id, 1)
            }
        } else if (param === "continentalness" || param === "erosion") {
            this.slices.forEach(slice => slice.deleteParam(param, id))
            if (param === "continentalness") {
                this.gridCells.continentalness.splice(id, 1)
            } else {
                this.gridCells.erosion.splice(id, 1)
            }
        } else if (param === "weirdness" || param === "depth") {
            this.dimension.deleteParam(param, id)
            if (param === "weirdness") {
                this.gridCells.weirdness.splice(id, 1)
            } else {
                this.gridCells.depth.splice(id, 1)
            }
        }
    }

    splitParam(param: "humidity" | "temperature" | "continentalness" | "erosion" | "weirdness" | "depth", id: number, position: "mid" | "start" | "end" = "mid") {
        if (param === "humidity" || param === "temperature") {
            this.layouts.forEach(layout => layout.splitParam(param, id))
            if (param === "humidity") {
                const midPoint = (this.gridCells.humidity[id] + this.gridCells.humidity[id + 1]) / 2
                this.gridCells.humidity.splice(id + 1, 0, midPoint)
            } else {
                const midPoint = (this.gridCells.temperature[id] + this.gridCells.temperature[id + 1]) / 2
                this.gridCells.temperature.splice(id + 1, 0, midPoint)
            }
        } else if (param === "continentalness" || param === "erosion") {
            this.slices.forEach(slice => slice.splitParam(param, id))
            if (param === "continentalness") {
                const midPoint = (this.gridCells.continentalness[id] + this.gridCells.continentalness[id + 1]) / 2
                this.gridCells.continentalness.splice(id + 1, 0, midPoint)
            } else {
                const midPoint = (this.gridCells.erosion[id] + this.gridCells.erosion[id + 1]) / 2
                this.gridCells.erosion.splice(id + 1, 0, midPoint)
            }
        } else if (param === "weirdness" || param === "depth") {
            this.dimension.splitParam(param, id)
            if (param === "weirdness") {
                const midPoint = (this.gridCells.weirdness[id] + this.gridCells.weirdness[id + 1]) / 2
                this.gridCells.weirdness.splice(id + 1, 0, midPoint)
            } else {
                const midPoint = position == "start" ? this.gridCells.depth[id] : position == "end" ? this.gridCells.depth[id + 1] : (this.gridCells.depth[id] + this.gridCells.depth[id + 1]) / 2
                this.gridCells.depth.splice(id + 1, 0, midPoint)
            }
        }
    }

    getNumTemperatures() {
        return this.gridCells.temperature.length - 1
    }

    getNumHumidities() {
        return this.gridCells.humidity.length - 1
    }

    getNumContinentalnesses() {
        return this.gridCells.continentalness.length - 1
    }

    getNumErosions() {
        return this.gridCells.erosion.length - 1
    }

    getNumWeirdnesses() {
        return this.gridCells.weirdness.length - 1
    }

    getNumDepths() {
        return this.gridCells.depth.length - 1
    }

    getVersionInfo() {
        return VERSION_INFO[this.targetVersion]
    }

}