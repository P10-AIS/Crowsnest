import type { Point } from "./Point";

export type GeoImage = {
    name: string;
    img: HTMLImageElement;
    area: {
        topRight: Point;
        bottomLeft: Point;
    }
}