export declare class SimpleSpline {
    points: {
        location: number;
        value: number;
        derivative_left: number;
        derivative_right: number;
    }[];
    constructor(points: {
        location: number;
        value: number;
        derivative_left: number;
        derivative_right: number;
    }[]);
    toJSON(coordinate: string): {
        coordinate: string;
        points: {
            location: number;
            value: number;
            derivative: number;
        }[];
    };
    static fromJSON(json: any): SimpleSpline;
    static peaksAndValleys(weirdness: number): number;
    private static inversPeaksAndValleys;
    order(): void;
    apply(c: number): number;
    derivative(c: number, direction?: "left" | "right"): number;
}
//# sourceMappingURL=SimpleSpline.d.ts.map