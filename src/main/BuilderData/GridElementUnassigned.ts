import { GridElementRenderer } from "../UI/Renderer/ElementRenderer";
import { UnassignedRenderer } from "../UI/Renderer/UnassignedRenderer";
import { Biome } from "./Biome";
import { BiomeBuilder, MultiNoiseIndexes, PartialMultiNoiseIndexes } from "./BiomeBuilder";
import { Grid } from "./Grid";
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

    lookupRecursiveWithTracking(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): {slice: Grid, layout: Grid, biome: Biome} {
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