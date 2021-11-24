

#define WEIRDNESS 0
#define CONTINENTALNESS 1
#define EROSION 2
#define TEMPERATURE 3
#define HUMIDITY 4
#define OFFSET 5
#define DEPTH 5 // used for getCellBorder

#define FIRST 0
#define SECOND 1

#define X_AXIS 0
#define Y_AXIS 1
#define Z_AXIS 2

#define OCTAVE_COUNT 20
#define MAX_PARAMETER_CELLS_BORDERS 20

#define FIRST_OCTAVE_TEXTURE_FACTOR -256.0
#define FLOAT_TEXTURE_FACTOR 8.0
#define FLOAT_TEXTURE_OFFSET -8.0
#define P_TEXTURE_FACTOR 256.0

#define BORDER_UNDEFINED -200.0

const int NOISE_STORAGE_LENGTH = (MAX_PARAMETER_CELLS_BORDERS + OCTAVE_COUNT * 259 * 2 + 2 + OCTAVE_COUNT);

uniform sampler2D parameterTexture;

float getParameter(int index){
    int texture_width = textureSize(parameterTexture, 0).x;
    return texelFetch(parameterTexture, ivec2(index % texture_width, index / texture_width), 0).r;
}  

int getFirstOctave(int noise){
    int parameter_index = noise * NOISE_STORAGE_LENGTH;
    return int(getParameter(parameter_index));
}

float getValueFactor(int noise){
    int parameter_index = noise * NOISE_STORAGE_LENGTH + 1;
    return getParameter(parameter_index);
}

float getAmplitude(int noise, int index){
    int parameter_index = noise * NOISE_STORAGE_LENGTH + 2 + index;
    return getParameter(parameter_index);
}

float getCellBorder(int noise, int index){
    int parameter_index = noise * NOISE_STORAGE_LENGTH + 2 + OCTAVE_COUNT + index;
    return getParameter(parameter_index);
}

float getPos0(int noise, int normal_noise_index, int octave_index, int axis){
    int parameter_index = noise * NOISE_STORAGE_LENGTH + 2 + OCTAVE_COUNT + MAX_PARAMETER_CELLS_BORDERS + normal_noise_index * (OCTAVE_COUNT * 259) + 259 * octave_index + axis;
    return getParameter(parameter_index);
}

int getP(int noise, int normal_noise_index, int octave_index, int index){
    int parameter_index = noise * NOISE_STORAGE_LENGTH + 2 + OCTAVE_COUNT + MAX_PARAMETER_CELLS_BORDERS + normal_noise_index * (OCTAVE_COUNT * 259) + 259 * octave_index + 3 + (index & 0xFF);
    int value = int(getParameter(parameter_index));
    return value & 0xFF;
}
