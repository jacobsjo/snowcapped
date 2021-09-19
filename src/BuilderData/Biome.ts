import * as uniqid from 'uniqid'
import { BiomeRenderer, ElementRenderer } from '../UI/Renderer/ElementRenderer'
import { BiomeBuilder } from './BiomeBuilder'
import {LayoutElement, Mode} from './LayoutElement'

export class Biome implements LayoutElement{
    readonly name: string
    readonly allowDeletion: boolean = true

    private biome_color: string
    private renderer: BiomeRenderer

    private key: string

    private constructor(name: string, color: string, key?: string, isVanilla: boolean = false){
        this.name = name
        this.biome_color = color
        this.key = key ?? isVanilla ? name : uniqid('biome_')
        this.allowDeletion = !isVanilla
    }

    static create(builder: BiomeBuilder, name: string, color: string, key?: string, isVanilla: boolean = false): Biome{
        const layout = new Biome(name, color, key, isVanilla)
        builder.registerLayoutElement(layout);
        return layout
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

    color(){
        return this.biome_color;
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

