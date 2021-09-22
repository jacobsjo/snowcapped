import { last } from "lodash";
import { Layout } from "../../BuilderData/Layout"
import { ElementRenderer } from "./ElementRenderer"

export class LayoutGridRenderer implements ElementRenderer{
    private layout: Layout

    constructor(layout: Layout){
        this.layout = layout
    }

    public draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, _t_idx: number = -1, _h_idx: number = -1, indicateRecursive: boolean = true, isIcon: boolean = false){
        const size = this.layout.getSize()

        const maxElementSizeX = sizeX / size[1]
        const maxElementSizeY = sizeY / size[0]

        const elementSize = Math.min(maxElementSizeX, maxElementSizeY)

        const xOffset = (elementSize * size[1] - sizeX)/2 + minX
        const yOffset = (elementSize * size[0] - sizeY)/2 + minY

        ctx.clearRect(minX, minY, sizeX, sizeY)

        for (var t_idx = 0 ; t_idx < size[0] ; t_idx++){
            for (var h_idx = 0 ; h_idx < size[1] ; h_idx++){
                var element = this.layout.lookup(t_idx, h_idx)
                if (element === undefined)
                    console.log("undefined at: " + t_idx + ", " + h_idx)
                var isRecursive = false;
                if (element instanceof Layout){
                    element = element.lookupRecursive(t_idx, h_idx, "Any")
                    isRecursive = true;
                }

                element.getRenderer().draw(ctx, xOffset + h_idx * elementSize, yOffset + t_idx * elementSize, elementSize, elementSize, t_idx, h_idx, indicateRecursive, isIcon)

                if (isRecursive && indicateRecursive){
                    ctx.fillStyle = "rgb(255,255,255,0.8)"
                    ctx.beginPath()
                    ctx.rect(xOffset + h_idx * elementSize, yOffset + t_idx * elementSize, elementSize, elementSize)
                    ctx.fill()

                    if (!isIcon){
                        ctx.fillStyle = "rgb(0,0,0,1)"
                        ctx.font = '140px serif';
                        ctx.textAlign = "center"
                        ctx.textBaseline = "middle"
                        ctx.fillText('↵', xOffset + (h_idx+0.5) * elementSize, yOffset + (t_idx+0.6) * elementSize)
                    }
                }

                ctx.strokeStyle = "black"
                ctx.lineWidth = elementSize / 30
                ctx.beginPath()
                ctx.rect(xOffset + h_idx * elementSize, yOffset + t_idx * elementSize, elementSize, elementSize)
                ctx.stroke()

            }
        }
        
    }

    public getIdsFromPosition(minX: number, minY: number, sizeX: number, sizeY: number, x: number, y: number): {t_idx: number, h_idx: number, local_t: number, local_h: number, mode: "A"|"B"} | undefined{
        const size = this.layout.getSize()

        const maxElementSizeX = sizeX / size[1]
        const maxElementSizeY = sizeY / size[0]

        const elementSize = Math.min(maxElementSizeX, maxElementSizeY)

        if (x < minX || y < minY || x > minX + size[1] * elementSize || y > minY + size[0] * elementSize)
            return undefined

        const t_idx = Math.floor((y - minY) / elementSize)
        const h_idx = Math.floor((x - minX) / elementSize)

        const localX = x - minX - (t_idx * elementSize)
        const localY = y - minY - (h_idx * elementSize)
        const mode = localX > elementSize - localY ? "B" : "A"

        return {t_idx: t_idx, h_idx: h_idx, local_t: localX / elementSize, local_h: localY / elementSize, mode: mode}
    }


}