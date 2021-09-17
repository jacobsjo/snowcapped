import { BiomeBuilder } from "../BuilderData/BiomeBuilder";
import { AssignSlicesManager } from "./AssignSlicesManager";
import { LayoutEditor } from "./LayoutEditor";
import { MenuManager } from "./MenuManager";
import { SidebarManager } from "./SidebarManager";



export class UI{
    private static instance: UI = undefined

    static create(builder: BiomeBuilder){
        if (UI.instance !== undefined)
            throw new Error("UI instance already exists")
        new UI(builder);
    }

    static getInstance(){
        return UI.instance;
    }

    readonly sidebarManager: SidebarManager
    readonly layoutEditor: LayoutEditor
    readonly assignSlicesEditor: AssignSlicesManager

    readonly builder: BiomeBuilder

    public selectedElement: string = ""
    public openElement: string

    private constructor(builder: BiomeBuilder){
        UI.instance = this

        this.openElement = "assign_slices"
        this.builder = builder

        this.layoutEditor = new LayoutEditor(builder)
        this.sidebarManager = new SidebarManager(builder)
        this.assignSlicesEditor = new AssignSlicesManager(builder)

        this.refresh()

        MenuManager.createClickHandlers()
    }

    refresh(){
        this.sidebarManager.refresh()

        console.log(this.openElement)

        if (this.openElement === "assign_slices"){
            this.layoutEditor.hide()
            this.assignSlicesEditor.refresh()
        } else {
            this.assignSlicesEditor.hide()
            this.layoutEditor.refresh()
        }
    }
}