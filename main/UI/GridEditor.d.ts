import { BiomeBuilder } from "../BuilderData/BiomeBuilder";
export declare class GridEditor {
    private builder;
    private title;
    private canvas;
    private splitIcon;
    private xs;
    private ys;
    private double_ys;
    private x_param;
    private y_param;
    private x_array;
    private y_array;
    private hoverHandle;
    constructor(builder: BiomeBuilder);
    private snap;
    private getHandle;
    private drawRect;
    getMousePosition(evt: MouseEvent): {
        mouse_x: number;
        mouse_y: number;
    };
    refresh(): void;
    hide(): void;
}
//# sourceMappingURL=GridEditor.d.ts.map