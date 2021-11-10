import * as _ from "lodash";
import { GridElementRenderer } from "../UI/Renderer/ElementRenderer";
import { ABElement } from "./ABBiome";
import { Biome } from "./Biome";
import { BiomeBuilder, MultiNoiseIndexes, PartialMultiNoiseIndexes } from "./BiomeBuilder";
import { GridElement, Mode} from "./GridElement";
import * as uniqid from 'uniqid';
import { BiomeGridRenderer } from "../UI/Renderer/BiomeGridRenderer";
import { GridElementUnassigned } from "./GridElementUnassigned";
import { Slice } from "./Slice";

export class Layout implements GridElement {
    allowEdit: boolean = true
    name: string;
    type_id: number = 2
    hidden: boolean

    private array: string[][]
    private builder: BiomeBuilder
    private renderer: BiomeGridRenderer

    private undoActions: {t_id: number, h_id: number, value: string}[]

    private key: string
    
    private constructor(builder: BiomeBuilder, name: string, array?: string[][], key?: string){
        this.name = name;
        this.builder = builder
        this.array = array ?? new Array(builder.getNumTemperatures()).fill(0).map(() => new Array(builder.getNumHumidities()).fill("unassigned"))

        this.key = key ?? uniqid('layout_')
        this.undoActions = []
    }

    static create(builder: BiomeBuilder, name: string, array?: string[][], key?: string): Layout{
        const layout = new Layout(builder, name, array, key)
        builder.registerLayoutElement(layout);
        return layout
    }

    static fromJSON(builder: BiomeBuilder, json: any){
        return Layout.create(builder, json.name, json.array, json.key)
    }

    toJSON(){
        return {
            key: this.key,
            name: this.name,
            array: this.array.map(row => row.map(e => this.builder.getLayoutElement(e).getKey()))
        }
    }

    set(indexes: PartialMultiNoiseIndexes, element: string, recordUndo: boolean = true){
        if (indexes.t_idx === undefined || indexes.h_idx === undefined)
            throw new Error("Trying to set element of Layout without proper ids")

        if (this.array[indexes.t_idx][indexes.h_idx] === element)
            return

        if (recordUndo)
            this.undoActions.push({t_id: indexes.t_idx, h_id: indexes.h_idx, value: this.array[indexes.t_idx][indexes.h_idx]})

        this.array[indexes.t_idx][indexes.h_idx] = element
        this.builder.hasChanges = true
    }

    undo(){
        if (this.undoActions.length > 0){
            const action = this.undoActions.pop()
            this.array[action.t_id][action.h_id] = action.value
        }
    }

    deleteParam(param: "humidity"|"temperature", id: number){
        if (param === "temperature"){
            this.array.splice(id, 1)
        } else {
            this.array.forEach(row => row.splice(id, 1))
        }
    }

    splitParam(param: "humidity"|"temperature", id: number){
        if (param === "temperature"){
            this.array.splice(id, 0, Array.from(this.array[id]))
        } else {
            this.array.forEach(row => row.splice(id, 0, row[id]))
        }
    }



    lookupKey(indexes: PartialMultiNoiseIndexes, _mode: Mode): string {
        if (indexes.t_idx === undefined || indexes.h_idx === undefined)
            return this.getKey()

        return this.array[indexes.t_idx][indexes.h_idx]
    }

    lookup(indexes: PartialMultiNoiseIndexes, mode: Mode): GridElement{
        const key = this.lookupKey(indexes, mode);
        const element = this.builder.getLayoutElement(key)

        return element
    }

    lookupRecursive(indexes: MultiNoiseIndexes, mode: Mode, stopAtHidden: boolean = false): GridElement{
        const element = this.lookup(indexes, mode)
        if ((stopAtHidden && element.hidden) || element === this)
            return element
        else 
            return element.lookupRecursive(indexes, mode, stopAtHidden);
    }

    lookupRecursiveWithTracking(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): {slice: Slice, layout: Layout, biome: Biome} {
        const element = this.lookup(indexes, mode)
        if (stopAtHidden && element.hidden)
            return {slice: undefined, layout: this, biome: undefined}
        else {
            const lookup = element.lookupRecursiveWithTracking(indexes, mode, stopAtHidden)
            return {slice: undefined, layout: this, biome: lookup.biome}
        }
    }

    getSize(): [number, number]{
        return [this.builder.getNumTemperatures(), this.builder.getNumHumidities()]
    }

    getRenderer(): GridElementRenderer {
        if (this.renderer === undefined)
            this.renderer = new BiomeGridRenderer(this)

        return this.renderer
    }

    public cellToIds(x: number, y: number): PartialMultiNoiseIndexes {
        return { h_idx: x, t_idx: y }
    }

    public idsToCell(indexes: PartialMultiNoiseIndexes): [number, number] | "all" {
        if (indexes.h_idx === undefined || indexes.t_idx === undefined)
            return "all"

        return [indexes.h_idx, indexes.t_idx]
    }

    getKey(){
        return this.key
    }

    has(key: string, limit: PartialMultiNoiseIndexes){
        if (key === this.getKey()) return true

        if (limit.h_idx === undefined || limit.t_idx === undefined){
            return this.array.findIndex(row => row.findIndex(element => this.builder.getLayoutElement(element).has(key, limit)) >= 0) >= 0
        } else {
            return this.lookup(limit, "Any").has(key, limit)
        }
    }
}