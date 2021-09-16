import { BiomeRenderer, ElementRenderer } from '../UI/Renderer/ElementRenderer'
import { BiomeBuilder } from './BiomeBuilder'
import {LayoutElement, Mode} from './LayoutElement'

export class Biome implements LayoutElement{
    readonly name: string

    private biome_color: string
    private renderer: BiomeRenderer

    private constructor(name: string, color: string){
        this.name = name
        this.biome_color = color
    }

    static create(builder: BiomeBuilder, name: string, color: string): Biome{
        const layout = new Biome(name, color)
        builder.registerLayoutElement(layout);
        return layout
    }

    getKey(temperatureIndex: number, humidityIndex: number): string{
        return this.name
    }

    get(temperatureIndex: number, humidityIndex: number): Biome {
        return this
    }

    getRecursive(temperatureIndex: number, humidityIndex: number, mode: Mode): Biome {
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
}

