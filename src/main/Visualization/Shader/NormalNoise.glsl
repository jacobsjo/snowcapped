@import ./PerlinNoise;

#define INPUT_FACTOR 1.0181268882175227

float normal_noise(int noise, float x, float y, float z){
    return (perlin_noise(noise, FIRST, x, y, z, 0.0, 0.0, false) + perlin_noise(noise, SECOND, x * INPUT_FACTOR, y * INPUT_FACTOR, z * INPUT_FACTOR, 0.0, 0.0, false)) * getValueFactor(noise);
}