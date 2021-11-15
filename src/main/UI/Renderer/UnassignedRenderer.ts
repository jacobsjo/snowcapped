import { PartialMultiNoiseIndexes } from "../../BuilderData/BiomeBuilder"
import { GridElementRenderer } from "./ElementRenderer"



export class UnassignedRenderer implements GridElementRenderer{
    setHighlight(x_idx: number, y_idx: number): void {
    }

    public draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, indexes: PartialMultiNoiseIndexes , isIcon: boolean){
        ctx.fillStyle = "gray"
        ctx.fillRect(minX, minY, sizeX, sizeY)

        ctx.fillStyle = "white"
        ctx.font = (sizeX*0.75) + 'px serif'
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("?", minX + sizeX * 0.5, minY + sizeY * 0.55)
    }
}