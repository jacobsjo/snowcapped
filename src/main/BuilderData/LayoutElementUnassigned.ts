import { BiomeRenderer, ElementRenderer, UnassignedRenderer } from "../UI/Renderer/ElementRenderer";
import { BiomeBuilder } from "./BiomeBuilder";
import { LayoutElement, Mode } from "./LayoutElement";



export class LayoutElementUnassigned implements LayoutElement{
    allowEdit: boolean = false
    name: string = "- Unassigned -";
    hidden: boolean;
    renderer: UnassignedRenderer;

    private constructor(){

    }

    static create(builder: BiomeBuilder){
        const element = new LayoutElementUnassigned()
        builder.registerLayoutElement(element)
        return element
    }

    lookupKey(temperatureIndex: number, humidityIndex: number): string {
        return this.getKey()
    }

    lookup(temperatureIndex: number, humidityIndex: number): LayoutElement {
        return this
    }

    lookupRecursive(temperatureIndex: number, humidityIndex: number, mode: Mode): LayoutElement {
        return this
    }

    getRenderer(): ElementRenderer {
        if (this.renderer === undefined)
            this.renderer = new UnassignedRenderer()

        return this.renderer
    }
    
    getKey(): string {
        return "unassigned"
    }
}