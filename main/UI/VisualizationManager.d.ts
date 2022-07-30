import { BiomeBuilder } from "../BuilderData/BiomeBuilder";
import { Change } from "./UI";
export declare class VisualizationManger {
    builder: BiomeBuilder;
    private map;
    private biomeLayer;
    private closeContainer;
    enable_isolines: boolean;
    enable_hillshading: boolean;
    constructor(builder: BiomeBuilder);
    private getIdxs;
    refresh(change: Change): Promise<void>;
}
//# sourceMappingURL=VisualizationManager.d.ts.map