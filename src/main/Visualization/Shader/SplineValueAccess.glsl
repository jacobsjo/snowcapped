#define OFFSET_SPLINE 0



#define SPLINE_MAX_CONTINENTALNESSES 20
#define SPLINE_MAX_EROSIONS 20 
#define SPLINE_MAX_POINTS 40

const int SPLINE_STORAGE_LENGHT = SPLINE_MAX_CONTINENTALNESSES + SPLINE_MAX_EROSIONS + 2 + SPLINE_MAX_CONTINENTALNESSES * SPLINE_MAX_EROSIONS * (SPLINE_MAX_POINTS * 4 + 1);

uniform sampler2D splineTexture;

float spline_get_parameter(int index){
    int texture_width = textureSize(splineTexture, 0).x;
    return texelFetch(splineTexture, ivec2(index % texture_width, index / texture_width), 0).r;
}  

int spline_get_num_continentalnesses(int spline){
    return int(spline_get_parameter(spline * SPLINE_STORAGE_LENGHT));
}

int spline_get_num_erosions(int spline){
    return int(spline_get_parameter(spline * SPLINE_STORAGE_LENGHT + 1 + SPLINE_MAX_CONTINENTALNESSES));
}

float spline_get_continentalness_cell_border(int spline, int ci){
    return spline_get_parameter(spline * SPLINE_STORAGE_LENGHT + 1 + ci);
}

float spline_get_erosion_cell_border(int spline, int ei){
    return spline_get_parameter(spline * SPLINE_STORAGE_LENGHT + 2 + SPLINE_MAX_CONTINENTALNESSES + ei);
}


int spline_get_num_points(int spline, int ci, int ei){
    return int(spline_get_parameter(spline * SPLINE_STORAGE_LENGHT + 2 + SPLINE_MAX_CONTINENTALNESSES + SPLINE_MAX_EROSIONS + (ci * SPLINE_MAX_EROSIONS + ei) * (SPLINE_MAX_POINTS * 4 + 1)));
}

bool spline_is_defined(int spline, int ci, int ei){
    return spline_get_num_points(spline, ci, ei) > 0;
}

float spline_get_point_location(int spline, int ci, int ei, int wi){
    return spline_get_parameter(spline * SPLINE_STORAGE_LENGHT + 2 + SPLINE_MAX_CONTINENTALNESSES + SPLINE_MAX_EROSIONS + (ci * SPLINE_MAX_EROSIONS + ei) * (SPLINE_MAX_POINTS * 4 + 1) + 1 + wi * 4);
}

float spline_get_point_value(int spline, int ci, int ei, int wi){
    return spline_get_parameter(spline * SPLINE_STORAGE_LENGHT + 2 + SPLINE_MAX_CONTINENTALNESSES + SPLINE_MAX_EROSIONS + (ci * SPLINE_MAX_EROSIONS + ei) * (SPLINE_MAX_POINTS * 4 + 1) + 1 + wi * 4 + 1);
}

float spline_get_point_derivative_left(int spline, int ci, int ei, int wi){
    return spline_get_parameter(spline * SPLINE_STORAGE_LENGHT + 2 + SPLINE_MAX_CONTINENTALNESSES + SPLINE_MAX_EROSIONS + (ci * SPLINE_MAX_EROSIONS + ei) * (SPLINE_MAX_POINTS * 4 + 1) + 1 + wi * 4 + 2);
}

float spline_get_point_derivative_right(int spline, int ci, int ei, int wi){
    return spline_get_parameter(spline * SPLINE_STORAGE_LENGHT + 2 + SPLINE_MAX_CONTINENTALNESSES + SPLINE_MAX_EROSIONS + (ci * SPLINE_MAX_EROSIONS + ei) * (SPLINE_MAX_POINTS * 4 + 1) + 1 + wi * 4 + 3);
}
