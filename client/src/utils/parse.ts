import type { Prediction } from "../types/Prediction";
import type { Trajectory } from "../types/Trajectory";
import { getBoundingBox } from "./bounds";

// type RawPoint = {
//     lat: number;
//     lng: number;
//     rot: number;
//     sog: number;
//     cog: number;
//     heading: number;
//     vessel_type: string;
//     draught: number;
// }

type RawPoint = Array<number>
type RawTrajectory = Array<RawPoint>
type RawPredictions = {
    predictions: number[][][];
}

export function parseTrajectory(data: RawTrajectory[]): Trajectory[] {
    return data.map((traj, idx) => {
        const messages = traj.map((pt) => ({
            point: { lat: pt[0], lng: pt[1] },
            heading: pt[5],
        }));

        const points = messages.map(msg => msg.point);

        return {
            id: idx,
            boundingBox: getBoundingBox(points),
            messages,
        };
    })
}

export function parsePredictions(data: RawPredictions): Prediction[] {
    const predictions = data.predictions.map((pred, idx) => {
        const masks = pred.map(pt => pt[0] === 1);

        const predictedPoints = pred.map(pt => ({
            lat: pt[1],
            lng: pt[2],
        }));
        const truePoints = pred.map(pt => ({
            lat: pt[3],
            lng: pt[4],
        }));

        return {
            trajectoryId: idx,
            masks,
            predictedPoints,
            truePoints,
            boundingBoxPredicted: getBoundingBox(predictedPoints),
            boundingBoxTrue: getBoundingBox(truePoints),
        };
    });

    return predictions;
}

