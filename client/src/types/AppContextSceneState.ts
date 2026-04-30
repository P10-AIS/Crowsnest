import type { AppContextType } from "../contexts/AppContext";

type StorageKey =
    | "eezDKOutlineVisible"
    | "eezUSOutlineVisible"
    | "fullFidelity"
    | "showMapTiles"
    | "showModelPredictions"
    | "showLabels"
    | "trajectoryDensity"
    | "enableShipSizeGuide"
    | "showTrajectoryDots"
    | "drawConfig"
    | "showImageOverlay"
    | "projection"
    | "zoom"
    | "center"
    | "imageOpacities";

export type AppSnapshot = Pick<AppContextType, StorageKey>;