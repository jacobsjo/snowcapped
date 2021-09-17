import { Climate } from "deepslate"
import { UnassignedRenderer } from "../UI/Renderer/ElementRenderer"
import { VanillaBiomes } from "../Vanilla/VanillaBiomes"
import { ABElement } from "./ABBiome"
import { Biome } from "./Biome"
import { Layout } from "./Layout"
import { LayoutElement } from "./LayoutElement"
import { LayoutElementDummy } from "./LayoutElementDummy"
import { LayoutElementUnassigned } from "./LayoutElementUnassigned"

import { Slice } from "./Slice"

export class BiomeBuilder{
    continentalnesses: [string, Climate.Param][]
    erosions: [string,Climate.Param][]
    weirdnesses: [string,Climate.Param, string, "A"|"B"][]
    temperatures: [string,Climate.Param][]
    humidities: [string,Climate.Param][]

    renderedElements: Map<string, LayoutElement | Slice>
    slices: Map<string, Slice>
    layoutElements: Map<string, LayoutElement>
    layouts: Map<string, Layout>
    biomes: Map<string, Biome>

    layoutElementDummy: LayoutElementDummy

    constructor(continentalnesses: [string, Climate.Param][], erosions: [string,Climate.Param][], weirdnesses: [string,Climate.Param][], temperatures: [string,Climate.Param][], humidities: [string,Climate.Param][]){
        this.continentalnesses = continentalnesses
        this.erosions = erosions
        this.weirdnesses = weirdnesses.map(w => [w[0], w[1], "unassigned", "A"])
        this.temperatures = temperatures
        this.humidities = humidities


        this.slices = new Map<string, Slice>();
        this.renderedElements = new Map<string, LayoutElement | Slice>();
        this.layoutElements = new Map<string, LayoutElement>();
        this.layouts = new Map<string, Layout>();
        this.biomes = new Map<string, Biome>();

        this.layoutElementDummy = LayoutElementDummy.create(this)
    }

    loadJSON(json: any){

        this.continentalnesses = json.continentalnesses
        this.erosions = json.erosions
        this.weirdnesses = json.weirdnesses
        this.temperatures = json.temperatures
        this.humidities = json.humidities

        this.layoutElements.clear()
        this.layouts.clear()
        this.biomes.clear()
        this.slices.clear()

        VanillaBiomes.registerVanillaBiomes(this)
        LayoutElementUnassigned.create(this)

        json.slices?.forEach((slice : any) => {
            Slice.fromJSON(this, slice)
        });

        json.layouts?.forEach((layout : any) => {
            Layout.fromJSON(this, layout)
        });
    }

    toJSON(){
        return {
            continentalnesses: this.continentalnesses,
            erosions: this.erosions,
            weirdnesses: this.weirdnesses,
            temperatures: this.temperatures,
            humidities: this.humidities,
            layouts: Array.from(this.layouts.values()),
            slices: Array.from(this.slices.values())
        }
    }
    
    public getSlice(name: string){
        return this.slices.get(name);
    }

    public getRenderedElement(name: string): LayoutElement | Slice {
        return this.renderedElements.get(name)
    }

    public getLayoutElement(name: string): LayoutElement{
        const element = this.layoutElements.get(name)
        if (element === undefined){
            const biomeKeys = name.split('/')
            if (biomeKeys.length !== 2){
                throw EvalError("No element found for key " + name)
                return undefined
            }
            
            const biomeA : Biome = this.getLayoutElement(biomeKeys[0]) as Biome
            const biomeB : Biome  = this.getLayoutElement(biomeKeys[1]) as Biome

            return ABElement.create(this, biomeA, biomeB)
        } else {

            return element
        }
    }

    public registerSlice(slice: Slice){
        this.slices.set(slice.getKey(), slice);
        this.renderedElements.set(slice.getKey(), slice)
    }

    public registerLayoutElement(element: LayoutElement){
        this.layoutElements.set(element.getKey(), element);
        this.renderedElements.set(element.getKey(), element)
        if (element instanceof Layout){
            this.layouts.set(element.getKey(), element)
        }
        if (element instanceof Biome){
            this.biomes.set(element.getKey(), element)
        }
    }

    getNumTemperatures(){
        return this.temperatures.length
    }

    getNumHumidities(){
        return this.temperatures.length
    }

    getNumContinentalnesses(){
        return this.continentalnesses.length
    }

    getNumErosions(){
        return this.erosions.length
    }

}