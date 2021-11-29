

float spline_apply_weirdness(int spline, int ci, int ei, float w){
    int wi;
    int num_weirnesses = spline_get_num_points(spline, ci, ei);
    for (int i = 0; i < num_weirnesses; i++) {
        if (spline_get_point_location(spline, ci, ei, i) < w) {
            wi = i;
        }
    }

    if (wi < 0) {
        return spline_get_point_value(spline, ci, ei, 0) + spline_get_point_derivative_left(spline, ci, ei, 0) * (w - spline_get_point_location(spline, ci, ei, 0));
    }
    if (wi == num_weirnesses - 1) {
        return spline_get_point_value(spline, ci, ei, wi) + spline_get_point_derivative_right(spline, ci, ei, wi) * (w - spline_get_point_location(spline, ci, ei, wi));
    }

    float loc0 = spline_get_point_location(spline, ci, ei, wi);
    float loc1 = spline_get_point_location(spline, ci, ei, wi+1);
    float der0 = spline_get_point_derivative_right(spline, ci, ei, wi);
    float der1 = spline_get_point_derivative_left(spline, ci, ei, wi+1);
    float f = (w - loc0) / (loc1 - loc0);

    float val0 = spline_get_point_value(spline, ci, ei, wi);
    float val1 = spline_get_point_value(spline, ci, ei, wi+1);

    float f8 = der0 * (loc1 - loc0) - (val1 - val0);
    float f9 = -der1 * (loc1 - loc0) + (val1 - val0);
    float f10 = lerp(f, val0, val1) + f * (1.0 - f) * lerp(f, f8, f9);
    return f10;
}

float interpolate_zero_grad(float alpha, float a, float b) {
    return lerp(alpha, a, b) + alpha * (1.0 - alpha) * lerp(alpha, a - b, b - a);
}

float spline_apply_erosion(int spline, int ci, float e, float w){
    int e_last = -1;
    int e_next = -1;
    int num_erosions = spline_get_num_erosions(spline);
    for (int ei = 0; ei < num_erosions; ei++) {
        if (spline_is_defined(spline, ci, ei)) {
            if (spline_get_erosion_cell_border(spline, ei) < e) {
                e_last = ei;
            } else {
                e_next = ei;
                break;
            }
        }
    }

    if (e_last == -1 && e_next == -1) {
        return 0.0;
    } else if (e_last == -1) {;
        return spline_apply_weirdness(spline,ci,e_next,w);
    } else if (e_next == -1) {
        return spline_apply_weirdness(spline,ci,e_last,w);
    } else {
        float last_ero = spline_get_erosion_cell_border(spline, e_last);
        float next_ero = spline_get_erosion_cell_border(spline, e_next);
        return interpolate_zero_grad((e - last_ero) / (next_ero - last_ero),
            spline_apply_weirdness(spline,ci,e_last,w),
            spline_apply_weirdness(spline,ci,e_next,w));
    }
}

float spline_apply(int spline, float c, float e, float w){
    int c_last = -1;
    int c_next = -1;
    int num_continentalnesses = spline_get_num_continentalnesses(spline);
    for (int ci = 0; ci < num_continentalnesses; ci++) {
        if (spline_get_continentalness_cell_border(spline, ci) < c) {
            c_last = ci;
        } else {
            c_next = ci;
            break;
        }
    }

    if (c_last == -1 && c_next == -1 ) {
        return 0.0;
    } else if (c_last == -1) {
        return spline_apply_erosion(spline, c_next, e, w);
    } else if (c_next == -1) {
        return spline_apply_erosion(spline, c_last, e, w);
    } else {
        float last_cont = spline_get_continentalness_cell_border(spline, c_last);
        float next_cont = spline_get_continentalness_cell_border(spline, c_next);
        return interpolate_zero_grad((c - last_cont) / (next_cont - last_cont),
            spline_apply_erosion(spline, c_last, e, w),
            spline_apply_erosion(spline, c_next, e, w));
    }
}