@import ./ImprovedNoise;

float _wrap(float value) {
    return value - floor(value / 3.3554432E7 + 0.5) * 3.3554432E7;
}

float perlin_noise(int noise, int normal_noise_index, float x, float y, float z, float yScale, float yLimit, bool fixY){
    float value = 0.0;
    float inputF = pow(2.0,float(getFirstOctave(noise)));
    float valueF = 1.0;

    for (int i = 0 ; i < 20 ; i++){
        float amplitude = getAmplitude(noise, i);
        if (amplitude != 0.0){
            value += amplitude * valueF * improved_noise(noise, normal_noise_index, i, 
                _wrap(x * inputF),
                fixY ? -getPos0(noise, normal_noise_index, i , Y_AXIS) : _wrap(y * inputF),
                _wrap(z * inputF),
                yScale * inputF,
                yLimit * inputF
            );
        }
        inputF *= 2.0;
        valueF /= 2.0;
    }

    return value;
}
