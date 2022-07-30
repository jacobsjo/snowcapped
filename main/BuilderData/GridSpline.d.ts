import { SimpleSpline } from "./SimpleSpline";
export declare class GridSpline {
    continentalnesses: number[];
    erosions: number[];
    splines: SimpleSpline[][];
    private undoSteps;
    constructor(continentalnesses: number[], erosions: number[], splines?: SimpleSpline[][]);
    apply(c: number, e: number, w: number): number;
    undo(): void;
    addUndoStep(): void;
    private applyErosion;
    private static interpolateZeroGrad;
    toJSON(): {
        continentalnesses: number[];
        erosions: number[];
        splines: {
            coordinate: string;
            points: {
                location: number;
                value: number;
                derivative: number;
            }[];
        }[][];
    };
    static fromJSON(json: any): GridSpline;
    exportLegacy(fixedNoises: {
        [key: string]: number;
    }): number | {
        coordinate: string;
        points: ({
            location: number;
            derivative: number;
            value: number | {
                coordinate: string;
                points: {
                    location: number;
                    value: number;
                    derivative: number;
                }[];
            };
        } | {
            location: number;
            derivative: number;
            value: {
                coordinate: string;
                points: {
                    location: number;
                    derivative: number;
                    value: number | {
                        coordinate: string;
                        points: {
                            location: number;
                            value: number;
                            derivative: number;
                        }[];
                    };
                }[];
            };
        })[];
    };
    export(): {
        coordinate: string;
        points: {
            location: number;
            derivative: number;
            value: {
                coordinate: string;
                points: {
                    location: number;
                    derivative: number;
                    value: {
                        coordinate: string;
                        points: {
                            location: number;
                            value: number;
                            derivative: number;
                        }[];
                    };
                }[];
            };
        }[];
    };
    static fromMinecraftJSON(json: any): GridSpline;
    private interpolateSplinesZeroGrad;
    getErosionInterpolatedSpline(c_id: number, e_id: number): SimpleSpline;
    createSpline(c_id: number, e_id: number): void;
}
//# sourceMappingURL=GridSpline.d.ts.map