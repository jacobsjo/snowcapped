import { BiomeBuilder, PartialMultiNoiseIndexes } from "../BuilderData/BiomeBuilder";
import { GridEditor } from "./GridEditor";
import { BiomeGridEditor } from "./BiomeGridEditor";
import { SettingsManager } from "./SettingsManager";
import { SidebarManager } from "./SidebarManager";
import { SplineDisplayManager } from "./SplineDisplayManager";
import { SplineEditor } from "./SplineEditor";
import { VisualizationManger } from "./VisualizationManager";
export declare type Change = {
    biome?: PartialMultiNoiseIndexes;
    spline?: boolean;
    grids?: boolean;
    noises?: boolean;
};
export declare class UI {
    private static instance;
    static create(builder: BiomeBuilder): void;
    static getInstance(): UI;
    readonly sidebarManager: SidebarManager;
    readonly layoutEditor: BiomeGridEditor;
    readonly splineDisplayManager: SplineDisplayManager;
    readonly visualizationManager: VisualizationManger;
    readonly gridEditor: GridEditor;
    readonly splineEditor: SplineEditor;
    readonly settingsManager: SettingsManager;
    readonly builder: BiomeBuilder;
    private horizonalLabel;
    private verticalLabel;
    private constructor();
    refresh(change: Change): void;
    setLabels(horizontal: string, vertical: string): void;
}
//# sourceMappingURL=UI.d.ts.map