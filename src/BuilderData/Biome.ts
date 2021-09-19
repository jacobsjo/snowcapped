import * as uniqid from 'uniqid'
import { BiomeRenderer, ElementRenderer } from '../UI/Renderer/ElementRenderer'
import { BiomeBuilder } from './BiomeBuilder'
import {LayoutElement, Mode} from './LayoutElement'

export class Biome implements LayoutElement{
    name: string
    readonly allowEdit: boolean = true

    public color: string
    private renderer: BiomeRenderer
    private isVanilla: boolean

    private key: string

    private constructor(name: string, color: string, key?: string, isVanilla: boolean = false){
        this.name = name
        this.color = color
        if (key !== undefined)
            this.key = key
        else if (isVanilla)
            this.key = name
        else
            this.key = uniqid('biome_')
        this.allowEdit = !isVanilla
        this.isVanilla = isVanilla
    }

    static create(builder: BiomeBuilder, name: string, color: string, key?: string, isVanilla: boolean = false): Biome{
        const biome = new Biome(name, color, key, isVanilla)
        if (isVanilla)
            builder.registerVanillaBiome(biome)
        else
            builder.registerLayoutElement(biome);
        return biome
    }

    static fromJSON(builder: BiomeBuilder, json: any){
        if (builder.vanillaBiomes.has(json.key)){
            builder.registerLayoutElement(builder.vanillaBiomes.get(json.key))
        } else {
            const biome = new Biome(json.name, json.color, json.key, false)
            builder.registerLayoutElement(biome);
            return biome
        }
    }

    toJSON(){
        return {
            key: this.key,
            name: this.name,
            color: this.isVanilla ? undefined : this.color
        }
    }    

    lookupKey(temperatureIndex: number, humidityIndex: number): string{
        return this.getKey()
    }

    lookup(temperatureIndex: number, humidityIndex: number): Biome {
        return this
    }

    lookupRecursive(temperatureIndex: number, humidityIndex: number, mode: Mode): Biome {
        return this
    }

    getRenderer(): ElementRenderer {
        if (this.renderer === undefined)
            this.renderer = new BiomeRenderer(this)

        return this.renderer
    }

    getKey(){
        return this.key
    }


}

