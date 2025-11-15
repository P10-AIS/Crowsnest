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


