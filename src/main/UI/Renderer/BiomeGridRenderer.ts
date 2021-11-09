import { last } from "lodash";
import { ABElement } from "../../BuilderData/ABBiome";
import { Biome } from "../../BuilderData/Biome";
import { MultiNoiseIndexes, PartialMultiNoiseIndexes } from "../../BuilderData/BiomeBuilder";
import { GridElement } from "../../BuilderData/GridElement";
import { Layout } from "../../BuilderData/Layout"
import { Slice } from "../../BuilderData/Slice";
import { GridElementRenderer } from "./ElementRenderer"

export class BiomeGridRenderer implements GridElementRenderer {
    private highlight_x: number = -1
    private highlight_y: number = -1

    private grid: Layout | Slice

    constructor(grid: Layout | Slice) {
        this.grid = grid
    }

    public lookup(x: number, y: number): GridElement {
        return this.grid.lookup(this.grid.cellToIds(x, y), "Any")
    }

    public getSize(): [number, number] {
        return this.grid.getSize()
    }

    public draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, indexes: PartialMultiNoiseIndexes , indicateRecursive: boolean = true, isIcon: boolean = false, drawGridWithBorder: boolean = false){
        const ids = this.grid.idsToCell(indexes)
        if (ids !== "all"){
            this.lookup(ids[0], ids[1]).getRenderer().draw(ctx, minX, minY, sizeX, sizeY, indexes, false, isIcon, drawGridWithBorder)
            return
        }

        const size = this.getSize()

        if (drawGridWithBorder){
            minX += 0.1 * sizeX
            minY += 0.1 * sizeY
            sizeX *= 0.8
            sizeY *= 0.8
        }

        const maxElementSizeX = sizeX / size[1]
        const maxElementSizeY = sizeY / size[0]

        const elementSize = Math.min(maxElementSizeX, maxElementSizeY)

        const xOffset = -(elementSize * size[1] - sizeX) / 2 + minX
        const yOffset = -(elementSize * size[0] - sizeY) / 2 + minY

        ctx.clearRect(minX, minY, sizeX, sizeY)

        for (var y_idx = 0; y_idx < size[0]; y_idx++) {
            for (var x_idx = 0; x_idx < size[1]; x_idx++) {
                var element = this.lookup(x_idx, y_idx)
                if (element === undefined)
                    console.log("undefined at: " + y_idx + ", " + x_idx)

                element.getRenderer().draw(ctx, xOffset + x_idx * elementSize, yOffset + y_idx * elementSize, elementSize, elementSize, this.grid.cellToIds(x_idx, y_idx) , indicateRecursive && !isIcon, true, !isIcon)

                if (indicateRecursive && !isIcon && element.constructor === this.grid.constructor){
                    ctx.fillStyle = "rgb(255,255,255,0.8)"
                    ctx.beginPath()
                    ctx.rect(xOffset + x_idx * elementSize, yOffset + y_idx * elementSize, elementSize, elementSize)
                    ctx.fill()

                    if (!isIcon){
                        ctx.fillStyle = "rgb(0,0,0,1)"
                        ctx.textAlign = "center"
                        ctx.textBaseline = "middle"
                        ctx.font = '100px serif';
                        ctx.fillText(element.name.charAt(0), xOffset + (x_idx+0.4) * elementSize, yOffset + (y_idx+0.4) * elementSize)
                        ctx.font = '140px serif';
                        ctx.fillText('↵', xOffset + (x_idx+0.65) * elementSize, yOffset + (y_idx+0.75) * elementSize)
                    }                    
                }

                ctx.strokeStyle = "black"
                ctx.lineWidth = elementSize / 30
                ctx.beginPath()
                ctx.rect(xOffset + x_idx * elementSize, yOffset + y_idx * elementSize, elementSize, elementSize)
                ctx.stroke()

            }
        }

        if (this.highlight_y >= 0 && this.highlight_x >= 0 && !isIcon){
            ctx.strokeStyle = "red"
            ctx.lineWidth = elementSize / 15
            ctx.beginPath()
            ctx.rect(xOffset + this.highlight_x * elementSize, yOffset + this.highlight_y * elementSize, elementSize, elementSize)
            ctx.stroke()

            this.highlight_y = -1
            this.highlight_x = -1
        }

    }

    public getIdsFromPosition(minX: number, minY: number, sizeX: number, sizeY: number, x: number, y: number): {indexes: PartialMultiNoiseIndexes, local_t: number, local_h: number, mode: "A"|"B"} | undefined{
        const size = this.getSize()

        const maxElementSizeX = sizeX / size[1]
        const maxElementSizeY = sizeY / size[0]

        const elementSize = Math.min(maxElementSizeX, maxElementSizeY)

        const xOffset = -(elementSize * size[1] - sizeX)/2 + minX
        const yOffset = -(elementSize * size[0] - sizeY)/2 + minY

        if (x < xOffset || y < yOffset || x > xOffset + size[1] * elementSize || y > yOffset + size[0] * elementSize)
            return undefined

        const y_idx = Math.floor((y - yOffset) / elementSize)
        const x_idx = Math.floor((x - xOffset) / elementSize)

        const localX = x - xOffset - (x_idx * elementSize)
        const localY = y - yOffset - (y_idx * elementSize)
        const mode = localX > elementSize - localY ? "B" : "A"

        return {indexes: this.grid.cellToIds(x_idx, y_idx), local_h: localX / elementSize, local_t: localY / elementSize, mode: mode}
    }

    public setHighlight(y_idx: number, x_idx: number){
        this.highlight_y = y_idx
        this.highlight_x = x_idx
    }

}