@import ./ParameterAccess;
@import ./NormalNoise;
@import ./BiomeLookup;

uniform mat4 transform;
uniform vec3 color;

out vec4 biome_color;

vec4 lookup(float x, float z){
    float xx = x + normal_noise(OFFSET, x, 0.0, z) * 4.0;
    float zz = z + normal_noise(OFFSET, z, x, 0.0) * 4.0;

	float continentalness = normal_noise(CONTINENTALNESS, xx, 0.0, zz);
	float erosion = normal_noise(EROSION, xx, 0.0, zz);
	float weirdness = normal_noise(WEIRDNESS, xx, 0.0, zz);
	float temperature = normal_noise(TEMPERATURE, xx, 0.0, zz);
	float humidity = normal_noise(HUMIDITY, xx, 0.0, zz);

	return lookup_biome(continentalness, erosion, weirdness, temperature, humidity, -0.01);

}

void main(void) {
	float x = vCRSCoords.x / 4.0;
	float z = -vCRSCoords.y / 4.0;

    biome_color = lookup(x, z);
}
