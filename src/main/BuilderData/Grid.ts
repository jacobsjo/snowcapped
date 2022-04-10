import * as _ from "lodash";
import { GridElementRenderer } from "../UI/Renderer/ElementRenderer";
import { Biome } from "./Biome";
import { BiomeBuilder, MultiNoiseIndexes, PartialMultiNoiseIndexes } from "./BiomeBuilder";
import { GridElement, Mode} from "./GridElement";
import * as uniqid from 'uniqid';
import { BiomeGridRenderer } from "../UI/Renderer/BiomeGridRenderer";
import { json, thresholdFreedmanDiaconis } from "d3";
import { Json } from "deepslate";

export interface MultiNoiseIndexesAccessor{
    readonly type: "dimension" | "layout" | "slice"
    getSize(bulder: BiomeBuilder): [number, number]
    cellToIds(x: number, y: number): PartialMultiNoiseIndexes
    idsToCell(indexes: PartialMultiNoiseIndexes): [number, number] | "all"
    paramToAxis(param: string): "x" | "y"
    modesetting(indexes: PartialMultiNoiseIndexes): "A" | "B" | "unchanged"
}

export class DimensionMultiNoiseIndexesAccessor implements MultiNoiseIndexesAccessor{

    constructor(public builder: BiomeBuilder){}

    type: "dimension" = "dimension"
    getSize(bulder: BiomeBuilder): [number, number] {
        return [bulder.getNumWeirdnesses(), bulder.getNumDepths()]
    }

    cellToIds(x: number, y: number): PartialMultiNoiseIndexes {
        return {d: x, w: y}
    }
    idsToCell(indexes: PartialMultiNoiseIndexes): [number, number] | "all" {
        if (indexes.w === undefined || indexes.d === undefined)
            return "all"

        return [indexes.d, indexes.w]
    }

    paramToAxis(param: string): "x" | "y" {
        if (param === "depth")
            return "x"
        else if (param === "weirdness")
            return "y"
        else
            throw new Error("Invalid Parameter")
    }

    modesetting(indexes: PartialMultiNoiseIndexes): "A" | "B" | "unchanged" {
        if (indexes.w === undefined){
            return "unchanged"
        } else {
            return this.builder.modes[indexes.w]
        }
    }
}


export class SliceMultiNoiseIndexesAccessor implements MultiNoiseIndexesAccessor{
    type: "layout" | "slice" = "slice"
    getSize(bulder: BiomeBuilder): [number, number] {
        return [bulder.getNumErosions(), bulder.getNumContinentalnesses()]
    }

    cellToIds(x: number, y: number): PartialMultiNoiseIndexes {
        return {c: x, e: y}
    }
    idsToCell(indexes: PartialMultiNoiseIndexes): [number, number] | "all" {
        if (indexes.c === undefined || indexes.e === undefined)
            return "all"

        return [indexes.c, indexes.e]
    }

    paramToAxis(param: string): "x" | "y" {
        if (param === "continentalness")
            return "x"
        else if (param === "erosion")
            return "y"
        else
            throw new Error("Invalid Parameter")
    }

    modesetting(indexes: PartialMultiNoiseIndexes): "A" | "B" | "unchanged" {
        return "unchanged"
    }
}

export class LayoutMultiNoiseIndexesAccessor implements MultiNoiseIndexesAccessor{
    type: "layout" | "slice" = "layout"
    getSize(bulder: BiomeBuilder): [number, number] {
        return [bulder.getNumHumidities(), bulder.getNumTemperatures()]
    }

    cellToIds(x: number, y: number): PartialMultiNoiseIndexes {
        return {t: x, h: y}
    }
    idsToCell(indexes: PartialMultiNoiseIndexes): [number, number] | "all" {
        if (indexes.t === undefined || indexes.h === undefined)
            return "all"

        return [indexes.t, indexes.h]
    }

    paramToAxis(param: string): "x" | "y" {
        if (param === "temperature")
            return "x"
        else if (param === "humidity")
            return "y"
        else
            throw new Error("Invalid Parameter")
    }

    modesetting(indexes: PartialMultiNoiseIndexes): "A" | "B" | "unchanged" {
        return "unchanged"
    }
}




export class Grid implements GridElement {
    allowEdit: boolean = true
    name: string;
    hidden: boolean

    private accessor: MultiNoiseIndexesAccessor
    private array: string[][]
    private lookup_cache: GridElement[][]
    private builder: BiomeBuilder
    private renderer: BiomeGridRenderer
    private key: string

    private undoActions: {y_id: number, x_id: number, value: string}[]
    
    private constructor(builder: BiomeBuilder, name: string, accessor: MultiNoiseIndexesAccessor, array?: string[][], key?: string){
        this.name = name
        this.builder = builder
        this.accessor = accessor
        const size = accessor.getSize(builder)
        this.array = array ?? new Array(size[1]).fill(0).map(() => new Array(size[0]).fill("unassigned"))
        this.lookup_cache = new Array(size[1]).fill(0).map(() => new Array(size[0]).fill(undefined))
        this.key = key ?? uniqid('layout_')
        this.undoActions = []
    }

    static create(builder: BiomeBuilder, name: string, accessor: MultiNoiseIndexesAccessor, array?: string[][], key?: string): Grid{
        const grid = new Grid(builder, name, accessor, array, key)

        if (accessor.type === "layout")
            builder.registerLayout(grid);
        else if (accessor.type === "slice")
            builder.registerSlice(grid);

        return grid
    }

    static fromJSON(builder: BiomeBuilder, json: any, accessor: MultiNoiseIndexesAccessor){
        return Grid.create(builder, json.name, accessor, json.array, json.key)
    }

    toJSON(){
        return {
            key: this.key,
            name: this.name,
            array: this.array.map(row => row.map(e => this.builder.getLayoutElement(e).getKey()))
        }
    }

    getSize(): [number, number]{
        return this.accessor.getSize(this.builder)
    }

    getType(): "dimension" | "layout" | "slice" {
        return this.accessor.type
    }

    set(indexes: PartialMultiNoiseIndexes, element: string, recordUndo: boolean = true){
        const cell = this.accessor.idsToCell(indexes)
        if (cell === "all")
            throw new Error("Trying to set element of Layout without proper ids")

        if (this.array[cell[0]][cell[1]] === element)
            return

        if (recordUndo)
            this.undoActions.push({y_id: cell[0], x_id: cell[1], value: this.array[cell[0]][cell[1]]})

        this.array[cell[0]][cell[1]] = element
        this.builder.hasChanges = true

        this.getRenderer().setDirty()
    }

    undo(){
        if (this.undoActions.length > 0){
            const action = this.undoActions.pop()
            this.array[action.y_id][action.x_id] = action.value
        }
    }

    deleteParam(param: string, id: number){
        const axis = this.accessor.paramToAxis(param)
        if (axis === "x"){
            this.array.splice(id, 1)
        } else {
            this.array.forEach(row => row.splice(id, 1))
        }
        this.lookup_cache = new Array(this.array.length).fill(0).map(() => new Array(this.array[0].length).fill(undefined))

    }

    splitParam(param: string, id: number){
        const axis = this.accessor.paramToAxis(param)
        if (axis === "x"){
            this.array.splice(id, 0, Array.from(this.array[id]))
        } else {
            this.array.forEach(row => row.splice(id, 0, row[id]))
        }

        this.lookup_cache = new Array(this.array.length).fill(0).map(() => new Array(this.array[0].length).fill(undefined))

    }

    deleteGridElement(key: string){
        for (let r in this.array){
            for (let c in this.array[r]){
                if (this.array[r][c] === key){
                    this.array[r][c] = "unassigned";
                }
            }
        }
    }

    lookupKey(indexes: PartialMultiNoiseIndexes, _mode: Mode): string {
        const cell = this.accessor.idsToCell(indexes)
        if (cell === "all"){
            return this.getKey()
        }

        return this.array[cell[0]][cell[1]]
    }

    lookup(indexes: PartialMultiNoiseIndexes, mode: Mode): GridElement{
        const cell = this.accessor.idsToCell(indexes)
        if (cell === "all"){
            return this
        }

        const key = this.array[cell[0]][cell[1]]
        //console.log("array length: " + this.array.length + ", " + this.array[0].length + "   cache length: " + this.lookup_cache.length + ", " + this.lookup_cache[0].length)
        const cached_element = this.lookup_cache[cell[0]][cell[1]]
        if (cached_element !== undefined && cached_element.getKey() === key){
            return cached_element
        } else {
            if (key === undefined){
                console.log(indexes)
            }
            const lookup = this.builder.getLayoutElement(key)
            this.lookup_cache[cell[0]][cell[1]] = lookup
            return lookup
        }
    }

    lookupRecursive(indexes: MultiNoiseIndexes, mode: Mode, stopAtHidden: boolean = false): GridElement{
        const modechange = this.accessor.modesetting(indexes)
        const new_mode = modechange === "unchanged" ? mode : modechange

        const element = this.lookup(indexes, new_mode)
        if ((stopAtHidden && element.hidden) || element === this)
            return element
        else
            return element.lookupRecursive(indexes, new_mode, stopAtHidden);
    }

    lookupRecursiveWithTracking(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): {mode: Mode, slice: Grid; layout: Grid; biome: Biome; } {
        const modechange = this.accessor.modesetting(indexes)
        const new_mode = modechange === "unchanged" ? mode : modechange

        const element = this.lookup(indexes, new_mode)
        if (element.getKey() === this.getKey()){
            throw new Error("Lookup resulted in same element: " + JSON.stringify(indexes) + " mode: " + mode)
        }
        if (stopAtHidden && element.hidden){
            if (this.accessor.type === "slice")
                return {mode: new_mode, slice: this, layout: undefined, biome: undefined}
            else if (this.accessor.type === "layout")
                return {mode: new_mode, slice: undefined, layout: this, biome: undefined}
            else if (this.accessor.type === "dimension")
                return {mode: new_mode, slice: undefined, layout: undefined, biome: undefined}
        } else {
            const lookup = element.lookupRecursiveWithTracking(indexes, new_mode, stopAtHidden)
            if (this.accessor.type === "slice")
                return {mode: new_mode, slice: this, layout: lookup.layout, biome: lookup.biome}
            else if (this.accessor.type === "layout")
                return {mode: new_mode, slice: undefined, layout: this, biome: lookup.biome}
            else if (this.accessor.type === "dimension")
                return {mode: new_mode, slice: lookup.slice, layout: lookup.layout, biome: lookup.biome}
        }
    }


    getRenderer(): BiomeGridRenderer {
        if (this.renderer === undefined)
            this.renderer = new BiomeGridRenderer(this)

        return this.renderer
    }

    public cellToIds(x: number, y: number): PartialMultiNoiseIndexes {
        return this.accessor.cellToIds(x, y)
    }

    public idsToCell(indexes: PartialMultiNoiseIndexes): [number, number] | "all" {
        return this.accessor.idsToCell(indexes)
    }

    getKey(){
        return this.key
    }

    has(key: string, limit: PartialMultiNoiseIndexes){
        if (key === this.getKey()) return true

        const cell = this.accessor.idsToCell(limit)
        if (cell === "all"){
            return this.array.findIndex(row => row.findIndex(element => this.builder.getLayoutElement(element).has(key, limit)) >= 0) >= 0
        } else {
            return this.lookup(limit, "Any").has(key, limit)
        }
    }
}