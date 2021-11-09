import { GridElementRenderer } from "../UI/Renderer/ElementRenderer";
import { ABElement } from "./ABBiome";
import { Biome } from "./Biome";
import { BiomeBuilder, MultiNoiseIndexes } from "./BiomeBuilder";
import { GridElement, Mode } from "./GridElement";


export class GridElementDummy implements GridElement{
    hidden: boolean;
    allowEdit: boolean = false
    type_id: number = 1000
    name: string = "__dummy__";

    static create(builder: BiomeBuilder): GridElementDummy{
        const dummy = new GridElementDummy()
        builder.registerLayoutElement(dummy);
        return dummy
    }

    lookupKey(_indexes: MultiNoiseIndexes, _mode: Mode): string {
        return "__dummy__"
    }

    lookup(_indexes: MultiNoiseIndexes, _mode: Mode): GridElement {
        return this
    }

    lookupRecursive(_indexes: MultiNoiseIndexes, _mode: Mode): GridElement {
        return this
    }

    getRenderer(): GridElementRenderer {
        throw new Error("Method not implemented.");
    }
    getKey(): string {
        return "__dummy__"
    }

}