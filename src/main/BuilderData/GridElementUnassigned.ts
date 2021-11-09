import { BiomeRenderer, GridElementRenderer, UnassignedRenderer } from "../UI/Renderer/ElementRenderer";
import { BiomeBuilder, MultiNoiseIndexes, PartialMultiNoiseIndexes } from "./BiomeBuilder";
import { GridElement, Mode } from "./GridElement";



export class GridElementUnassigned implements GridElement{
    allowEdit: boolean = false
    name: string = "- Unassigned -";
    type_id: number = 1000
    hidden: boolean;
    renderer: UnassignedRenderer;

    private constructor(){

    }

    static create(builder: BiomeBuilder){
        const element = new GridElementUnassigned()
        builder.registerLayoutElement(element)
        return element
    }

    lookupKey(indexes: MultiNoiseIndexes, mode: Mode): string {
        return this.getKey()
    }

    lookup(indexes: MultiNoiseIndexes, mode: Mode): GridElement {
        return this
    }

    lookupRecursive(indexes: MultiNoiseIndexes, mode: Mode): GridElement {
        return this
    }

    getRenderer(): GridElementRenderer {
        if (this.renderer === undefined)
            this.renderer = new UnassignedRenderer()

        return this.renderer
    }
    
    getKey(): string {
        return "unassigned"
    }

    has(key: string, _limit: PartialMultiNoiseIndexes){
        return (key === this.getKey())
    }
}