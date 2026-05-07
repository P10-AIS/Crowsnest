import type { Bound } from "./Bound";
import type { TimePoint } from "./Point";
import type { ZoomLevels } from "./ZoomLevels";


export type Trajectory = {
    numHistoricTokens: number | null;
    trajectoryId: number;
    level: ZoomLevels<{
        padding: boolean[];
        points: TimePoint[];
        boundingBox: Bound;
    }>;
    enabled: boolean;
};