import type { Polygon } from "../types/Polygon";
import type { ZoomLevels } from "../types/ZoomLevels";
import type { Trajectory } from "../types/Trajectory";
import { getBoundingBox } from "./bounds";

export function prepareTrajectories(trajectories: Trajectory[]): ZoomLevels<Trajectory[]> {

    const trajectoriesByZoom: ZoomLevels<Trajectory[]> = [];

    const minZoom = 1;
    const maxZoom = 12;

    const minStep = 1;
    const maxStep = 200;


    for (let zoom = 1; zoom <= 21; zoom++) {
        const step = maxStep - ((zoom - minZoom) / (maxZoom - minZoom)) * (maxStep - minStep);
        const stepInt = Math.max(1, Math.round(step));

        trajectoriesByZoom[zoom] = trajectories.map((traj) => {
            const messages = simplify(traj.messages, stepInt);
            const points = messages.map(msg => msg.point);
            const simplifiedTrajectory: Trajectory = {
                id: traj.id,
                messages,
                boundingBox: getBoundingBox(points),
            };
            return simplifiedTrajectory;
        });
    }

    return trajectoriesByZoom;
}


export function prepareEecPolygons(rawCoordinates: number[][][][]): ZoomLevels<Polygon[]> {
    const polygonsBase = rawCoordinates.map((polygon) => {
        const outlineCoords = polygon[0].map((coord) => ({ lat: coord[1], lng: coord[0] }));
        const holesCoords = polygon.slice(1).map((ring) =>
            ring.map((coord) => ({ lat: coord[1], lng: coord[0] }))
        );

        return {
            outline: {
                boundingBox: getBoundingBox(outlineCoords),
                points: outlineCoords
            },
            holes: holesCoords.length > 0
                ? holesCoords.map((hole) => ({
                    boundingBox: getBoundingBox(hole),
                    points: hole
                }))
                : undefined,
            boundingBox: getBoundingBox(outlineCoords)
        } as Polygon;
    });

    const minZoom = 1;
    const maxZoom = 12;

    const minStep = 1;
    const maxStep = 20;

    const polygonsByZoom: ZoomLevels<Polygon[]> = [];

    for (let zoom = 1; zoom <= 21; zoom++) {
        const step =
            maxStep -
            ((zoom - minZoom) / (maxZoom - minZoom)) * (maxStep - minStep);
        const stepInt = Math.max(1, Math.round(step));

        polygonsByZoom[zoom] = polygonsBase.map((poly) => {
            // const simplifiedOutline = simplify(poly.outline.points, stepInt);

            const simplifiedHoles = poly.holes
                ? poly.holes.map((hole) => ({
                    points: simplify(hole.points, stepInt),
                    boundingBox: getBoundingBox(hole.points)
                }))
                : undefined;

            return {
                outline: {
                    points: poly.outline.points,
                    boundingBox: getBoundingBox(poly.outline.points)
                },
                holes: simplifiedHoles,
            };
        });
    }

    return polygonsByZoom;
}

function simplify<T>(arr: T[], step: number): T[] {
    if (arr.length === 0) return [];

    const result = arr.filter((_, i) => i % step === 0);

    const last = arr[arr.length - 1];
    if (result[result.length - 1] !== last) {
        result.push(last);
    }

    return result;
}