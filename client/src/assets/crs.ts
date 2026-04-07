import L from "leaflet";
import "proj4leaflet";

export const CRS_3034 = new L.Proj.CRS(
    "EPSG:3034",
    "+proj=lcc +lat_0=52 +lon_0=10 +lat_1=35 +lat_2=65 +x_0=4000000 +y_0=2800000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
    ,
    {
        resolutions: [
            8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16,
            8, 4, 2, 1, 0.5, 0.25, 0.125, 0.0625, 0.03125
        ],
        origin: [0, 0],
    }
);

export const CRS_5070 = new L.Proj.CRS(
    "EPSG:5070",
    "+proj=aea +lat_0=23 +lon_0=-96 +lat_1=29.5 +lat_2=45.5 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
    ,
    {
        resolutions: [
            8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16,
            8, 4, 2, 1, 0.5, 0.25, 0.125, 0.0625, 0.03125
        ],
        origin: [0, 0],
    }
);
