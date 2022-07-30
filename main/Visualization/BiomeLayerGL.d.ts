import { NormalNoise } from "deepslate";
import * as L from "leaflet";
import { MultiNoiseIndexes, MultiNoiseParameters, PartialMultiNoiseIndexes } from "../BuilderData/BiomeBuilder";
import { Change } from "../UI/UI";
import { VisualizationManger } from "../UI/VisualizationManager";
export declare class BiomeLayerGL extends L.GridLayer {
    private visualization_manager;
    private renderer;
    private glError;
    private gl;
    private timer_query_ext;
    private timer_query;
    private parameterArray;
    private parameterTexture;
    private biomeArray;
    private biomeTextureSize;
    private splinesArray;
    private splinesTexture;
    private biomeTexture;
    private glProgram;
    private CRSBuffer;
    private Tiles;
    private tileSize;
    private resolution;
    private builder;
    private isCompiled;
    private uniformLocations;
    normalnoises: {
        temperature: NormalNoise;
        humidity: NormalNoise;
        continentalness: NormalNoise;
        erosion: NormalNoise;
        weirdness: NormalNoise;
        shift: NormalNoise;
    };
    private renderingQueue;
    private isRendering;
    constructor(visualization_manager: VisualizationManger, options?: L.GridLayerOptions);
    static initPromise: Promise<{
        renderer: HTMLCanvasElement;
        gl: WebGL2RenderingContext;
        glProgram: WebGLProgram;
    }>;
    static preInitalize(allow_sync: boolean): void;
    initialize(options: any): void;
    getGlError(): String | undefined;
    private updateResolution;
    private loadGLProgram;
    getIdxs(latlng: L.LatLng): {
        idx: MultiNoiseIndexes;
        values: MultiNoiseParameters;
        position: {
            x: number;
            z: number;
        };
    };
    render(coords: L.Coords): void;
    bindParametersTexture(change: Change): void;
    fillParameterArray(change: Change): void;
    bindBiomeTexture(change: Change): void;
    fillBiomeArray(limit: PartialMultiNoiseIndexes): void;
    bindSplinesTexture(): void;
    fillSplinesArray(): void;
    createTile(coords: L.Coords, done: L.DoneCallback): HTMLCanvasElement;
    _removeTile(key: string): void;
    reRender(change: Change): void;
    addRenderingTask(key: string, callback: () => void): void;
    private gpu_timer_results;
    doNextRenderingTask(): void;
}
//# sourceMappingURL=BiomeLayerGL.d.ts.map