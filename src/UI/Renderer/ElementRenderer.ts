import { ABElement } from "../../BuilderData/ABBiome";
import { Biome } from "../../BuilderData/Biome";
import { Layout } from "../../BuilderData/Layout";
import { LayoutElementUnassigned } from "../../BuilderData/LayoutElementUnassigned";


export interface ElementRenderer{
    draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, t_idx: number, h_idx: number, indicateRecursive: boolean, isIcon: boolean): void;
}

export class BiomeRenderer implements ElementRenderer{
    biome: Biome

    constructor(biome: Biome){
        this.biome = biome
    }

    public draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, t_idx: number, h_idx: number, indicateRecursive: boolean = true, isIcon: boolean = false){
        ctx.fillStyle = this.biome.color()
        ctx.fillRect(minX, minY, sizeX, sizeY)
    }
}

export class UnassignedRenderer implements ElementRenderer{
    public draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, t_idx: number, h_idx: number, indicateRecursive: boolean = true, isIcon: boolean = false){
        ctx.fillStyle = "gray"
        ctx.fillRect(minX, minY, sizeX, sizeY)

        ctx.fillStyle = "white"
        ctx.font = (sizeX*0.75) + 'px serif'
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("?", minX + sizeX * 0.5, minY + sizeY * 0.55)
    }
}


export class ABBiomeRenderer implements ElementRenderer{
    ab_biome: ABElement

    constructor(ab_biome: ABElement){
        this.ab_biome = ab_biome
    }

    public draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, t_idx: number, h_idx: number, indicateRecursive: boolean = true, isIcon: boolean = false){
        const isARecursive = this.ab_biome.elementA instanceof Layout
        const isBRecursive = this.ab_biome.elementB instanceof Layout

        const elementA = this.ab_biome.lookupRecursive(t_idx, h_idx, "A")

        if (elementA instanceof Biome)
            ctx.fillStyle = (elementA as Biome).color()
        else if (elementA instanceof LayoutElementUnassigned)
            ctx.fillStyle = "gray"

        ctx.beginPath()
        ctx.moveTo(minX, minY)
        ctx.lineTo(minX + sizeX, minY)
        ctx.lineTo(minX, minY + sizeY)
        ctx.fill()

        if (elementA instanceof LayoutElementUnassigned){
            ctx.fillStyle = "white"
            ctx.font = (sizeX*0.5) + 'px serif'
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText("?", minX + sizeX * 0.3, minY + sizeY * 0.4)
        }

        if (indicateRecursive && isARecursive){
            ctx.fillStyle = "rgb(255,255,255,0.8)"
            ctx.beginPath()
            ctx.moveTo(minX, minY)
            ctx.lineTo(minX + sizeX, minY)
            ctx.lineTo(minX, minY + sizeY)
            ctx.fill()

            if (!isIcon){
                ctx.fillStyle = "rgb(0,0,0,1)"
                ctx.font = '45px serif';
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.fillText('↵', minX + 0.25 * sizeX, minY + 0.33 * sizeY)
            }
        }

        const elementB = this.ab_biome.lookupRecursive(t_idx, h_idx, "B")

        if (elementB instanceof Biome)
            ctx.fillStyle = (elementB as Biome).color()
        else if (elementB instanceof LayoutElementUnassigned)
            ctx.fillStyle = "gray"
        ctx.beginPath()
        ctx.moveTo(minX + sizeX, minY)
        ctx.lineTo(minX + sizeX, minY + sizeY)
        ctx.lineTo(minX, minY + sizeY)
        ctx.fill()

        if (elementB instanceof LayoutElementUnassigned){
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

            if (!isIcon){
                ctx.fillStyle = "rgb(0,0,0,1)"
                ctx.font = '45px serif';
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.fillText('↵', minX + 0.72 * sizeX, minY + 0.8 * sizeY)
            }
        }

        ctx.strokeStyle = "black"
        ctx.lineWidth = sizeX / 30
        ctx.beginPath()
        ctx.moveTo(minX + sizeX, minY)
        ctx.lineTo(minX, minY + sizeY)
        ctx.stroke()

    }
}