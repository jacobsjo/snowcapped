import { last } from "lodash";
import { ABElement } from "../../BuilderData/ABBiome";
import { Biome } from "../../BuilderData/Biome";
import { MultiNoiseIndexes, PartialMultiNoiseIndexes } from "../../BuilderData/BiomeBuilder";
import { Grid } from "../../BuilderData/Grid";
import { GridElement } from "../../BuilderData/GridElement";
import { UI } from "../UI";
import { ABBiomeRenderer, GridElementRenderer } from "./ElementRenderer"

export class BiomeGridRenderer implements GridElementRenderer {
    private highlight_x: number = -1
    private highlight_y: number = -1

    private grid: Grid

    private aImg : HTMLImageElement = document.getElementById("aModeImg") as HTMLImageElement
    private bImg : HTMLImageElement = document.getElementById("bModeImg") as HTMLImageElement

    constructor(grid: Grid) {
        this.grid = grid
    }

    public lookup(x: number, y: number): GridElement {
        return this.grid.lookup(this.grid.cellToIds(y, x), "Any")
    }

    public getSize(): [number, number] {
        return this.grid.getSize()
    }

    public draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, indexes: PartialMultiNoiseIndexes , indicateRecursive: boolean = true, isIcon: boolean = false, drawGridWithBorder: boolean = false){
        const ids = this.grid.idsToCell(indexes)
        if (ids !== "all"){
            this.lookup(ids[1], ids[0]).getRenderer().draw(ctx, minX, minY, sizeX, sizeY, indexes, false, isIcon, drawGridWithBorder)
            return
        }

        const size = this.getSize()
        var startY = 0

        if (this.grid.getType() === "dimension"){
            size[1] += 1
            startY = 1
        }

        if (drawGridWithBorder){
            minX += 0.1 * sizeX
            minY += 0.1 * sizeY
            sizeX *= 0.8
            sizeY *= 0.8
        }

        const maxElementSizeX = sizeX / size[0]
        const maxElementSizeY = sizeY / size[1]

        const elementSize = Math.min(maxElementSizeX, maxElementSizeY)

        const xOffset = -(elementSize * size[0] - sizeX) / 2 + minX
        const yOffset = -(elementSize * size[1] - sizeY) / 2 + minY

        ctx.clearRect(minX, minY, sizeX, sizeY)

        if (this.grid.getType() === "dimension"){
            for (var x_idx = 0; x_idx < size[0]; x_idx++) {
                ctx.drawImage(UI.getInstance().builder.modes[x_idx] === "A" ? this.aImg : this.bImg, xOffset + (x_idx + 0.25) * elementSize, yOffset + 0.25 * elementSize, 0.5 * elementSize, 0.5 * elementSize)
            }
        }

        for (var y_idx = startY; y_idx < size[1]; y_idx++) {
            for (var x_idx = 0; x_idx < size[0]; x_idx++) {
                var element = this.lookup(x_idx, y_idx - startY)
                if (element === undefined)
                    console.log("undefined at: " + (y_idx - startY) + ", " + x_idx)

                const renderer = element.getRenderer()
                if (renderer instanceof ABBiomeRenderer){
                    renderer.setParentType(this.grid.getType())
                }
                
                element.getRenderer().draw(ctx, xOffset + x_idx * elementSize, yOffset + y_idx * elementSize, elementSize, elementSize, this.grid.cellToIds(y_idx, x_idx) , indicateRecursive && !isIcon, true, !isIcon)

                if (indicateRecursive && !isIcon && (element instanceof Grid) && element.getType() === this.grid.getType()){
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

        var startY = 0

        if (this.grid.getType() === "dimension"){
            size[1] += 1
            startY = 1
        }

        const maxElementSizeX = sizeX / size[0]
        const maxElementSizeY = sizeY / size[1]

        const elementSize = Math.min(maxElementSizeX, maxElementSizeY)

        const xOffset = -(elementSize * size[0] - sizeX)/2 + minX
        const yOffset = -(elementSize * size[1] - sizeY)/2 + minY

        if (x < xOffset || y < yOffset || x > xOffset + size[0] * elementSize || y > yOffset + size[1] * elementSize)
            return undefined

        const y_idx = Math.floor((y - yOffset) / elementSize)
        const x_idx = Math.floor((x - xOffset) / elementSize)

        const localX = x - xOffset - (x_idx * elementSize)
        const localY = y - yOffset - (y_idx * elementSize)
        const mode = localX > elementSize - localY ? "B" : "A"

        return {indexes: this.grid.cellToIds(y_idx - startY, x_idx), local_h: localX / elementSize, local_t: localY / elementSize, mode: mode}
    }

    public setHighlight(y_idx: number, x_idx: number){
        this.highlight_y = y_idx
        this.highlight_x = x_idx
    }

}