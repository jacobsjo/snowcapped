import { Biome } from "../../BuilderData/Biome"
import { PartialMultiNoiseIndexes } from "../../BuilderData/BiomeBuilder"
import { GridElementRenderer } from "./ElementRenderer"

export class BiomeRenderer implements GridElementRenderer{
    biome: Biome

    constructor(biome: Biome){
        this.biome = biome
    }
    setHighlight(x_idx: number, y_idx: number): void {
    }

    public draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, indexes: PartialMultiNoiseIndexes, isIcon: boolean){
        ctx.fillStyle = this.biome.color
        ctx.fillRect(minX, minY, sizeX, sizeY)
    }

    public getIdsFromPosition(minX: number, minY: number, sizeX: number, sizeY: number, x: number, y: number): {t_idx: number, h_idx: number, mode: "A"|"B"} | undefined{
        return {t_idx: -1, h_idx: -1, mode:"A"}
    }
}
