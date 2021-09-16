import { Climate } from "deepslate"
import { ABElement } from "./ABBiome"
import { Biome } from "./Biome"
import { Layout } from "./Layout"
import { LayoutElement } from "./LayoutElement"

import { Slice } from "./Slice"

export class BiomeBuilder{
    continentalnesses: [string, Climate.Param][]
    erosions: [string,Climate.Param][]
    weirdnesses: [string,Climate.Param][]
    temperatures: [string,Climate.Param][]
    humidities: [string,Climate.Param][]

    slices: Map<string, Slice>
    layoutElements: Map<string, LayoutElement>
    layouts: Map<string, Layout>

    constructor(continentalnesses: [string, Climate.Param][], erosions: [string,Climate.Param][], weirdnesses: [string,Climate.Param][], temperatures: [string,Climate.Param][], humidities: [string,Climate.Param][]){
        this.continentalnesses = continentalnesses
        this.erosions = erosions
        this.weirdnesses = weirdnesses
        this.temperatures = temperatures
        this.humidities = humidities


        this.slices = new Map<string, Slice>();
        this.layoutElements = new Map<string, LayoutElement>();
        this.layouts = new Map<string, Layout>();
    }
    
    public getSlice(name: string){
        return this.slices.get(name);
    }

    public getLayoutElement(name: string): LayoutElement{
        const element = this.layoutElements.get(name)
        if (element === undefined){
            const biomeKeys = name.split('/')
            if (biomeKeys.length !== 2)
                return undefined
            
            const biomeA : Biome = this.getLayoutElement(biomeKeys[0]) as Biome
            const biomeB : Biome  = this.getLayoutElement(biomeKeys[1]) as Biome

            return ABElement.create(this, biomeA, biomeB)
        } else {
            return element
        }
    }

    public registerSlice(slice: Slice){
        this.slices.set(slice.name, slice);
    }

    public registerLayoutElement(element: LayoutElement){
        this.layoutElements.set(element.name, element);
        if (element instanceof Layout){
            this.layouts.set(element.name, element)
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