import { lerp2, TerrainShaper } from "deepslate";
import * as L from "leaflet";
import { last } from "lodash";
import { BiomeBuilder } from "../BuilderData/BiomeBuilder";
import { LayoutElementUnassigned } from "../BuilderData/LayoutElementUnassigned";
import { BiomeLayer } from "../Visualization/BiomeLayer";
import { ContourLayer } from "../Visualization/ContourLayer";
import { GridMultiNoise } from "../Visualization/GridMultiNoise";
import { GridMultiNoiseIndicesManager } from "../Visualization/GridMultiNoiseIndicesManager";
import { MenuManager } from "./MenuManager";
import { UI } from "./UI";

export class VisualizationManger{
    builder: BiomeBuilder
    private map: L.Map
    private biomeSource: GridMultiNoise
    private biomeLayer: BiomeLayer
    private contourLayer: ContourLayer

    private indicesManger: GridMultiNoiseIndicesManager

    private closeContainer: HTMLElement
    private toggleIsolinesButton: HTMLElement

    constructor(builder: BiomeBuilder){
        this.builder = builder

        this.closeContainer = document.getElementById('visualization').parentElement.parentElement;
        (this.closeContainer as any).onopenchange = () => {
          this.biomeLayer.redraw()
        }


        this.biomeSource = new GridMultiNoise(BigInt("0"), builder)

        this.map = L.map('visualization_map')
        this.map.setView([0,0], 15)
        this.map.setMaxZoom(18)
        this.map.setMinZoom(13)

        this.indicesManger = new GridMultiNoiseIndicesManager(this.builder, this.biomeSource)

        this.updateNoises()

        this.biomeLayer = new BiomeLayer(this.builder, this.indicesManger);
        this.biomeLayer.addTo(this.map)

        this.contourLayer = new ContourLayer(this.builder, this.indicesManger);
        //this.contourLayer.addTo(this.map)

        this.toggleIsolinesButton = document.getElementById('toggleIsolinesButton')

        this.toggleIsolinesButton.onclick = (evt: MouseEvent) => {
          if (this.map.hasLayer(this.contourLayer)){
            this.map.removeLayer(this.contourLayer)
            this.toggleIsolinesButton.classList.remove("enabled")
          } else {
            this.map.addLayer(this.contourLayer)
            this.toggleIsolinesButton.classList.add("enabled")
          }
        }


        const tooltip = document.getElementById("visualizationTooltip")
        const tooltip_position = tooltip.getElementsByClassName("position")[0] as HTMLElement
        const tooltip_noise_values = tooltip.getElementsByClassName("noise_values")[0] as HTMLElement
        const tooltip_slice = tooltip.getElementsByClassName("slice")[0] as HTMLElement
        const tooltip_mode = tooltip.getElementsByClassName("mode")[0] as HTMLImageElement
        const tooltip_layout = tooltip.getElementsByClassName("layout")[0] as HTMLElement
        const tooltip_biome = tooltip.getElementsByClassName("biome")[0] as HTMLElement

        let lastPos: L.Point;
        let lastY: number;

        this.map.addEventListener("click", (evt: L.LeafletMouseEvent) => {
          const idxs = this.getIdxs(evt.latlng)
          const lookup = this.builder.lookup(idxs.idx)

          if (lookup.slice === undefined || lookup.slice instanceof LayoutElementUnassigned)
            return

          if (lookup.layout !== undefined && (evt.originalEvent.ctrlKey || evt.originalEvent.metaKey)){
            UI.getInstance().sidebarManager.openElement({type:"layout", key:lookup.layout.getKey()})
            UI.getInstance().layoutEditor.highlight(idxs.idx.t_idx, idxs.idx.h_idx)
            UI.getInstance().refresh()
          } else{
            UI.getInstance().sidebarManager.openElement({type:"slice", key:lookup.slice.getKey()})
            UI.getInstance().layoutEditor.highlight(idxs.idx.c_idx, idxs.idx.e_idx)
            UI.getInstance().refresh()
          }
        })

        this.map.addEventListener("mousemove", (evt: L.LeafletMouseEvent) => {
          const idxs = this.getIdxs(evt.latlng);
          const lookup = idxs ? this.builder.lookup(idxs.idx) : undefined

          tooltip.style.left = (Math.min(evt.originalEvent.pageX + 20, document.body.clientWidth - tooltip.clientWidth)) + "px"
          tooltip.style.top = (evt.originalEvent.pageY + 15) + "px"
          tooltip.classList.remove("hidden")

          if (lookup) 
            tooltip_mode.src = "mode_" + lookup?.mode + ".png"

          const pos = this.getPos(evt.latlng);
          const y = idxs ? (builder.splines.offset.apply(idxs.values.continentalness, idxs.values.erosion, idxs.values.weirdness) * 128 + 64) : undefined
          tooltip_position.innerHTML = "X: " + pos.x.toFixed(0) + ", Z: " + pos.y.toFixed(0) + (y?(" -> Y: " + y.toFixed(0)):"")
          tooltip_noise_values.innerHTML = "C: " + idxs.values.continentalness.toFixed(2) + ", E: " + idxs.values.erosion.toFixed(2) + ", W: " + 
                    idxs.values.weirdness.toFixed(2) + "<br /> T: " + idxs.values.temperature.toFixed(2) + ", H: " + idxs.values.humidity.toFixed(2)
          tooltip_slice.innerHTML = "&crarr; " + lookup?.slice?.name + " (Slice)"
          tooltip_layout.innerHTML = "&crarr; " + lookup?.layout?.name + " (Layout)"
          tooltip_biome.innerHTML = lookup?.biome?.name

          //tooltip_position.classList.toggle("hidden", idxs === undefined)
          tooltip_mode.classList.toggle("hidden", lookup?.mode === undefined)
          tooltip_slice.parentElement.classList.toggle("hidden", lookup?.slice === undefined || lookup.slice instanceof LayoutElementUnassigned)
          tooltip_layout.parentElement.classList.toggle("hidden", lookup?.layout === undefined || lookup.layout instanceof LayoutElementUnassigned)
          tooltip_biome.parentElement.classList.toggle("hidden", lookup?.biome === undefined || lookup.biome instanceof LayoutElementUnassigned)

          if (idxs){
            UI.getInstance().splineDisplayManager.setPos({c: idxs.values.continentalness, e: idxs.values.erosion, w: idxs.values.weirdness})
            UI.getInstance().splineDisplayManager.refresh()
          }

          MenuManager.toggleAction("open-slice", lookup?.slice !== undefined && !(lookup?.slice instanceof LayoutElementUnassigned))
          MenuManager.toggleAction("open-layout", lookup?.layout !== undefined)
          MenuManager.toggleAction("copy", true)

          lastPos = pos
          lastY = y
        })

        this.map.addEventListener("mouseout", (evt: L.LeafletMouseEvent) => {
          tooltip.classList.add("hidden")
          UI.getInstance().splineDisplayManager.setPos(undefined)
          UI.getInstance().splineDisplayManager.refresh()
          MenuManager.toggleAction("open-slice", false)
          MenuManager.toggleAction("open-layout", false)
          MenuManager.toggleAction("copy", false)
        })

        this.map.addEventListener("keydown", (evt: L.LeafletKeyboardEvent) => {
          if (evt.originalEvent.key === "c" && (evt.originalEvent.ctrlKey || evt.originalEvent.metaKey)){
            navigator.clipboard.writeText("/execute in " + builder.dimensionName + " run tp @s " + lastPos.x.toFixed(0) + " " + (lastY + 10).toFixed(0) + " " + lastPos.y.toFixed(0))
          }
        })
    }

    private getPos(latlng: L.LatLng){
      var tileSize = new L.Point(256, 256)
      var pixelPoint = this.map.project(latlng, this.map.getZoom())
      var pos = pixelPoint.unscaleBy(tileSize)
      return pos.scaleBy(tileSize).divideBy(Math.pow(2, this.map.getZoom() - 16)).subtract( new L.Point(Math.pow(2, 23), Math.pow(2, 23), false))
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

      return {idx: values.idx[pixel.x][pixel.y], values: values.values[pixel.x][pixel.y]}
    }

    updateNoises(){
      this.biomeSource.updateNoiseSettings()      
      this.indicesManger.invalidateNoises()
    }

    invalidateIndices(){
      this.indicesManger.invalidateIndices()
    }

    async refresh(){
      if (!this.closeContainer.classList.contains("closed")){
        this.biomeLayer.redraw()
        //this.contourLayer.redraw()
      }
    }
}