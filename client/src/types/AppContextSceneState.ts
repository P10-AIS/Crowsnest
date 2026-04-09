import type { AppContextType } from "../contexts/AppContext";

type StorageKey =
    | "eezDKOutlineVisible"
    | "eezUSOutlineVisible"
    | "fullTrajectoryFidelity"
    | "fullEezFidelity"
    | "showMapTiles"
    | "showModelPredictions"
    | "showLabels"
    | "trajectoryDensity"
    | "fullPredictionFidelity"
    | "enableShipSizeGuide"
    | "showTrajectoryDots"
    | "showPredictionDots"
    | "drawConfig"
    | "showImageOverlay"
    | "projection"
    | "zoom"
    | "center"
    | "imageOpacities";

export type AppSnapshot = Pick<AppContextType, StorageKey>;
