import { createContext, useCallback, useContext, useMemo, useState, type JSX } from 'react';
import type { Polygon } from '../types/Polygon';
import type { GeoImage } from '../types/GeoImage';
import type { DrawConfig } from '../types/DrawConfig';
import { Projection } from '../types/projection';
import type { ImageOpacities } from '../types/Opacity';
import type { RawForces, RawTrajectory } from '../utils/draw';
import { useLocalStorageState } from '../hooks/LocalStorageState';

export interface AppContextType {
    polygonsDK: Polygon[];
    setPolygonsDK: (polygons: Polygon[]) => void;

    polygonsUS: Polygon[];
    setPolygonsUS: (polygons: Polygon[]) => void;

    eezDKOutlineVisible: boolean;
    setEezDKOutlineVisible: (visible: boolean) => void;

    eezUSOutlineVisible: boolean;
    setEezUSOutlineVisible: (visible: boolean) => void;

    fullFidelity: boolean;
    setFullFidelity: (fidelity: boolean) => void;

    showMapTiles: boolean;
    setShowMapTiles: (show: boolean) => void;

    showModelPredictions: Record<string, boolean>;
    setShowModelPredictions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

    modelPredictions: Record<string, Map<number, RawTrajectory>>;
    setModelPredictions: React.Dispatch<React.SetStateAction<Record<string, Map<number, RawTrajectory>>>>;

    modelForces: Record<string, Map<number, RawForces | null>>;
    setModelForces: React.Dispatch<React.SetStateAction<Record<string, Map<number, RawForces | null>>>>;

    forceConfig: Record<string, { enabled: boolean[] }>;
    setForceConfig: React.Dispatch<React.SetStateAction<Record<string, { enabled: boolean[] }>>>;

    forceScale: number;
    setForceScale: (scale: number) => void;

    numForces: Record<string, number>;
    setNumForces: React.Dispatch<React.SetStateAction<Record<string, number>>>;

    forceNames: Record<string, string[]>;
    setForceNames: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;

    showLabels: Record<string, boolean>;
    setShowLabels: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

    labels: Record<string, Map<number, RawTrajectory>>;
    setLabels: React.Dispatch<React.SetStateAction<Record<string, Map<number, RawTrajectory>>>>;

    trajectoryDensity: number;
    setTrajectoryDensity: (density: number) => void;

    enableShipSizeGuide: boolean;
    setEnableShipSizeGuide: (enable: boolean) => void;

    shipSizeGuideImage: HTMLImageElement | null;
    setShipSizeGuideImage: (image: HTMLImageElement | null) => void;

    showTrajectoryDots: boolean;
    setShowTrajectoryDots: (show: boolean) => void;

    drawConfig: DrawConfig;
    setDrawConfig: (config: DrawConfig) => void;

    imageOverlays: Record<string, GeoImage>;
    setImageOverlays: React.Dispatch<React.SetStateAction<Record<string, GeoImage>>>;

    imageOpacities: ImageOpacities;
    setImageOpacities: React.Dispatch<React.SetStateAction<ImageOpacities>>;

    showImageOverlay: Record<string, boolean>;
    setShowImageOverlay: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

    projection: Projection;
    setProjection: React.Dispatch<React.SetStateAction<Projection>>;

    zoom: number;
    setZoom: (zoom: number) => void;

    center: [number, number];
    setCenter: (latlng: [number, number]) => void;

    historicHorizonM: Record<string, number | null>;
    setHistoricHorizonM: React.Dispatch<React.SetStateAction<Record<string, number | null>>>;

    modelPredictionsInView: Record<string, Set<number>>;
    setModelPredictionsInView: React.Dispatch<React.SetStateAction<Record<string, Set<number>>>>;

    labelsInView: Record<string, Set<number>>;
    setLabelsInView: React.Dispatch<React.SetStateAction<Record<string, Set<number>>>>;

    disabledTrajectories: Record<string, Set<number>>;
    setDisabledTrajectories: React.Dispatch<React.SetStateAction<Record<string, Set<number>>>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: JSX.Element }) => {
    const [eezDKOutlineVisible, setDKEezOutlineVisible] = useLocalStorageState("DKK_eezOutlineVisible", false);
    const [eezUSOutlineVisible, setEezUSOutlineVisible] = useLocalStorageState("US_eezOutlineVisible", false);
    const [fullTrajectoryFidelity, setFullTrajectoryFidelity] = useLocalStorageState("fullTrajectoryFidelity", false);
    const [showMapTiles, setShowMapTiles] = useLocalStorageState("showMapTiles", true);
    const [showModelPredictions, setShowModelPredictions] = useLocalStorageState("showModelPredictions", {});
    const [showLabels, setShowLabels] = useLocalStorageState("showLabels", {});
    const [enableShipSizeGuide, setEnableShipSizeGuide] = useLocalStorageState("enableShipSizeGuide", false);
    const [showTrajectoryDots, setShowTrajectoryDots] = useLocalStorageState("showTrajectoryDots", false);
    const [trajectoryDensity, setTrajectoryDensity] = useLocalStorageState("trajectoryDensity", 0.1);
    const [showImageOverlay, setShowImageOverlay] = useLocalStorageState("showImageOverlay", {});
    const [projection, setProjection] = useLocalStorageState<Projection>("projection", Projection.EPSG3034);
    const [zoom, setZoom] = useLocalStorageState("zoom", 5);
    const [center, setCenter] = useLocalStorageState<[number, number]>("center", [56.15674, 10.21076]);
    const [imageOpacities, setImageOpacities] = useLocalStorageState("imageOpacities", {});
    const [historicHorizonM, setHistoricHorizonM] = useLocalStorageState("historicHorizonM", {});
    const [forceScale, setForceScale] = useLocalStorageState("forceScale", 20);
    const [drawConfig, setDrawConfig] = useLocalStorageState<DrawConfig>("drawConfig", {
        colors: {
            label: "rgba(0,100,255)",
            prediction: "rgba(255,0,0)",
            polygonStroke: "orange",
            start: "green",
            end: "red",
        },
        dotsZoom: 1,
        radiusScale: 3,
        lineWidthScale: 2,
        dashPattern: [4, 4],
        numZoomLevels: 5,
        trajectorySimplificationThresholds: {
            [Projection.EPSG3034]: 7,
            [Projection.EPSG3857]: 11,
            [Projection.EPSG32617]: 10,
        }
    });

    const [polygonsDK, setPolygonsDK] = useState<Polygon[]>([]);
    const [polygonsUS, setPolygonsUS] = useState<Polygon[]>([]);
    const [modelPredictions, setModelPredictions] = useState<Record<string, Map<number, RawTrajectory>>>({});
    const [modelForces, setModelForces] = useState<Record<string, Map<number, RawForces | null>>>({});
    const [forceConfig, setForceConfig] = useState<Record<string, { enabled: boolean[] }>>({});
    const [numForces, setNumForces] = useState<Record<string, number>>({});
    const [forceNames, setForceNames] = useState<Record<string, string[]>>({});
    const [labels, setLabels] = useState<Record<string, Map<number, RawTrajectory>>>({});
    const [shipSizeGuideImage, setShipSizeGuideImage] = useState<HTMLImageElement | null>(null);
    const [imageOverlays, setImageOverlays] = useState<Record<string, GeoImage>>({});
    const [modelPredictionsInView, setModelPredictionsInView] = useState<Record<string, Set<number>>>({});
    const [labelsInView, setLabelsInView] = useState<Record<string, Set<number>>>({});

    const [disabledTrajectoriesRaw, setDisabledTrajectoriesRaw] = useLocalStorageState<Record<string, number[]>>("disabledTrajectories", {});

    const disabledTrajectories = useMemo(() =>
        Object.fromEntries(
            Object.entries(disabledTrajectoriesRaw).map(([k, v]) => [k, new Set<number>(v)])
        ), [disabledTrajectoriesRaw]
    );

    const setDisabledTrajectories: React.Dispatch<React.SetStateAction<Record<string, Set<number>>>> = useCallback((action) => {
        setDisabledTrajectoriesRaw(prev => {
            const prevAsSets = Object.fromEntries(
                Object.entries(prev).map(([k, v]) => [k, new Set<number>(v)])
            );
            const next = typeof action === 'function' ? action(prevAsSets) : action;
            return Object.fromEntries(
                Object.entries(next).map(([k, v]) => [k, Array.from(v)])
            );
        });
    }, []);

    const value: AppContextType = {
        polygonsDK, setPolygonsDK,
        polygonsUS, setPolygonsUS,
        eezDKOutlineVisible, setEezDKOutlineVisible: setDKEezOutlineVisible,
        eezUSOutlineVisible, setEezUSOutlineVisible,
        fullFidelity: fullTrajectoryFidelity, setFullFidelity: setFullTrajectoryFidelity,
        showMapTiles, setShowMapTiles,
        showModelPredictions, setShowModelPredictions,
        modelPredictions, setModelPredictions,
        modelForces, setModelForces,
        forceConfig, setForceConfig,
        numForces, setNumForces,
        forceNames, setForceNames,
        showLabels, setShowLabels,
        labels, setLabels,
        trajectoryDensity, setTrajectoryDensity,
        enableShipSizeGuide, setEnableShipSizeGuide,
        shipSizeGuideImage, setShipSizeGuideImage,
        showTrajectoryDots, setShowTrajectoryDots,
        drawConfig, setDrawConfig,
        imageOverlays, setImageOverlays,
        imageOpacities, setImageOpacities,
        projection, setProjection,
        showImageOverlay, setShowImageOverlay,
        zoom, setZoom,
        center, setCenter,
        historicHorizonM, setHistoricHorizonM,
        modelPredictionsInView, setModelPredictionsInView,
        labelsInView, setLabelsInView,
        disabledTrajectories, setDisabledTrajectories,
        forceScale, setForceScale,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};