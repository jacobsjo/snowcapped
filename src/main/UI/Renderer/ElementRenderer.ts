import { ABElement } from "../../BuilderData/ABBiome";
import { Biome } from "../../BuilderData/Biome";
import { GridElementUnassigned } from "../../BuilderData/GridElementUnassigned";
import { PartialMultiNoiseIndexes } from "../../BuilderData/BiomeBuilder";
import { Grid } from "../../BuilderData/Grid";

export interface GridElementRenderer{
    draw(ctx: CanvasRenderingContext2D, minX: number, minY: number, sizeX: number, sizeY: number, indexes: PartialMultiNoiseIndexes, isIcon: boolean): void;
    setHighlight(x_idx: number, y_idx: number): void;
}