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
    layoutElements: Map<string, LayoutElement>
    vanillaBiomes: Map<string, Biome>

    slices: Slice[]
    layouts: Layout[]
    biomes: Biome[]


    layoutElementDummy: LayoutElementDummy
    layoutElementUnassigned: LayoutElementUnassigned

    constructor(continentalnesses: [string, Climate.Param][], erosions: [string,Climate.Param][], weirdnesses: [string,Climate.Param][], temperatures: [string,Climate.Param][], humidities: [string,Climate.Param][]){
        this.continentalnesses = continentalnesses
        this.erosions = erosions
        this.weirdnesses = weirdnesses.map(w => [w[0], w[1], "unassigned", "A"])
        this.temperatures = temperatures
        this.humidities = humidities

        this.renderedElements = new Map<string, LayoutElement | Slice>();
        this.layoutElements = new Map<string, LayoutElement>();
        this.vanillaBiomes = new Map<string, Biome>();
        this.slices = []
        this.layouts = []
        this.biomes = []

        
        this.layoutElementDummy = LayoutElementDummy.create(this)
        this.layoutElementUnassigned = LayoutElementUnassigned.create(this)
    }

    loadJSON(json: any){

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
        LayoutElementUnassigned.create(this)

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