import type { Point } from "./Point";
import type { Projection } from "./projection";

export type GeoImage = {
    img: HTMLImageElement;
    area: {
        topRight: Point;
        bottomLeft: Point;
    }
    projection: Projection;
}