@import ./ParameterAccess;
@import ./NormalNoise;
@import ./BiomeLookup;
@import ./SplineValueAccess;
@import ./Spline;

#define M_PI 3.1415926535897932384626433832795

uniform mat4 transform;
uniform vec3 color;

uniform bool enable_isolines;
uniform bool enable_hillshading;

uniform int y_level;
uniform float fixed_continentalness;
uniform float fixed_erosion;
uniform float fixed_weirdness;
uniform float fixed_temperature;
uniform float fixed_humidity;

out vec4 output_color;

const float zenith = 20.0 * M_PI / 180.0;
const float azimuth = 225.0 * M_PI / 180.0;


float inv_lerp(float a, float b, float v) {
	return (v - a) / (b - a);
}
 
void main(void) {
	
	
	float x = vCRSCoords.x / 4.0;
	float z = -vCRSCoords.y / 4.0;

	float pixel_scale = dFdx(x);

    float xx = x + normal_noise(OFFSET, x, 0.0, z) * 4.0;
    float zz = z + normal_noise(OFFSET, z, x, 0.0) * 4.0;

	float continentalness = fixed_continentalness != 10000.0 ? fixed_continentalness : normal_noise(CONTINENTALNESS, xx, 0.0, zz);
	float erosion = fixed_erosion != 10000.0 ? fixed_erosion : normal_noise(EROSION, xx, 0.0, zz);
	float weirdness = fixed_weirdness != 10000.0 ? fixed_weirdness : normal_noise(WEIRDNESS, xx, 0.0, zz);
	float temperature = fixed_temperature != 10000.0 ? fixed_temperature : normal_noise(TEMPERATURE, xx, 0.0, zz);
	float humidity = fixed_humidity != 10000.0 ? fixed_humidity : normal_noise(HUMIDITY, xx, 0.0, zz);

	float offset = spline_apply(OFFSET_SPLINE, continentalness, erosion, weirdness);

	float depth = ((y_level == 10000) ? -0.001 : -(float(y_level) - 64.0) / 128.0 + offset);

	vec4 biome_color = lookup_biome(continentalness, erosion, weirdness, temperature, humidity, depth);
	
	float offset_slope_x = dFdx(offset);
	float offset_slope_y = dFdy(offset);

	float hillshade = 1.0;
	if (enable_hillshading && depth < 0.0){
		float slope = atan(20.0 / pixel_scale * sqrt(offset_slope_x * offset_slope_x + offset_slope_y * offset_slope_y));
		float aspect;
		if (offset_slope_x == 0.0){
			if (offset_slope_y < 0.0){
				aspect = M_PI;
			} else {
				aspect = 0.0;
			}
		} else {
			aspect = atan(offset_slope_y, -offset_slope_x);
		}

		hillshade = ((cos(zenith) * cos(slope)) + (sin(zenith) * sin(slope) * cos(azimuth - aspect)));
		if (hillshade < 0.0)
			hillshade = 0.0;

		hillshade = hillshade * 0.7 + 0.3;
	}

	float isoline = 1.0;
	if (pixel_scale < 1.0 && enable_isolines && depth < 0.0){
		float isoline_step = 0.1;

		float delta = 2.0 * sqrt(offset_slope_x * offset_slope_x + offset_slope_y * offset_slope_y);
		float offset_hi = offset + delta + 0.01;
		float offset_lo = offset - delta + 0.01;

		float isoline_value = floor(offset_hi / isoline_step) * isoline_step;
		float isoline_alpha = inv_lerp(offset_lo, offset_hi, isoline_value);
		isoline = min(abs(0.5 - isoline_alpha) * 3.0 + 0.2, 1.0);
	}

	output_color = biome_color * vec4(hillshade * isoline, hillshade * isoline, hillshade * isoline, 1.0);
	

	/*
	if (offset > 0.6){
		output_color = vec4(biome_color.rgb, 0.5);// biome_color;
	} else {
		output_color = biome_color;// biome_color;
	}*/
}
