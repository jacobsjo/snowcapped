import { BiomeBuilder } from './BiomeBuilder';
import { LayoutElement } from './LayoutElement';

export class Slice{
    private weirdnessIndex: number;

    readonly name: string;
    private array: string[][]
    private builder: BiomeBuilder
    
    private constructor(builder: BiomeBuilder, name: string, weirdnessIndex: number){
        this.name = name;
        this.builder = builder;
        this.array = new Array(builder.getNumContinentalnesses()).fill(0).map(() => new Array(builder.getNumErosions()).fill(undefined))
    }

    static create(builder: BiomeBuilder, name: string, weirdnessIndex: number): Slice{
        const slice = new Slice(builder, name, weirdnessIndex);
        builder.registerSlice(slice);
        return slice
    }

    set(continentalnessIndex: number, erosionIndex: number, element: string){
        this.array[continentalnessIndex][erosionIndex] = element
    }

    getKey(continentalnessIndex: number, erosionIndex: number): string{
        return this.array[continentalnessIndex][erosionIndex]
    }

    get(continentalnessIndex: number, erosionIndex: number): LayoutElement{
        const key = this.getKey(continentalnessIndex, erosionIndex)
        return this.builder.getLayoutElement(key)
    }
}