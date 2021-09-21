import * as L from "leaflet";
import { BiomeBuilder } from "../BuilderData/BiomeBuilder";
import { BiomeLayer } from "../Visualization/BiomeLayer";
import { GridMultiNoise } from "../Visualization/GridMultiNoise";


const noises = {
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
    "firstOctave": -9,
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
    "firstOctave": -7,
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


export class VisualizationManger{
    builder: BiomeBuilder
    private map: L.Map
    private biomeSource: GridMultiNoise

    constructor(builder: BiomeBuilder){
        this.builder = builder

        this.biomeSource = new GridMultiNoise(BigInt("0"), builder, noises.temperature, noises.humidity, noises.continentalness, noises.erosion, noises.weirdness, noises.shift)
    }

    async refresh(){
        const center = this.map?.getCenter()
        const zoom = this.map?.getZoom()
        this.map?.remove()

        this.map = L.map('visualization_map')
        this.map.setView(center ?? [0,0], zoom ?? 13)

        const biomeLayer = new BiomeLayer(this.builder, this.biomeSource);
        biomeLayer.addTo(this.map)
    }
}