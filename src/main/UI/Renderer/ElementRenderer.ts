import { ABElement } from "../../BuilderData/ABBiome";
import { Biome } from "../../BuilderData/Biome";
import { Layout } from "../../BuilderData/Layout";
import { GridElementUnassigned } from "../../BuilderData/GridElementUnassigned";
import { PartialMultiNoiseIndexes } from "../../BuilderData/BiomeBuilder";


export interface GridElementRenderer{
    draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, indexes: PartialMultiNoiseIndexes , indicateRecursive: boolean, isIcon: boolean, gradGridWithBorder: boolean): void;
    setHighlight(x_idx: number, y_idx: number): void;
}

export class BiomeRenderer implements GridElementRenderer{
    biome: Biome

    constructor(biome: Biome){
        this.biome = biome
    }
    setHighlight(x_idx: number, y_idx: number): void {
    }

    public draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, indexes: PartialMultiNoiseIndexes , indicateRecursive: boolean, isIcon: boolean, gradGridWithBorder: boolean){
        ctx.fillStyle = this.biome.color
        ctx.fillRect(minX, minY, sizeX, sizeY)
    }

    public getIdsFromPosition(minX: number, minY: number, sizeX: number, sizeY: number, x: number, y: number): {t_idx: number, h_idx: number, mode: "A"|"B"} | undefined{
        return {t_idx: -1, h_idx: -1, mode:"A"}
    }
}

export class UnassignedRenderer implements GridElementRenderer{
    setHighlight(x_idx: number, y_idx: number): void {
    }

    public draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, indexes: PartialMultiNoiseIndexes , indicateRecursive: boolean, isIcon: boolean, gradGridWithBorder: boolean){
        ctx.fillStyle = "gray"
        ctx.fillRect(minX, minY, sizeX, sizeY)

        ctx.fillStyle = "white"
        ctx.font = (sizeX*0.75) + 'px serif'
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("?", minX + sizeX * 0.5, minY + sizeY * 0.55)
    }
}


export class ABBiomeRenderer implements GridElementRenderer{
    ab_biome: ABElement

    constructor(ab_biome: ABElement){
        this.ab_biome = ab_biome
    }
    setHighlight(x_idx: number, y_idx: number): void {
    }

    public draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, indexes: PartialMultiNoiseIndexes , indicateRecursive: boolean, isIcon: boolean, gradGridWithBorder: boolean){
        const isARecursive = !(this.ab_biome.getElement("A") instanceof Biome)
        const isBRecursive = !(this.ab_biome.getElement("B") instanceof Biome)

        const elementA = this.ab_biome.lookupRecursive(indexes, "A", false )

        if (elementA instanceof Biome)
            ctx.fillStyle = (elementA as Biome).color
        else if (elementA instanceof GridElementUnassigned)
            ctx.fillStyle = "gray"

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

        if (indicateRecursive && isARecursive){
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
            ctx.fillText(this.ab_biome.getElement("A").name.charAt(0), minX + sizeX * 0.2, minY + sizeY * 0.3)
            ctx.font = '110px serif';
            ctx.fillText('↵', minX + 0.3 * sizeX, minY + 0.5 * sizeY)
        }

        const elementB = this.ab_biome.lookupRecursive(indexes, "B", false)

        if (elementB instanceof Biome)
            ctx.fillStyle = (elementB as Biome).color
        else if (elementB instanceof GridElementUnassigned)
            ctx.fillStyle = "gray"
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

        if (indicateRecursive && isBRecursive){
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
            ctx.fillText(this.ab_biome.getElement("B").name.charAt(0), minX + sizeX * 0.65, minY + sizeY * 0.7)
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