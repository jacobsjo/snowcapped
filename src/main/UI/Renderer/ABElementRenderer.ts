import { ABElement } from "../../BuilderData/ABBiome"
import { Biome } from "../../BuilderData/Biome"
import { PartialMultiNoiseIndexes } from "../../BuilderData/BiomeBuilder"
import { Grid } from "../../BuilderData/Grid"
import { GridElementUnassigned } from "../../BuilderData/GridElementUnassigned"
import { GridElementRenderer } from "./ElementRenderer"


export class ABElementRenderer implements GridElementRenderer{
    ab_element: ABElement
    private parentType: string

    constructor(ab_biome: ABElement){
        this.ab_element = ab_biome
    }
    setHighlight(x_idx: number, y_idx: number): void {
    }

    public setParentType(type: string){
        this.parentType = type
    }

    public draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, indexes: PartialMultiNoiseIndexes, isIcon: boolean){
        const elementA = this.ab_element.lookupRecursive(indexes, "A", false )

        var drawFullElementA = false

        if (elementA instanceof Biome)
            ctx.fillStyle = (elementA as Biome).color
        else if (elementA instanceof GridElementUnassigned)
            ctx.fillStyle = "gray"
        else   
            drawFullElementA = true

        if (!drawFullElementA){
            ctx.beginPath()
            ctx.moveTo(minX, minY)
            ctx.lineTo(minX + sizeX, minY)
            ctx.lineTo(minX, minY + sizeY)
            ctx.fill()

            if (elementA instanceof GridElementUnassigned){
                ctx.fillStyle = "white"
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"

                ctx.font = (sizeX*0.5) + 'px serif'
                ctx.fillText("?", minX + sizeX * 0.3, minY + sizeY * 0.4)
            }

        } else {
            elementA.getRenderer().draw(ctx, minX + sizeX * 0.1, minY + sizeY * 0.1, sizeX * 0.38, sizeY * 0.38, indexes, true)
        }

        const elementB = this.ab_element.lookupRecursive(indexes, "B", false)
        var drawFullElementB = false

        if (elementB instanceof Biome)
            ctx.fillStyle = (elementB as Biome).color
        else if (elementB instanceof GridElementUnassigned)
            ctx.fillStyle = "gray"
        else
            drawFullElementB = true

        if (!drawFullElementB){
            ctx.beginPath()
            ctx.moveTo(minX + sizeX, minY)
            ctx.lineTo(minX + sizeX, minY + sizeY)
            ctx.lineTo(minX, minY + sizeY)
            ctx.fill()

            if (elementB instanceof GridElementUnassigned){
                ctx.fillStyle = "white"
                ctx.font = (sizeX*0.5) + 'px serif'
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.fillText("?", minX + sizeX * 0.72, minY + sizeY * 0.75)
            }

        } else {
            elementB.getRenderer().draw(ctx, minX + sizeX * 0.52, minY + sizeY * 0.52, sizeX * 0.38, sizeY * 0.38, indexes, true)
        }

        ctx.strokeStyle = "black"
        ctx.lineWidth = sizeX / 30
        ctx.beginPath()
        ctx.moveTo(minX + sizeX, minY)
        ctx.lineTo(minX, minY + sizeY)
        ctx.stroke()

    }

    drawOverlay(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, indexes: PartialMultiNoiseIndexes){
        const directElementA = this.ab_element.getElement("A")
        if ((directElementA instanceof Grid) && directElementA.getType()  === this.parentType){
            ctx.fillStyle = "rgb(255,255,255,0.8)"
            ctx.beginPath()
            ctx.moveTo(minX, minY)
            ctx.lineTo(minX + sizeX, minY)
            ctx.lineTo(minX, minY + sizeY)
            ctx.fill()

            ctx.fillStyle = "rgb(0,0,0,1)"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.font = '80px serif';
            ctx.fillText(this.ab_element.getElement("A").name.charAt(0), minX + sizeX * 0.2, minY + sizeY * 0.3)
            ctx.font = '110px serif';
            ctx.fillText('↵', minX + 0.3 * sizeX, minY + 0.5 * sizeY)
        }            


        const directElementB = this.ab_element.getElement("B")
        if ((directElementB instanceof Grid) && directElementB.getType()  === this.parentType){
            ctx.fillStyle = "rgb(255,255,255,0.8)"
            ctx.beginPath()
            ctx.moveTo(minX + sizeX, minY)
            ctx.lineTo(minX + sizeX, minY + sizeY)
            ctx.lineTo(minX, minY + sizeY)
            ctx.fill()

            ctx.fillStyle = "rgb(0,0,0,1)"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.font = '80px serif';
            ctx.fillText(this.ab_element.getElement("B").name.charAt(0), minX + sizeX * 0.65, minY + sizeY * 0.7)
            ctx.font = '110px serif';
            ctx.fillText('↵', minX + 0.77 * sizeX, minY + 0.85 * sizeY)
        }        

        ctx.strokeStyle = "black"
        ctx.lineWidth = sizeX / 30
        ctx.beginPath()
        ctx.moveTo(minX + sizeX, minY)
        ctx.lineTo(minX, minY + sizeY)
        ctx.stroke()
    }
}