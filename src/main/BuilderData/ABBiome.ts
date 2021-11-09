import { ABBiomeRenderer, GridElementRenderer } from '../UI/Renderer/ElementRenderer'
import { Biome } from './Biome'
import { BiomeBuilder, MultiNoiseIndexes, PartialMultiNoiseIndexes } from './BiomeBuilder'
import {GridElement, Mode} from './GridElement'
import { Layout } from './Layout'
import { Slice } from './Slice'

export class ABElement implements GridElement{
    readonly allowEdit: boolean = false
    readonly elementA: string
    readonly elementB: string

    type_id: number = -1

    hidden: boolean

    private builder: BiomeBuilder
    private renderer: ABBiomeRenderer
    readonly name: string

    private constructor(builder: BiomeBuilder, elementA: string, elementB: string){
        this.elementA = elementA
        this.elementB = elementB
        this.builder = builder
    }

    static create(builder: BiomeBuilder, elementA: string, elementB: string): ABElement{
        const ab_biome = new ABElement(builder, elementA, elementB)
        builder.registerLayoutElement(ab_biome);
        return ab_biome
    }

    lookupKey(indexes: MultiNoiseIndexes, mode: Mode): string{
        if (mode === "A"){
            return this.elementA
        } else if (mode === "B"){
            return this.elementB
        }
        return this.getKey()
    }

    lookup(indexes: PartialMultiNoiseIndexes, mode: Mode): GridElement {
        if (mode === "A"){
            return this.builder.getLayoutElement(this.elementA)
        } else if (mode === "B"){
            return this.builder.getLayoutElement(this.elementB)
        }
        return this
    }

    lookupRecursive(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden: boolean = false): GridElement {
        let element : GridElement

        if (mode === "Any"){
            return this
        } else if (mode === "A"){
            element = this.builder.getLayoutElement(this.elementA)
        } else {
            element = this.builder.getLayoutElement(this.elementB)
        }

        if (stopAtHidden && element.hidden)
            return element
        else 
            return element.lookupRecursive(indexes, mode, stopAtHidden)
    }

    lookupRecursiveWithTracking(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): {slice: Slice, layout: Layout, biome: Biome} {
        let element : GridElement

        if (mode === "Any"){
            return {slice: undefined, layout: undefined, biome: undefined}
        } else if (mode === "A"){
            element = this.builder.getLayoutElement(this.elementA)
        } else {
            element = this.builder.getLayoutElement(this.elementB)
        }

        if (stopAtHidden && element.hidden)
            return {slice: undefined, layout: undefined, biome: undefined}
        else 
            return element.lookupRecursiveWithTracking(indexes, mode, stopAtHidden)
    }

    getElement(mode: "A" | "B"){
        if (mode === "A"){
            return this.builder.getLayoutElement(this.elementA)
        } else {
            return this.builder.getLayoutElement(this.elementB)
        }
    }

    getRenderer(): GridElementRenderer {
        if (this.renderer === undefined)
            this.renderer = new ABBiomeRenderer(this)

        return this.renderer
    }

    getKey(){
        return this.elementA + "/" + this.elementB
    }

    has(key: string, limit: PartialMultiNoiseIndexes){
        return (key === this.getKey()) || this.getElement("A").has(key, limit) || this.getElement("B").has(key, limit)
    }
}