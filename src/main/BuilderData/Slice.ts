import { isString } from 'lodash';
import * as uniqid from 'uniqid';
import { SliceGridRenderer } from '../UI/Renderer/SliceGridRenderer';
import { BiomeBuilder } from './BiomeBuilder';
import { LayoutElement } from './LayoutElement';

export class Slice{
    allowEdit: boolean = true
    name: string;
    hidden: boolean
    private array: string[][]
    private builder: BiomeBuilder
    private renderer: SliceGridRenderer
    private key: string

    private undoActions: {c_id: number, e_id: number, value: string}[]

    
    private constructor(builder: BiomeBuilder, name: string, array: string[][], key?: string){
        this.name = name;
        this.builder = builder;

        this.array = array;
        this.key = key ?? uniqid('slice_')
        this.undoActions = []
    }

    static create(builder: BiomeBuilder, name: string, fill: string): Slice{
        const slice = new Slice(builder, name, new Array(builder.getNumContinentalnesses()).fill(0).map(() => new Array(builder.getNumErosions()).fill(fill)));
        builder.registerSlice(slice);
        return slice
    }

    static fromJSON(builder: BiomeBuilder, json: any){
        const slice = new Slice(builder, json.name, json.array, json.key)
        builder.registerSlice(slice);
        return slice
    }

    toJSON(){
        return {
            key: this.key,
            name: this.name,
            array: this.array.map(row => row.map(e => this.builder.getLayoutElement(e).getKey()))
        }
    }

    getSize(): [number, number]{
        return [this.builder.getNumContinentalnesses(), this.builder.getNumErosions()]
    }

    set(continentalnessIndex: number, erosionIndex: number, element: string){
        if (this.array[continentalnessIndex][erosionIndex] === element)
            return

        this.undoActions.push({c_id: continentalnessIndex, e_id: erosionIndex, value: this.array[continentalnessIndex][erosionIndex]})
        
        this.array[continentalnessIndex][erosionIndex] = element
        this.builder.hasChanges = true
    }

    undo(){
        if (this.undoActions.length > 0){
            const action = this.undoActions.pop()
            this.array[action.c_id][action.e_id] = action.value
        }
    }

    lookupKey(continentalnessIndex: number, erosionIndex: number): string{
        return this.array[continentalnessIndex][erosionIndex]
    }

    lookup(continentalnessIndex: number, erosionIndex: number): LayoutElement{
        const key = this.lookupKey(continentalnessIndex, erosionIndex)
        return this.builder.getLayoutElement(key)
    }

    getRenderer(): SliceGridRenderer {
        if (this.renderer === undefined)
            this.renderer = new SliceGridRenderer(this)

        return this.renderer
    }

    getKey(){
        return this.key
    }
}