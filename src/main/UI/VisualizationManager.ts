import * as L from "leaflet";
import { BiomeBuilder } from "../BuilderData/BiomeBuilder";
import { LayoutElementUnassigned } from "../BuilderData/LayoutElementUnassigned";
import { BiomeLayer } from "../Visualization/BiomeLayer";
import { GridMultiNoise } from "../Visualization/GridMultiNoise";
import { GridMultiNoiseIndicesManager } from "../Visualization/GridMultiNoiseIndicesManager";
import { MenuManager } from "./MenuManager";
import { UI } from "./UI";


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
    private biomeLayer: BiomeLayer
    private indicesManger: GridMultiNoiseIndicesManager

    private closeContainer: HTMLElement

    constructor(builder: BiomeBuilder){
        this.builder = builder

        this.closeContainer = document.getElementById('visualization').parentElement.parentElement;
        (this.closeContainer as any).onopenchange = () => {
          this.biomeLayer.redraw()
        }

        this.biomeSource = new GridMultiNoise(BigInt("0"), builder, noises.temperature, noises.humidity, noises.continentalness, noises.erosion, noises.weirdness, noises.shift)

        this.map = L.map('visualization_map')
        this.map.setView([0,0], 15)
        this.map.setMaxZoom(18)
        this.map.setMinZoom(13)

        this.indicesManger = new GridMultiNoiseIndicesManager(this.builder, this.biomeSource)

        this.biomeLayer = new BiomeLayer(this.builder, this.indicesManger);
        this.biomeLayer.addTo(this.map)

        const tooltip = document.getElementById("visualizationTooltip")
        const tooltip_slice = tooltip.getElementsByClassName("slice")[0] as HTMLElement
        const tooltip_mode = tooltip.getElementsByClassName("mode")[0] as HTMLImageElement
        const tooltip_layout = tooltip.getElementsByClassName("layout")[0] as HTMLElement
        const tooltip_biome = tooltip.getElementsByClassName("biome")[0] as HTMLElement

        this.map.addEventListener("click", (evt: L.LeafletMouseEvent) => {
          const idxs = this.getIdxs(evt.latlng)
          const lookup = this.builder.lookup(idxs)

          if (lookup.slice === undefined || lookup.slice instanceof LayoutElementUnassigned)
            return

          if (lookup.layout !== undefined && evt.originalEvent.ctrlKey){
            UI.getInstance().openElement = lookup.layout.getKey()
            UI.getInstance().layoutEditor.highlight(idxs.t_idx, idxs.h_idx)
            UI.getInstance().refresh()
          } else{
            UI.getInstance().openElement = lookup.slice.getKey()
            UI.getInstance().layoutEditor.highlight(idxs.c_idx, idxs.e_idx)
            UI.getInstance().refresh()
          }
        })

        this.map.addEventListener("mousemove", (evt: L.LeafletMouseEvent) => {
          const lookup =  this.builder.lookup(this.getIdxs(evt.latlng))

          tooltip.style.left = (Math.min(evt.originalEvent.pageX + 20, document.body.clientWidth - tooltip.clientWidth)) + "px"
          tooltip.style.top = (evt.originalEvent.pageY + 15) + "px"
          tooltip.classList.remove("hidden")

          tooltip_mode.src = "mode_" + lookup?.mode + ".png"

          tooltip_slice.innerHTML = "&crarr; " + lookup?.slice?.name + " (Slice)"
          tooltip_layout.innerHTML = "&crarr; " + lookup?.layout?.name + " (Layout)"
          tooltip_biome.innerHTML = lookup?.biome?.name

          tooltip_mode.classList.toggle("hidden", lookup?.mode === undefined)
          tooltip_slice.parentElement.classList.toggle("hidden", lookup?.slice === undefined || lookup.slice instanceof LayoutElementUnassigned)
          tooltip_layout.parentElement.classList.toggle("hidden", lookup?.layout === undefined || lookup.layout instanceof LayoutElementUnassigned)
          tooltip_biome.parentElement.classList.toggle("hidden", lookup?.biome === undefined || lookup.biome instanceof LayoutElementUnassigned)

          MenuManager.toggleAction("open-slice", lookup.slice !== undefined && !(lookup.slice instanceof LayoutElementUnassigned))
          MenuManager.toggleAction("open-layout", lookup.layout !== undefined)
        })

        this.map.addEventListener("mouseout", (evt: L.LeafletMouseEvent) => {
          tooltip.classList.add("hidden")
          MenuManager.toggleAction("open-slice", false)
          MenuManager.toggleAction("open-layout", false)
        })
    }

    private getIdxs(latlng: L.LatLng){
      var tileSize = new L.Point(256, 256)
      var pixelPoint = this.map.project(latlng, this.map.getZoom())
      var pos = pixelPoint.unscaleBy(tileSize) 

      var coords = pos.floor() as L.Coords
      coords.z = this.map.getZoom()
      const values = this.indicesManger.get(coords)

      var pixel = new L.Point(pos.x % 1, pos.y % 1).scaleBy(tileSize).divideBy(this.indicesManger.resolution).round()

      if (values instanceof Promise)
        return

      return values[pixel.x][pixel.y]
    }

    invalidateIndices(){
      this.indicesManger.invalidateIndices()
    }

    async refresh(){
      if (!this.closeContainer.classList.contains("closed"))
        this.biomeLayer.redraw()
    }
}