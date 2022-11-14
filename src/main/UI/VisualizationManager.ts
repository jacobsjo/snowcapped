import { Climate, Identifier, NoiseSettings } from "deepslate";
import * as L from "leaflet";
import { BiomeBuilder, MultiNoiseIndexes } from "../BuilderData/BiomeBuilder";
import { GridElementUnassigned } from "../BuilderData/GridElementUnassigned";
import { BiomeLayer } from "../Visualization/BiomeLayer";
import { MenuManager } from "./MenuManager";
import { Change, UI } from "./UI";

export class VisualizationManger {
  builder: BiomeBuilder
  private map: L.Map
  private biomeLayer: BiomeLayer

  private closeContainer: HTMLElement

  public enable_isolines: boolean = false
  public enable_hillshading: boolean = true

  private refreshButton: HTMLElement

  public vis_y_level: number | "surface" = "surface"
  public seed: bigint = BigInt(1)
  public input2d: boolean = true

  private heightSelectRange: HTMLInputElement

  constructor(builder: BiomeBuilder) {
    this.builder = builder


    const panel = document.getElementById('visualization')

    this.closeContainer = panel.parentElement.parentElement;
    (this.closeContainer as any).onopenchange = () => {
      //this.biomeLayer.reRender({biome: {}, grids: true, noises: true, spline: true})
    }


    this.map = L.map('visualization_map')
    this.map.setView([0, 0], 15)
    this.map.setMaxZoom(16)
    this.map.setMinZoom(11)

    this.biomeLayer = new BiomeLayer(this, { tileSize: 256 });
    this.biomeLayer.addTo(this.map);

    this.refreshButton = document.getElementById('refreshButton')

    this.refreshButton.onclick = (evt: MouseEvent) => {
      UI.getInstance().refresh({ map_display: true })
    }

    const toggleHillshadeButton = document.getElementById('toggleHillshadeButton')

    toggleHillshadeButton.onclick = (evt: MouseEvent) => {
      this.enable_hillshading = !this.enable_hillshading
      toggleHillshadeButton.classList.toggle("enabled", this.enable_hillshading)
      UI.getInstance().refresh({ grids: true })
    }

    this.heightSelectRange = document.getElementById('mapHeightSelection') as HTMLInputElement
    const heightSelectLabel = document.getElementById('mapHeightLabel')

    this.heightSelectRange.value = this.heightSelectRange.max

    this.heightSelectRange.oninput = () => {
      const val = Number(this.heightSelectRange.value)
      const min = Number(this.heightSelectRange.min)
      const max = Number(this.heightSelectRange.max)

      if (val === max) {
        heightSelectLabel.innerHTML = "Surface"
      } else {
        heightSelectLabel.innerHTML = val.toFixed(0)
      }
      const pos = (1 - ((val - min) / (max - min))) * 0.94 * parseInt(getComputedStyle(this.heightSelectRange).height)
      heightSelectLabel.style.top = pos + "px"
    }

    this.heightSelectRange.onchange = (evt) => {
      const val = Number(this.heightSelectRange.value)
      const max = Number(this.heightSelectRange.max)

      if (val === max) {
        this.vis_y_level = "surface"
      } else {
        this.vis_y_level = val
      }
      if (evt){
        this.refresh({ map_y_level: true })
      }
    }

    const toggleFullscreenButton = document.getElementById('mapFullscreenButton')
    toggleFullscreenButton.onclick = (evt: MouseEvent) => {
      const open = panel.classList.toggle("fullscreen")
      toggleFullscreenButton.classList.toggle("enabled", open)
      this.map.invalidateSize()
    }


    const seedInput = document.getElementById("mapSeedInput") as HTMLInputElement;
    seedInput.value = this.seed.toString()
    seedInput.onkeypress = (evt) => {
      if (!evt.key.match(/^[0-9|-]+$/)) {
        evt.preventDefault();
      }
    }

    seedInput.onchange = (evt) => {
      this.seed = BigInt(seedInput.value)
      UI.getInstance().refresh({ noises: true })
    }

    seedInput.onkeyup = (evt: KeyboardEvent) => {
      if (evt.key === "Enter") {
        seedInput.blur()
      }
    }

    const input2dCheckbox = document.getElementById("map2dInput") as HTMLInputElement
    input2dCheckbox.checked = true

    input2dCheckbox.onchange = (evt) => {
      this.input2d = input2dCheckbox.checked
      UI.getInstance().refresh({ map_display: true })
    }

    const tooltip = document.getElementById("visualizationTooltip")
    const tooltip_position = tooltip.getElementsByClassName("position")[0] as HTMLElement
    const tooltip_noise_values = tooltip.getElementsByClassName("noise_values")[0] as HTMLElement
    const tooltip_slice = tooltip.getElementsByClassName("slice")[0] as HTMLElement
    const tooltip_mode = tooltip.getElementsByClassName("mode")[0] as HTMLImageElement
    const tooltip_layout = tooltip.getElementsByClassName("layout")[0] as HTMLElement
    const tooltip_biome = tooltip.getElementsByClassName("biome")[0] as HTMLElement

    let lastPos: { x: number, z: number };
    let lastY: number;

    this.map.addEventListener("click", (evt: L.LeafletMouseEvent) => {
      const idxs = this.getIdxs(evt.latlng)
      const lookup = this.builder.lookupRecursiveWithTracking(idxs.idx)

      if (lookup.slice === undefined || lookup.slice instanceof GridElementUnassigned)
        return

      if (lookup.layout !== undefined && (evt.originalEvent.ctrlKey || evt.originalEvent.metaKey)) {
        lookup.layout.getRenderer().setHighlight(idxs.idx.temperature, idxs.idx.humidity)
        UI.getInstance().sidebarManager.openElement({ type: "layout", key: lookup.layout.getKey() })
      } else {
        lookup.slice.getRenderer().setHighlight(idxs.idx.continentalness, idxs.idx.erosion)
        UI.getInstance().sidebarManager.openElement({ type: "slice", key: lookup.slice.getKey() })
      }
    })

    this.map.addEventListener("mousemove", (evt: L.LeafletMouseEvent) => {
      const idxs = this.getIdxs(evt.latlng);
      if (idxs === undefined) {
        return
      }
      const lookup = idxs ? this.builder.lookupRecursiveWithTracking(idxs.idx) : undefined

      tooltip.style.left = (Math.min(evt.originalEvent.pageX + 20, document.body.clientWidth - 300)) + "px"
      tooltip.style.top = (evt.originalEvent.pageY + 15) + "px"
      tooltip.classList.remove("hidden")

      if (lookup)
        tooltip_mode.src = "images/mode_" + lookup?.mode + ".png"

      /*          const offset = builder.splines.offset.apply(idxs.values.c, idxs.values.e, idxs.values.w)
      
                var y
                var depth: number
                if (builder.vis_y_level === "surface") {
                  y = idxs ? (offset * 128 + 64) : undefined
                  depth = 0
                } else {
                  y = builder.vis_y_level
                  depth = -(builder.vis_y_level - 64) / 128 + offset
                }*/

      tooltip_position.innerHTML = `X: ${idxs.position.x.toFixed(0)}, Y: ${idxs.position.y.toFixed(0)}, Z: ${idxs.position.z.toFixed(0)}`
      tooltip_noise_values.innerHTML = "C: " + idxs.values.continentalness.toFixed(2) + ", E: " + idxs.values.erosion.toFixed(2) + ", W: " +
        idxs.values.weirdness.toFixed(2) + "<br /> T: " + idxs.values.temperature.toFixed(2) + ", H: " + idxs.values.humidity.toFixed(2) + ", D: " + idxs.values.depth.toFixed(2)
      tooltip_slice.innerHTML = "&crarr; " + lookup?.slice?.name + " (Slice)"
      tooltip_layout.innerHTML = "&crarr; " + lookup?.layout?.name + " (Layout)"
      tooltip_biome.innerHTML = lookup?.biome?.name

      //tooltip_position.classList.toggle("hidden", idxs === undefined)
      tooltip_mode.classList.toggle("hidden", lookup?.mode === undefined)
      tooltip_slice.parentElement.classList.toggle("hidden", lookup?.slice === undefined || lookup.slice instanceof GridElementUnassigned)
      tooltip_layout.parentElement.classList.toggle("hidden", lookup?.layout === undefined || lookup.layout instanceof GridElementUnassigned)
      tooltip_biome.parentElement.classList.toggle("hidden", lookup?.biome === undefined || lookup.biome instanceof GridElementUnassigned)

      if (idxs) {
        UI.getInstance().splineDisplayManager.setPos({ c: idxs.values.continentalness, e: idxs.values.erosion, w: idxs.values.weirdness })
        UI.getInstance().splineDisplayManager.refresh()
      }

      MenuManager.toggleAction("open-slice", lookup?.slice !== undefined && !(lookup?.slice instanceof GridElementUnassigned))
      MenuManager.toggleAction("open-layout", lookup?.layout !== undefined)
      MenuManager.toggleAction("copy", true)

      lastPos = idxs.position
      //          lastY = y
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
      if (evt.originalEvent.key === "c" && (evt.originalEvent.ctrlKey || evt.originalEvent.metaKey)) {
        navigator.clipboard.writeText("/execute in " + builder.dimensionName + " run tp @s " + lastPos.x.toFixed(0) + " " + (lastY + 10).toFixed(0) + " " + lastPos.z.toFixed(0))
      }
    })
  }

  private getIdxs(latlng: L.LatLng): { idx: MultiNoiseIndexes, values: Climate.TargetPoint, position: { x: number, y: number, z: number } } {
    return this.biomeLayer.getIdxs(latlng)

  }

  async refresh(change: Change) {
    if (change.noises || change.spline) {
      this.refreshButton.classList.remove("hidden")
      console.log("Map update required")
    }

    if (!this.closeContainer.classList.contains("closed")) {
      if (change.map_display) {
        const noise_settings_json = (await this.builder.datapacks.get("worldgen/noise_settings", Identifier.parse(this.builder.noiseSettingsName))) as any
        const noise_settings = NoiseSettings.fromJson(noise_settings_json.noise)
        this.heightSelectRange.min = noise_settings.minY.toFixed(0)
        this.heightSelectRange.max = (noise_settings.minY + noise_settings.height + 1).toFixed(0)
        this.heightSelectRange.onchange(null)
      }

      if (change.map_display || (change.map_y_level && !this.input2d)) {
        this.refreshButton.classList.add("hidden")
      }
      this.biomeLayer.refresh(change)
    }
  }
}