import type { Polygon } from "../types/Polygon";
import type { TrajectoriesByZoom } from "../types/TrajectoriesByZoom";
import type { Trajectory } from "../types/Trajectory";
import { getBoundingBox } from "./bounds";

export function prepareTrajectories(trajectories: Trajectory[]): TrajectoriesByZoom {

    const trajectoriesByZoom: TrajectoriesByZoom = {};

    const minZoom = 1;
    const maxZoom = 12;

    const minStep = 1;
    const maxStep = 200;


    for (let zoom = 1; zoom <= 21; zoom++) {
        const step = maxStep - ((zoom - minZoom) / (maxZoom - minZoom)) * (maxStep - minStep);
        const stepInt = Math.max(1, Math.round(step));

        trajectoriesByZoom[zoom] = trajectories.map((traj) => {
            const messages = traj.messages.filter((_, i) => i % stepInt === 0);
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


export function prepareEecPolygons(rawCoordinates: number[][][][]): Polygon[] {

    const polygons = rawCoordinates.map((polygon) => {
        const outlineCoords = polygon[0].map((coord) => ({ lat: coord[1], lng: coord[0] }));
        const holesCoords = polygon.slice(1).map((ring) =>
            ring.map((coord) => ({ lat: coord[1], lng: coord[0] }))
        );

        return {
            boundingBox: getBoundingBox(outlineCoords),
            outline: {
                boundingBox: getBoundingBox(outlineCoords),
                points: outlineCoords
            },
            holes: holesCoords.length > 0 ? holesCoords.map((hole) => ({
                boundingBox: getBoundingBox(hole),
                points: hole
            })) : undefined,
        }

    });

    return polygons;
}