import * as _ from "lodash";
import { ElementRenderer } from "../UI/Renderer/ElementRenderer";
import { LayoutGridRenderer } from "../UI/Renderer/LayoutGridRenderer";
import { ABElement } from "./ABBiome";
import { Biome } from "./Biome";
import { BiomeBuilder } from "./BiomeBuilder";
import { LayoutElement, Mode} from "./LayoutElement";
import * as uniqid from 'uniqid';

export class Layout implements LayoutElement {
    allowEdit: boolean = true
    name: string;
    hidden: boolean

    private array: string[][]
    private builder: BiomeBuilder
    private renderer: LayoutGridRenderer

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

    set(temperatureIndex: number, humidityIndex: number, element: string, recordUndo: boolean = true){
        if (this.array[temperatureIndex][humidityIndex] === element)
            return

        if (recordUndo)
            this.undoActions.push({t_id: temperatureIndex, h_id: humidityIndex, value: this.array[temperatureIndex][humidityIndex]})

        this.array[temperatureIndex][humidityIndex] = element
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



    lookupKey(temperatureIndex: number, humidityIndex: number): string {
        return this.array[temperatureIndex][humidityIndex]
    }

    lookup(temperatureIndex: number, humidityIndex: number): LayoutElement{
        const key = this.lookupKey(temperatureIndex, humidityIndex);
        const element = this.builder.getLayoutElement(key)

        return element
    }

    lookupRecursive(temperatureIndex: number, humidityIndex: number, mode: Mode, stopAtHidden: boolean = false): LayoutElement{
        const element = this.lookup(temperatureIndex, humidityIndex)
        if (stopAtHidden && element.hidden)
            return element
        else 
            return element.lookupRecursive(temperatureIndex, humidityIndex, mode, stopAtHidden);
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