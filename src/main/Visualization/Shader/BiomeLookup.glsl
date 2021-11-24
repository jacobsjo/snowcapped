
uniform sampler2D biomeTexture;

int bucketize(int noise, float value, out int count){
    int result = 20;
    count = 20;
    for (int i = 0 ; i < 20 ; i++){
        float border = getCellBorder(noise, i);
        if (border == BORDER_UNDEFINED && count == 20){
            count = i + 1;
        }
        if (result == 20 && (border == BORDER_UNDEFINED || border > value)){
            result = i;
        }
    }
    return result;
}

vec4 lookup_biome(float continentalness, float erosion, float weirdness, float temperature, float humidity, float depth){
    int c_count, e_count, w_count, t_count, h_count, d_count;

    int c = bucketize(CONTINENTALNESS, continentalness, c_count);
    int e = bucketize(EROSION, erosion, e_count);
    int w = bucketize(WEIRDNESS, weirdness, w_count);
    int t = bucketize(TEMPERATURE, temperature, t_count);
    int h = bucketize(HUMIDITY, humidity, h_count);
    int d = bucketize(DEPTH, depth, d_count);

    int index = 
        d * h_count * t_count * w_count * e_count * c_count +
        h * t_count * w_count * e_count * c_count +
        t * w_count * e_count * c_count + 
        w * e_count * c_count +
        e * c_count +
        c;

    int texture_width = textureSize(biomeTexture, 0).x;

    return texelFetch(biomeTexture, ivec2(index % texture_width, index / texture_width), 0);
}



