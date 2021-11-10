import { DATA_VERSION } from "../app"



export class DataFixer {
    public static fixJSON(json: any): any {
        const json_version = json.version ?? 0

        // update from version 0 to version 1
        if (json_version === 0) {

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
                "name": "Dimension",
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

        return json
    }
}