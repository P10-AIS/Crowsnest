import type { Bound } from "./Bound";
import type { Point } from "./Point";


export type Prediction = {
    trajectoryId: number;
    masks: boolean[];
    truePoints: Point[];
    predictedPoints: Point[];
    boundingBoxPredicted: Bound;
    boundingBoxTrue: Bound;
};