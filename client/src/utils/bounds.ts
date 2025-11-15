import type { Bound } from "../types/Bound";
import type { Point } from "../types/Point";

export function getBoundingBox(points: Point[]): Bound {
    return points.reduce((bbox, point) => {
        const minLat = Math.min(bbox.minLat, point.lat)
        const maxLat = Math.max(bbox.maxLat, point.lat)
        const minLng = Math.min(bbox.minLng, point.lng)
        const maxLng = Math.max(bbox.maxLng, point.lng)

        return {
            minLat,
            maxLat,
            minLng,
            maxLng,
        };
    }, {
        minLat: Infinity,
        maxLat: -Infinity,
        minLng: Infinity,
        maxLng: -Infinity,
    });

}