import * as uniqid from 'uniqid'
import { BiomeRenderer, GridElementRenderer } from '../UI/Renderer/ElementRenderer'
import { VanillaBiomes } from '../Vanilla/VanillaBiomes'
import { BiomeBuilder, MultiNoiseIndexes, PartialMultiNoiseIndexes } from './BiomeBuilder'
import {GridElement, Mode} from './GridElement'
import { Layout } from './Layout'
import { Slice } from './Slice'

export class Biome implements GridElement{
    name: string
    hidden: boolean = false
    type_id: number = 3
    readonly allowEdit: boolean = true

    public color: string
    private renderer: BiomeRenderer
    private isVanilla: boolean

    private key: string

    private constructor(name: string, color: string, key?: string, isVanilla: boolean = false){
        this.name = name
        this.color = color
        if (key !== undefined)
            this.key = key
        else if (isVanilla)
            this.key = name
        else
            this.key = uniqid('biome_')
        this.allowEdit = !isVanilla
        this.isVanilla = isVanilla
    }

    static create(builder: BiomeBuilder, name: string, color: string, key?: string, isVanilla: boolean = false): Biome{
        const biome = new Biome(name, color, key, isVanilla)
        if (isVanilla)
            builder.registerVanillaBiome(biome)
        else
            builder.registerGridElement(biome);
        return biome
    }

    static fromJSON(builder: BiomeBuilder, json: any){
        if (builder.vanillaBiomes.has(json.key)){
            const vanillaBiome = builder.vanillaBiomes.get(json.key)

            builder.registerGridElement(vanillaBiome)
            if (json.color){
                vanillaBiome.color = json.color
            }
        } else {
            const biome = new Biome(json.name, json.color ?? "#888888", json.key, false)
            builder.registerGridElement(biome);
            return biome
        }
    }

    toJSON(){
        var color = undefined
        if (!this.isVanilla)
            color = this.color
        else {
            const vanillaColor = VanillaBiomes.biomes.find(b => b.key === this.getKey()).color
            if (this.color !== vanillaColor){
                color = this.color
            }
        }

        return {
            key: this.key,
            name: this.name,
            color: color
        }
    }    

    lookupKey(indexes: MultiNoiseIndexes, mode: Mode,): string{
        return this.getKey()
    }

    lookup(indexes: MultiNoiseIndexes, mode: Mode): Biome {
        return this
    }

    lookupRecursive(indexes: MultiNoiseIndexes, mode: Mode,): Biome {
        return this
    }

    lookupRecursiveWithTracking(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): {slice: Slice, layout: Layout, biome: Biome} {
        return {slice: undefined, layout: undefined, biome: this}
    }


    getRenderer(): GridElementRenderer {
        if (this.renderer === undefined)
            this.renderer = new BiomeRenderer(this)

        return this.renderer
    }

    getKey(){
        return this.key
    }

    has(key: string, _limit: PartialMultiNoiseIndexes){
        return (key === this.getKey())
    }

}

