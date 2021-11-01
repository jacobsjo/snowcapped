import { BiomeBuilder } from "../BuilderData/BiomeBuilder";
import { SimpleSpline } from "../BuilderData/SimpleSpline";
import { AssignSlicesManager } from "./AssignSlicesManager";
import { GridEditor } from "./GridEditor";
import { LayoutEditor } from "./LayoutEditor";
import { MenuManager } from "./MenuManager";
import { SettingsManager } from "./SettingsManager";
import { SidebarManager } from "./SidebarManager";
import { SplineDisplayManager } from "./SplineDisplayManager";
import { SplineEditor } from "./SplineEditor";
import { VisualizationManger } from "./VisualizationManager";



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
    readonly layoutEditor: LayoutEditor
    readonly assignSlicesEditor: AssignSlicesManager
    readonly splineDisplayManager: SplineDisplayManager
    readonly visualizationManager: VisualizationManger
    readonly gridEditor: GridEditor
    readonly splineEditor: SplineEditor
    readonly settingsManager: SettingsManager

    readonly builder: BiomeBuilder

    private constructor(builder: BiomeBuilder) {
        UI.instance = this

        this.builder = builder

        this.layoutEditor = new LayoutEditor(builder)
        this.sidebarManager = new SidebarManager(builder)
        this.assignSlicesEditor = new AssignSlicesManager(builder)
        this.splineDisplayManager = new SplineDisplayManager(builder)
        this.visualizationManager = new VisualizationManger(builder)
        this.gridEditor = new GridEditor(builder)
        this.splineEditor = new SplineEditor(builder)
        this.settingsManager = new SettingsManager(builder)

        this.refresh()

        MenuManager.createClickHandlers()
    }

    refresh() {
        this.sidebarManager.refresh()

        if (this.sidebarManager.openedElement.type === "assign_slices") {
            this.layoutEditor.hide()
            this.gridEditor.hide()
            this.assignSlicesEditor.refresh()
            this.splineEditor.hide()
        } else if (this.sidebarManager.openedElement.type === "spline") {
            this.assignSlicesEditor.hide()
            this.layoutEditor.hide()
            this.gridEditor.hide()
            this.splineEditor.refresh()
        } else if (this.sidebarManager.openedElement.type === "grid") {
            this.assignSlicesEditor.hide()
            this.layoutEditor.hide()
            this.gridEditor.refresh()
            this.splineEditor.hide()
        } else {
            this.assignSlicesEditor.hide()
            this.gridEditor.hide()
            this.layoutEditor.refresh()
            this.splineEditor.hide()
        }


        this.splineDisplayManager.refresh()
        setTimeout(() => {
            this.visualizationManager.refresh()
        }, 5)

        this.settingsManager.refresh()
    }
}