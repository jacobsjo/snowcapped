import { ABElement } from "../../BuilderData/ABBiome";
import { Biome } from "../../BuilderData/Biome";


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

export class ABBiomeRenderer implements ElementRenderer{
    ab_biome: ABElement

    constructor(ab_biome: ABElement){
        this.ab_biome = ab_biome
    }

    public draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, t_idx: number, h_idx: number, indicateRecursive: boolean = true, isIcon: boolean = false){
        const isARecursive = !(this.ab_biome.elementA instanceof Biome)
        const isBRecursive = !(this.ab_biome.elementB instanceof Biome)

        ctx.fillStyle = (this.ab_biome.getRecursive(t_idx, h_idx, "A") as Biome).color()
        ctx.beginPath()
        ctx.moveTo(minX, minY)
        ctx.lineTo(minX + sizeX, minY)
        ctx.lineTo(minX, minY + sizeY)
        ctx.fill()

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

        ctx.fillStyle = (this.ab_biome.getRecursive(t_idx, h_idx, "B") as Biome).color()
        ctx.beginPath()
        ctx.moveTo(minX + sizeX, minY)
        ctx.lineTo(minX + sizeX, minY + sizeY)
        ctx.lineTo(minX, minY + sizeY)
        ctx.fill()

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