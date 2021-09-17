import { uniqueId } from "lodash";
import { ElementRenderer } from "../UI/Renderer/ElementRenderer";
import { LayoutGridRenderer } from "../UI/Renderer/LayoutGridRenderer";
import { ABElement } from "./ABBiome";
import { Biome } from "./Biome";
import { BiomeBuilder } from "./BiomeBuilder";
import { LayoutElement, Mode} from "./LayoutElement";

export class Layout implements LayoutElement {
    name: string;

    private array: string[][]
    private builder: BiomeBuilder
    private renderer: LayoutGridRenderer

    private key: string
    
    private constructor(builder: BiomeBuilder, name: string, array: string[][]){
        this.name = name;
        this.builder = builder
        if (array === undefined){
            this.array = new Array(builder.getNumTemperatures()).fill(0).map(() => new Array(builder.getNumHumidities()).fill("minecraft:plains"))
        } else { 
            this.array = array
        }

        this.key = uniqueId("layout_")
    }

    static create(builder: BiomeBuilder, name: string, array: string[][] = undefined): Layout{
        const layout = new Layout(builder, name, array)
        builder.registerLayoutElement(layout);
        return layout
    }

    set(temperatureIndex: number, humidityIndex: number, element: string){
        this.array[temperatureIndex][humidityIndex] = element
    }

    lookupKey(temperatureIndex: number, humidityIndex: number): string {
        return this.array[temperatureIndex][humidityIndex]
    }

    lookup(temperatureIndex: number, humidityIndex: number): LayoutElement{
        const key = this.lookupKey(temperatureIndex, humidityIndex);
        const element = this.builder.getLayoutElement(key)

        return element
    }

    lookupRecursive(temperatureIndex: number, humidityIndex: number, mode: Mode): LayoutElement{
        const element = this.lookup(temperatureIndex, humidityIndex)
        return element.lookupRecursive(temperatureIndex, humidityIndex, mode);
    }

    getSize(): [number, number]{
        return [this.builder.getNumTemperatures(), this.builder.getNumHumidities()]
    }

    getRenderer(): ElementRenderer {
        if (this.renderer === undefined)
            this.renderer = new LayoutGridRenderer(this)

        return this.renderer
    }

    getKey(){
        return this.key
    }
}