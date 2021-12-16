import { IS_EXPERIMENTAL } from "../../SharedConstants"

export class DataFixer {
    public static fixJSON(json: any): any {
        json.version = json.version ?? 0

        // update from version 0 to version 1
        if (json.version === 0) {

            const array: string[][] = []
            const modes: string[] = []
            for (var w_idx = 0; w_idx < json.weirdnesses.length; w_idx++) {
                array[w_idx] = []
                modes[w_idx] = json.weirdnesses[w_idx][3]
                for (var d_idx = 0; d_idx < 5; d_idx++) {
                    if (d_idx === 0 || d_idx === 4)
                        array[w_idx][d_idx] = json.weirdnesses[w_idx][2]
                    else
                        array[w_idx][d_idx] = "unassigned"
                }
            }

            json.dimension = {
                "key": "dimension",
                "name": "Biomes",
                "array": array
            }

            json.modes = modes

            json.continentalnesses = json.continentalnesses.map((c: any) => c[1])
            json.weirdnesses = json.weirdnesses.map((c: any) => c[1])
            json.erosions = json.erosions.map((c: any) => c[1])
            json.temperatures = json.temperatures.map((c: any) => c[1])
            json.humidities = json.humidities.map((c: any) => c[1])
            json.depths = [
                { min: -0.2, max: 0 },
                { min: 0, max: 0.2 },
                { min: 0.2, max: 0.8 },
                { min: 0.8, max: 1 },
                { min: 1, max: 1.2 }
            ]
            json.version = 1
        }

        if (json.version === 1){
            json.dimension.array = json.dimension.array[0].map((_: any, colIndex: any) => json.dimension.array.map((row : any) => row[colIndex]));
            json.version = 2
            json.is_experimental_upgraded = IS_EXPERIMENTAL
        }

        if (json.version === 2){
            json.exportDimension = true
            json.exportNoises = true
            json.exportSplines = true
            json.noiseSettingsName = "minecraft:overworld"
            json.version = 3
        }

        return json
    }
}