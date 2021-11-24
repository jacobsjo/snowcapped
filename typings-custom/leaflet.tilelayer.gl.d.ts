import * as L from 'leaflet';

declare module 'leaflet' {
    namespace tileLayer {
        interface GL extends L.GridLayer{
            initialize(options?: GLOptions): void
            getGlError(): string|undefined
            reRender(): void
            setUniform(name: string, value: number | [number] | [number, number] | [number, number, number] | [number, number, number, number]): void
            _gl: WebGL2RenderingContext
        }

        interface GLOptions {
            tileUrls?: string[],
            tileLayers?: L.TileLayer[],
            fragmentShader?: string,
            uniforms?: {[key: string]: number | [number] | [number, number] | [number, number, number] | [number, number, number, number] },
            subdomains?: string[],
        }

        function gl(options?: GLOptions): GL
    }
}