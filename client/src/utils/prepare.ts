import type { Polygon } from "../types/Polygon";
import type { ZoomLevels } from "../types/ZoomLevels";
import type { Trajectory } from "../types/Trajectory";
import { getBoundingBox } from "./bounds";
import type { Prediction } from "../types/Prediction";

export function prepareTrajectories(trajectories: Trajectory[]): ZoomLevels<Trajectory[]> {

    const trajectoriesByZoom: ZoomLevels<Trajectory[]> = [];

    const minZoom = 3;
    const maxZoom = 9;

    const minStep = 1;
    const maxStep = 600;


    for (let zoom = 1; zoom <= 18; zoom++) {
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


export function prepareEezPolygons(rawCoordinates: number[][][][]): ZoomLevels<Polygon[]> {
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

    const minZoom = 3;
    const maxZoom = 9;

    const minStep = 1;
    const maxStep = 20;

    const polygonsByZoom: ZoomLevels<Polygon[]> = [];

    for (let zoom = 1; zoom <= 18; zoom++) {
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

export function preparePredictions(predictions: Prediction[]): ZoomLevels<Prediction[]> {
    const minZoom = 3;
    const maxZoom = 9;

    const minStep = 1;
    const maxStep = 600;

    const predictionsByZoom: ZoomLevels<Prediction[]> = [];

    for (let zoom = 1; zoom <= 18; zoom++) {
        const step = maxStep - ((zoom - minZoom) / (maxZoom - minZoom)) * (maxStep - minStep);
        const stepInt = Math.max(1, Math.round(step));

        const predictionsZoomed = predictions.map((pred) => {
            const simplifiedMasks = simplify(pred.masks, stepInt);
            const simplifiedPreds = simplify(pred.predictedPoints, stepInt);
            const simplifiedTruths = simplify(pred.truePoints, stepInt);
            const trajectoryId = pred.trajectoryId;
            const boundingBoxPredicted = getBoundingBox(simplifiedPreds);
            const boundingBoxTrue = getBoundingBox(simplifiedTruths);

            return {
                trajectoryId,
                masks: simplifiedMasks,
                predictedPoints: simplifiedPreds,
                truePoints: simplifiedTruths,
                boundingBoxPredicted,
                boundingBoxTrue
            };
        });

        predictionsByZoom[zoom] = predictionsZoomed
    }

    return predictionsByZoom;
}



function simplify<T>(arr: T[], step: number): T[] {
    if (arr.length <= 2) return arr;

    const result = arr.slice(1, arr.length - 1).filter((_, i) => i % step === 0);

    const first = arr[0];
    const last = arr[arr.length - 1];

    return [first, ...result, last];
}