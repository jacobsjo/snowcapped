const int GRADIENT[48] = int[](1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 1, 1, 0, 0, -1, 1, -1, 1, 0, 0, -1, -1);

float grad_dot(int p, float a, float b, float c){
    int index = (p & 15) * 3;
    return float(GRADIENT[index]) * a + float(GRADIENT[index + 1]) * b + float(GRADIENT[index + 2]) * c;
}

float _smoothstep(float x){
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

float lerp(float alpha, float a, float b) {
	return a + alpha * (b - a);
}

float lerp2(float alpha1, float alpha2, float a, float b, float c, float d) {
	return lerp(alpha2, lerp(alpha1, a, b), lerp(alpha1, c, d));
}

float lerp3(float alpha1, float alpha2, float alpha3, float a, float b, float c, float d, float e, float f, float g, float h) {
	return lerp(alpha3, lerp2(alpha1, alpha2, a, b, c, d), lerp2(alpha1, alpha2, e, f, g, h));
}

float improved_noise(int noise, int normal_noise_index, int octave_index, float x, float y, float z, float yScale, float yLimit){

    float x2 = x + getPos0(noise, normal_noise_index, octave_index, X_AXIS);
    float y2 = y + getPos0(noise, normal_noise_index, octave_index, Y_AXIS);
    float z2 = z + getPos0(noise, normal_noise_index, octave_index, Z_AXIS);

    int x3 = int(floor(x2));
    int y3 = int(floor(y2));
    int z3 = int(floor(z2));

    float x4 = x2 - float(x3);
    float y4 = y2 - float(y3);
    float z4 = z2 - float(z3);

    float y6 = 0.0;

    if (yScale != 0.0){
        float t = yLimit >= 0.0 && yLimit < y4 ? yLimit : y4;
        y6 = floor(t / yScale + 1e-7) * yScale;
    }

    float y7 = y4 - y6;

    int p1 = getP(noise, normal_noise_index, octave_index, x3);
    int p2 = getP(noise, normal_noise_index, octave_index, x3 + 1);
    int p3 = getP(noise, normal_noise_index, octave_index, p1 + y3);
    int p4 = getP(noise, normal_noise_index, octave_index, p1 + y3 + 1);
    int p5 = getP(noise, normal_noise_index, octave_index, p2 + y3);
    int p6 = getP(noise, normal_noise_index, octave_index, p2 + y3 + 1);

    float n = grad_dot(getP(noise, normal_noise_index, octave_index, p3 + z3), x4, y7, z4);
    float o = grad_dot(getP(noise, normal_noise_index, octave_index, p5 + z3), x4 - 1.0, y7, z4);
    float p = grad_dot(getP(noise, normal_noise_index, octave_index, p4 + z3), x4, y7 - 1.0, z4);
    float q = grad_dot(getP(noise, normal_noise_index, octave_index, p6 + z3), x4 - 1.0, y7 - 1.0, z4);
    float r = grad_dot(getP(noise, normal_noise_index, octave_index, p3 + z3 + 1), x4, y7, z4 - 1.0);
    float s = grad_dot(getP(noise, normal_noise_index, octave_index, p5 + z3 + 1), x4 - 1.0, y7, z4 - 1.0);
    float t = grad_dot(getP(noise, normal_noise_index, octave_index, p4 + z3 + 1), x4, y7 - 1.0, z4 - 1.0);
    float u = grad_dot(getP(noise, normal_noise_index, octave_index, p6 + z3 + 1), x4 - 1.0, y7 - 1.0, z4 - 1.0);

    float alpha1 = _smoothstep(x4);
    float alpha2 = _smoothstep(y4);
    float alpha3 = _smoothstep(z4);

    return lerp3(alpha1, alpha2, alpha3, n, o, p, q, r, s, t, u);
}
