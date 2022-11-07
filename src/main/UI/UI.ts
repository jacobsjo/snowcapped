import { BiomeBuilder, PartialMultiNoiseIndexes } from "../BuilderData/BiomeBuilder";
import { GridEditor } from "./GridEditor";
import { BiomeGridEditor } from "./BiomeGridEditor";
import { MenuManager } from "./MenuManager";
import { SettingsManager } from "./SettingsManager";
import { SidebarManager } from "./SidebarManager";
import { SplineDisplayManager } from "./SplineDisplayManager";
import { SplineEditor } from "./SplineEditor";
import { VisualizationManger } from "./VisualizationManager";


export type Change = {
    biome?: PartialMultiNoiseIndexes,
    spline?: boolean,
    grids?: boolean,
    noises?: boolean,
    map_display?: boolean
}
export class UI {
    private static instance: UI = undefined

    static create(builder: BiomeBuilder) {
        if (UI.instance !== undefined)
            throw new Error("UI instance already exists")
        new UI(builder);
    }

    static getInstance() {
        return UI.instance;
    }

    readonly sidebarManager: SidebarManager
    readonly layoutEditor: BiomeGridEditor
    readonly splineDisplayManager: SplineDisplayManager
    readonly visualizationManager: VisualizationManger
    readonly gridEditor: GridEditor
    readonly splineEditor: SplineEditor
    readonly settingsManager: SettingsManager

    readonly builder: BiomeBuilder

    private horizonalLabel: HTMLDivElement
    private verticalLabel: HTMLDivElement

    private constructor(builder: BiomeBuilder) {
        UI.instance = this

        this.builder = builder

        this.layoutEditor = new BiomeGridEditor(builder)
        this.sidebarManager = new SidebarManager(builder)
        this.splineDisplayManager = new SplineDisplayManager(builder)
        this.visualizationManager = new VisualizationManger(builder)
        this.gridEditor = new GridEditor(builder)
        this.splineEditor = new SplineEditor(builder)
        this.settingsManager = new SettingsManager(builder)

        this.horizonalLabel = document.getElementById("horizontal_label") as HTMLDivElement
        this.verticalLabel = document.getElementById("vertical_label") as HTMLDivElement

        /*this.refresh({
            biome: {},
            spline: true,
            grids: true,
            noises: true
        })*/

        MenuManager.createClickHandlers()
    }

    refresh(change: Change) {
        console.log("Refreshing: " + JSON.stringify(change))
        this.sidebarManager.refresh()

        if (this.sidebarManager.openedElement.type === "spline") {
            this.layoutEditor.hide()
            this.gridEditor.hide()
            this.splineEditor.refresh()
        } else if (this.sidebarManager.openedElement.type === "grid") {
            this.layoutEditor.hide()
            this.gridEditor.refresh()
            this.splineEditor.hide()
        } else {
            this.gridEditor.hide()
            this.layoutEditor.refresh()
            this.splineEditor.hide()
        }


        this.splineDisplayManager.refresh()
        setTimeout(() => {
            this.visualizationManager.refresh(change)
        }, 5)

        this.settingsManager.refresh()

        MenuManager.updateTitle()
    }

    setLabels(horizontal: string, vertical: string){
        this.horizonalLabel.innerHTML = horizontal
        this.verticalLabel.innerHTML = vertical
    }
}