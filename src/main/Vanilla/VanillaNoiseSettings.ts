import * as _ from 'lodash';
import { NoiseSetting } from "../BuilderData/BiomeBuilder";



export class VanillaNoiseSettings {
    private static defaultSetting: {
        "continentalness": NoiseSetting,
        "erosion": NoiseSetting,
        "weirdness": NoiseSetting,
        "humidity": NoiseSetting,
        "temperature": NoiseSetting,
        "shift": NoiseSetting
    } = {
            "erosion": {
                "firstOctave": -9,
                "amplitudes": [
                    1.0,
                    1.0,
                    0.0,
                    1.0,
                    1.0
                ]
            },
            "weirdness": {
                "firstOctave": -7,
                "amplitudes": [
                    1.0,
                    2.0,
                    1.0,
                    0.0,
                    0.0,
                    0.0
                ]
            },
            "shift": {
                "firstOctave": -3,
                "amplitudes": [
                    1.0,
                    1.0,
                    1.0,
                    0.0
                ]
            },
            "temperature": {
                "firstOctave": -10,
                "amplitudes": [
                    1.5,
                    0.0,
                    1.0,
                    0.0,
                    0.0,
                    0.0
                ]
            },
            "humidity": {
                "firstOctave": -8,
                "amplitudes": [
                    1.0,
                    1.0,
                    0.0,
                    0.0,
                    0.0,
                    0.0
                ]
            },
            "continentalness": {
                "firstOctave": -9,
                "amplitudes": [
                    1.0,
                    1.0,
                    2.0,
                    2.0,
                    2.0,
                    1.0,
                    1.0,
                    1.0,
                    1.0
                ]
            }
        }

    public static default(){
        return _.cloneDeep(this.defaultSetting)
    }
}