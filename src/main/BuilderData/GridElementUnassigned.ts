import { BiomeRenderer, GridElementRenderer, UnassignedRenderer } from "../UI/Renderer/ElementRenderer";
import { Biome } from "./Biome";
import { BiomeBuilder, MultiNoiseIndexes, PartialMultiNoiseIndexes } from "./BiomeBuilder";
import { GridElement, Mode } from "./GridElement";
import { Layout } from "./Layout";
import { Slice } from "./Slice";



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
        builder.registerGridElement(element)
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

    lookupRecursiveWithTracking(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): {slice: Slice, layout: Layout, biome: Biome} {
        return {slice: undefined, layout: undefined, biome: undefined}
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