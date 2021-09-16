import { ElementRenderer } from "../UI/Renderer/ElementRenderer";
import { LayoutGridRenderer } from "../UI/Renderer/LayoutGridRenderer";
import { ABElement } from "./ABBiome";
import { Biome } from "./Biome";
import { BiomeBuilder } from "./BiomeBuilder";
import { LayoutElement, Mode} from "./LayoutElement";

export class Layout implements LayoutElement {
    readonly name: string;

    private array: string[][]
    private builder: BiomeBuilder
    private renderer: LayoutGridRenderer
    
    private constructor(builder: BiomeBuilder, name: string, array: string[][]){
        this.name = name;
        this.builder = builder
        if (array === undefined){
            this.array = new Array(builder.getNumTemperatures()).fill(0).map(() => new Array(builder.getNumHumidities()).fill(undefined))
        } else { 
            this.array = array
        }
    }

    static create(builder: BiomeBuilder, name: string, array: string[][] = undefined): Layout{
        const layout = new Layout(builder, name, array)
        builder.registerLayoutElement(layout);
        return layout
    }

    set(temperatureIndex: number, humidityIndex: number, element: string){
        this.array[temperatureIndex][humidityIndex] = element
    }

    getKey(temperatureIndex: number, humidityIndex: number): string {
        return this.array[temperatureIndex][humidityIndex]
    }

    get(temperatureIndex: number, humidityIndex: number): LayoutElement{
        const key = this.getKey(temperatureIndex, humidityIndex);
        const element = this.builder.getLayoutElement(key)
        if (element === undefined)
            throw EvalError("No element found for key " + key)

        return element
    }

    getRecursive(temperatureIndex: number, humidityIndex: number, mode: Mode): ABElement | Biome{
        const element = this.get(temperatureIndex, humidityIndex)
        return element.getRecursive(temperatureIndex, humidityIndex, mode);
    }

    getSize(): [number, number]{
        return [this.builder.getNumTemperatures(), this.builder.getNumHumidities()]
    }

    getRenderer(): ElementRenderer {
        if (this.renderer === undefined)
            this.renderer = new LayoutGridRenderer(this)

        return this.renderer
    }
}