import { Climate } from "deepslate"
import { UnassignedRenderer } from "../UI/Renderer/ElementRenderer"
import { VanillaBiomes } from "../Vanilla/VanillaBiomes"
import { VanillaNoiseSettings } from "../Vanilla/VanillaNoiseSettings"
import { ABElement } from "./ABBiome"
import { Biome } from "./Biome"
import { Layout } from "./Layout"
import { LayoutElement } from "./LayoutElement"
import { LayoutElementDummy } from "./LayoutElementDummy"
import { LayoutElementUnassigned } from "./LayoutElementUnassigned"

import { Slice } from "./Slice"

export type MultiNoiseParameters = {weirdness: number, continentalness:number, erosion: number, humidity: number, temperature: number, depth: number}
export type MultiNoiseIndexes = {w_idx: number, c_idx:number, e_idx: number, h_idx: number, t_idx: number}

export type NoiseSetting = {firstOctave: number, amplitudes: number[]}

export class BiomeBuilder{
    hasChanges: boolean

    continentalnesses: [string, Climate.Param][]
    erosions: [string,Climate.Param][]
    weirdnesses: [string,Climate.Param, string, "A"|"B"][]
    temperatures: [string,Climate.Param][]
    humidities: [string,Climate.Param][]

    renderedElements: Map<string, LayoutElement | Slice>
    layoutElements: Map<string, LayoutElement>
    vanillaBiomes: Map<string, Biome>

    slices: Slice[]
    layouts: Layout[]
    biomes: Biome[]


    layoutElementDummy: LayoutElementDummy
    layoutElementUnassigned: LayoutElementUnassigned

    noiseSettings: {
        "continentalness": NoiseSetting,
        "erosion": NoiseSetting,
        "weirdness": NoiseSetting,
        "humidity": NoiseSetting,
        "temperature": NoiseSetting,
        "shift": NoiseSetting
    } = VanillaNoiseSettings.default()

    seed: bigint = BigInt("1")
    dimensionName: string = "minecraft:overworld"

    constructor(json: any){
        this.renderedElements = new Map<string, LayoutElement | Slice>();
        this.layoutElements = new Map<string, LayoutElement>();
        this.vanillaBiomes = new Map<string, Biome>();
        this.slices = []
        this.layouts = []
        this.biomes = []
        
        this.layoutElementDummy = LayoutElementDummy.create(this)
        this.layoutElementUnassigned = LayoutElementUnassigned.create(this)

        this.loadJSON(json)
    }

    loadJSON(json: any){
        this.dimensionName = json.dimensionName??"minecraft:overworld"
        this.seed = BigInt(json.seed ?? "1")
        this.noiseSettings = json.noiseSettings ?? VanillaNoiseSettings.default()

        this.continentalnesses = json.continentalnesses
        this.erosions = json.erosions
        this.weirdnesses = json.weirdnesses
        this.temperatures = json.temperatures
        this.humidities = json.humidities

        this.layoutElements.clear()
        this.layouts = []
        this.biomes = []
        this.slices = []

        VanillaBiomes.registerVanillaBiomes(this)
        this.registerLayoutElement(this.layoutElementDummy)
        this.registerLayoutElement(this.layoutElementUnassigned)

        json.slices?.forEach((slice : any) => {
            Slice.fromJSON(this, slice)
        });

        json.layouts?.forEach((layout : any) => {
            Layout.fromJSON(this, layout)
        });

        json.biomes?.forEach((biome : any) => {
            Biome.fromJSON(this, biome)
        });
    }

    toJSON(){
        return {
            dimensionName: this.dimensionName,
            seed: this.seed.toString(),
            noiseSettings: this.noiseSettings,

            continentalnesses: this.continentalnesses,
            erosions: this.erosions,
            weirdnesses: this.weirdnesses.map(weirdness => {
                weirdness[2] = this.getSlice(weirdness[2]).getKey()
                return weirdness
            }),
            temperatures: this.temperatures,
            humidities: this.humidities,
            layouts: this.layouts,
            slices: this.slices,
            biomes: this.biomes
        }
    }
    
    public getSlice(name: string){
        return this.renderedElements.get(name) ?? this.layoutElementUnassigned;
    }

    public getRenderedElement(name: string): LayoutElement | Slice {
        return this.renderedElements.get(name) ?? this.layoutElementUnassigned
    }

    public getLayoutElement(name: string): LayoutElement{
        var element = this.layoutElements.get(name)
        /*
        if (element === undefined && this.vanillaBiomes.has(name)){
            element = this.vanillaBiomes.get(name)
            this.registerLayoutElement(element)
        }*/

        
        if (element === undefined){
            const biomeKeys = name.split('/')
            if (biomeKeys.length !== 2){
                return this.layoutElementUnassigned
            }
            
            const biomeA : Biome = this.getLayoutElement(biomeKeys[0]) as Biome
            const biomeB : Biome  = this.getLayoutElement(biomeKeys[1]) as Biome

            return ABElement.create(this, biomeA.getKey(), biomeB.getKey())
        } else {

            return element
        }
    }

    public registerSlice(slice: Slice){
        this.slices.push(slice);
        this.renderedElements.set(slice.getKey(), slice)
    }

    public removeSlice(slice: Slice){
        const index = this.slices.indexOf(slice)
        if (index > -1){
            this.slices.splice(index, 1)
        }
        this.renderedElements.delete(slice.getKey())
    }

    public registerVanillaBiome(biome: Biome){
        this.vanillaBiomes.set(biome.getKey(), biome);
        this.renderedElements.set(biome.getKey(), biome)
    }

    public registerLayoutElement(element: LayoutElement){
        this.layoutElements.set(element.getKey(), element);
        this.renderedElements.set(element.getKey(), element)
        if (element instanceof Layout){
            this.layouts.push(element)
        }
        if (element instanceof Biome){
            this.biomes.push(element)
        }
    }

    public removeLayoutElement(element: LayoutElement){
        this.layoutElements.delete(element.getKey())
        this.renderedElements.delete(element.getKey())

        if (element instanceof Layout){
            const index = this.layouts.indexOf(element)
            this.layouts.splice(index, 1)
        }
        if (element instanceof Biome){
            const index = this.biomes.indexOf(element)
            this.biomes.splice(index, 1)
        }
    }

    private findIndex(array: Climate.Param[], number: number): number{
        return number < array[0].min ? 0 : number > array[array.length-1].max ? array.length - 1 : array.findIndex(e => e.min < number && e.max > number)
    }

    public getIndexes(params: MultiNoiseParameters): MultiNoiseIndexes{
        const w_idx = this.findIndex(this.weirdnesses.map(e => e[1]), params.weirdness)
        const c_idx = this.findIndex(this.continentalnesses.map(e => e[1]), params.continentalness)
        const e_idx = this.findIndex(this.erosions.map(e => e[1]), params.erosion)
        const t_idx = this.findIndex(this.temperatures.map(e => e[1]), params.temperature)
        const h_idx = this.findIndex(this.humidities.map(e => e[1]), params.humidity)
        return {w_idx: w_idx, e_idx: e_idx, c_idx: c_idx, t_idx: t_idx, h_idx: h_idx}
    }

    public lookup(indexes: MultiNoiseIndexes): {slice?: Slice, mode?: "A"|"B", layout?: Layout, biome?: Biome}{
        if (indexes === undefined)
            return undefined
            
        const w = this.weirdnesses[indexes.w_idx]

        if (w === undefined){
            return {}
        }

        const slice = this.getSlice(w[2]) as Slice

        if (slice.hidden){
            return {}
        }

        const layout = slice.lookup(indexes.c_idx, indexes.e_idx) as LayoutElement

        if (layout.hidden){
            return {slice: slice, mode: w[3]}
        }

        if (layout instanceof LayoutElementUnassigned){
            return {slice: slice, mode: w[3]}
        } else if (layout instanceof Biome){
            return {slice: slice, mode: w[3], biome: layout}
        } else if (layout instanceof Layout){
            const biome = layout.lookupRecursive(indexes.t_idx, indexes.h_idx, w[3], true)

            if (biome.hidden){
                return {slice: slice, mode: w[3], layout: layout}
            }

            if (biome instanceof Biome)
                return {slice: slice, mode: w[3], layout: layout, biome: biome}
            else
                return {slice: slice, mode: w[3], layout: layout}
        }
    }

    deleteParam(param: "humidity"|"temperature"|"continentalness"|"erosion"|"weirdness", id: number){
        if (param === "humidity" || param === "temperature"){
            this.layouts.forEach(layout => layout.deleteParam(param, id))
            if (param === "humidity"){
                this.humidities.splice(id, 1)
            } else {
                this.temperatures.splice(id, 1)
            }
        } else { 

        }
    }

    splitParam(param: "humidity"|"temperature"|"continentalness"|"erosion"|"weirdness", id: number){
        if (param === "humidity" || param === "temperature"){
            this.layouts.forEach(layout => layout.splitParam(param, id))
            if (param === "humidity"){
                const midPoint = (this.humidities[id][1].min + this.humidities[id][1].max)/2

                const newHumid1 = new Climate.Param(this.humidities[id][1].min, midPoint)
                const newHumid2 = new Climate.Param(midPoint, this.humidities[id][1].max)

                this.humidities.splice(id, 1, ["d", newHumid1], ["d", newHumid2])
            } else {
                const midPoint = (this.temperatures[id][1].min + this.temperatures[id][1].max)/2

                const newTemp1 = new Climate.Param(this.temperatures[id][1].min, midPoint)
                const newTemp2 = new Climate.Param(midPoint, this.temperatures[id][1].max)

                this.temperatures.splice(id, 1, ["d", newTemp1], ["d", newTemp2])
            }
        } else { 

        }
    }

    getNumTemperatures(){
        return this.temperatures.length
    }

    getNumHumidities(){
        return this.humidities.length
    }

    getNumContinentalnesses(){
        return this.continentalnesses.length
    }

    getNumErosions(){
        return this.erosions.length
    }

}