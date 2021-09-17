import { BiomeBuilder } from "../BuilderData/BiomeBuilder";
import { LayoutEditor } from "./LayoutEditor";
import { SidebarManager } from "./SidebarManager";



export class UI{
    private static instance: UI = undefined

    static create(builder: BiomeBuilder, openElement: string){
        if (UI.instance !== undefined)
            throw new Error("UI instance already exists")
        new UI(builder, openElement);
    }

    static getInstance(){
        return UI.instance;
    }

    readonly sidebarManager: SidebarManager
    readonly layoutEditor: LayoutEditor

    readonly builder: BiomeBuilder

    public selectedElement: string = ""
    public openElement: string

    private constructor(builder: BiomeBuilder, openElement: string){
        UI.instance = this

        this.openElement = openElement

        this.layoutEditor = new LayoutEditor(builder)
        this.layoutEditor.refresh()

        this.sidebarManager = new SidebarManager(builder)
        this.sidebarManager.refresh()
    }

    refresh(){
        this.sidebarManager.refresh()
        this.layoutEditor.refresh()
    }
}