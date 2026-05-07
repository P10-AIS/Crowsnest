import type { Polygon } from "../types/Polygon";
import { getBoundingBox } from "./bounds";
import type { Trajectory } from "../types/Prediction";
import type { ParsedPolygon, ParsedTrajectory } from "./parse";
import type { ZoomLevels } from "../types/ZoomLevels";
import type { TimePoint } from "../types/Point";
import type { Bound } from "../types/Bound";

export function prepareEezPolygons(parsedPolygons: ParsedPolygon[]): Polygon[] {
    const minZoom = 3;
    const maxZoom = 9;

    const minStep = 1;
    const maxStep = 20;

    const polygons = parsedPolygons.map((poly) => {

        const zooms = [];

        for (let zoom = 1; zoom <= 18; zoom++) {
            const step =
                maxStep -
                ((zoom - minZoom) / (maxZoom - minZoom)) * (maxStep - minStep);
            const stepInt = Math.max(1, Math.round(step));


            const simplifiedHoles = poly.holes
                ? poly.holes.map((hole) => ({
                    points: simplify(hole.points, stepInt),
                    boundingBox: getBoundingBox(hole.points)
                }))
                : undefined;

            zooms.push({
                outline: {
                    points: poly.outline.points,
                    boundingBox: getBoundingBox(poly.outline.points)
                },
                holes: simplifiedHoles,
            });
        }

        return {
            level: zooms,
        };
    });

    return polygons;
}
export function preparePoints(parsedPoints: ParsedTrajectory[], numZoomLevels: number): Trajectory[] {
    const minStep = 1;
    // Instead of a tiny percentage, let's aim for a maximum of ~30 points 
    // per trajectory when fully zoomed out. This guarantees performance.
    const targetPointsAtMinZoom = 5;

    const points = parsedPoints.map((traj) => {
        const zooms: ZoomLevels<{
            padding: boolean[];
            points: TimePoint[];
            boundingBox: Bound;
        }> = [];

        const totalPoints = traj.points.length;

        // If the trajectory has 300 points, maxStep will be 10.
        // It will take every 10th point at zoom level 0.
        const maxStep = Math.max(minStep, Math.floor(totalPoints / targetPointsAtMinZoom));

        for (let zoom = 0; zoom < numZoomLevels; zoom++) {
            const zoomRatio = numZoomLevels > 1 ? zoom / (numZoomLevels - 1) : 0;

            // Linear interpolation between maxStep and minStep
            const step = maxStep - zoomRatio * (maxStep - minStep);
            const stepInt = Math.max(1, Math.round(step));

            const simplifiedPadding = simplify(traj.padding, stepInt);
            const simplifiedPreds = simplify(traj.points, stepInt);
            const bb = getBoundingBox(simplifiedPreds);

            zooms.push({
                padding: simplifiedPadding,
                points: simplifiedPreds,
                boundingBox: bb,
            });
        }

        return {
            numHistoricTokens: traj.numHistoricTokens,
            trajectoryId: traj.trajectoryId,
            level: zooms,
            enabled: true,
        };
    });

    return points;
}



function simplify<T>(arr: T[], step: number): T[] {
    if (arr.length <= 2) return arr;

    const result = arr.slice(1, arr.length - 1).filter((_, i) => i % step === 0);

    const first = arr[0];
    const last = arr[arr.length - 1];

    return [first, ...result, last];
}