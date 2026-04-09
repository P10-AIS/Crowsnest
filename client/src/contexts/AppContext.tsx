import { createContext, useContext, useState, type JSX } from 'react';
import type { Polygon } from '../types/Polygon';
import type { GeoImage } from '../types/GeoImage';
import type { Trajectory } from '../types/Prediction';
import { useLocalStorageState } from './LocalStorageState';
import type { DrawConfig } from '../types/DrawConfig';
import { Projection } from '../types/projection';
import type { ImageOpacities } from '../types/Opacity';

export interface AppContextType {
    polygonsDK: Polygon[];
    setPolygonsDK: (polygons: Polygon[]) => void;
    polygonsUS: Polygon[];
    setPolygonsUS: (polygons: Polygon[]) => void;
    eezDKOutlineVisible: boolean;
    setEezDKOutlineVisible: (visible: boolean) => void;
    eezUSOutlineVisible: boolean;
    setEezUSOutlineVisible: (visible: boolean) => void;
    fullTrajectoryFidelity: boolean;
    setFullTrajectoryFidelity: (fidelity: boolean) => void;
    fullEezFidelity: boolean;
    setFullEezFidelity: (fidelity: boolean) => void;
    showMapTiles: boolean;
    setShowMapTiles: (show: boolean) => void;
    showModelPredictions: Record<string, boolean>;
    setShowModelPredictions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    modelPredictions: Record<string, Trajectory[]>;
    setModelPredictions: React.Dispatch<React.SetStateAction<Record<string, Trajectory[]>>>;
    showLabels: Record<string, boolean>;
    setShowLabels: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    labels: Record<string, Trajectory[]>;
    setLabels: React.Dispatch<React.SetStateAction<Record<string, Trajectory[]>>>;
    trajectoryDensity: number;
    setTrajectoryDensity: (density: number) => void;
    fullPredictionFidelity: boolean;
    setFullPredictionFidelity: (fidelity: boolean) => void;
    enableShipSizeGuide: boolean;
    setEnableShipSizeGuide: (enable: boolean) => void;
    shipSizeGuideImage: HTMLImageElement | null;
    setShipSizeGuideImage: (image: HTMLImageElement | null) => void;
    showTrajectoryDots: boolean;
    setShowTrajectoryDots: (show: boolean) => void;
    showPredictionDots: boolean;
    setShowPredictionDots: (show: boolean) => void;
    drawConfig: DrawConfig;
    setDrawConfig: (config: DrawConfig) => void;
    imageOverlays: Record<string, GeoImage>;
    setImageOverlays: React.Dispatch<React.SetStateAction<Record<string, GeoImage>>>;
    imageOpacities: ImageOpacities;
    setImageOpacities: React.Dispatch<React.SetStateAction<ImageOpacities>>;
    showImageOverlay: Record<string, boolean>;
    setShowImageOverlay: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    projection: Projection;
    setProjection: (projection: Projection) => void;
    zoom: number;
    setZoom: (zoom: number) => void;
    center: [number, number];
    setCenter: (latlng: [number, number]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: JSX.Element }) => {
    const [eezDKOutlineVisible, setDKEezOutlineVisible] = useLocalStorageState('eezDKOutlineVisible', false);
    const [eezUSOutlineVisible, setEezUSOutlineVisible] = useLocalStorageState('eezUSOutlineVisible', false);
    const [fullTrajectoryFidelity, setFullTrajectoryFidelity] = useLocalStorageState('fullTrajectoryFidelity', false);
    const [fullEezFidelity, setFullEezFidelity] = useLocalStorageState('fullEezFidelity', false);
    const [showMapTiles, setShowMapTiles] = useLocalStorageState('showMapTiles', true);
    const [fullPredictionFidelity, setFullPredictionFidelity] = useLocalStorageState('fullPredictionFidelity', false);
    const [showModelPredictions, setShowModelPredictions] = useLocalStorageState<Record<string, boolean>>('showModelPredictions', {});
    const [showLabels, setShowLabels] = useLocalStorageState<Record<string, boolean>>('showLabels', {});
    const [enableShipSizeGuide, setEnableShipSizeGuide] = useLocalStorageState('enableShipSizeGuide', false);
    const [showTrajectoryDots, setShowTrajectoryDots] = useLocalStorageState('showTrajectoryDots', true);
    const [showPredictionDots, setShowPredictionDots] = useLocalStorageState('showPredictionDots', true);
    const [trajectoryDensity, setTrajectoryDensity] = useLocalStorageState('trajectoryDensity', 0.1);
    const [imageOverlays, setImageOverlays] = useState<Record<string, GeoImage>>({});
    const [showImageOverlay, setShowImageOverlay] = useLocalStorageState<Record<string, boolean>>('showImageOverlay', {});
    const [projection, setProjection] = useLocalStorageState<Projection>('projection', Projection.EPSG3857);
    const [zoom, setZoom] = useState<number>(5);
    const [center, setCenter] = useState<[number, number]>([56.15674, 10.21076]);
    const [imageOpacities, setImageOpacities] = useLocalStorageState<ImageOpacities>('imageOpacities', {});

    const [polygonsDK, setPolygonsDK] = useState<Polygon[]>([]);
    const [polygonsUS, setPolygonsUS] = useState<Polygon[]>([]);
    const [modelPredictions, setModelPredictions] = useState<Record<string, Trajectory[]>>({});
    const [labels, setLabels] = useState<Record<string, Trajectory[]>>({});
    const [shipSizeGuideImage, setShipSizeGuideImage] = useState<HTMLImageElement | null>(null);
    const [drawConfig, setDrawConfig] = useState<DrawConfig>({
        colors: {
            label: "rgba(0,100,255)",
            prediction: "rgba(255,0,0)",
            polygonStroke: "orange",
            start: "green",
            end: "red",
        },
        dotsZoom: 8,
        radiusScale: 3,
        lineWidthScale: 2,
        dashPattern: [4, 4],
    });


    const value: AppContextType = {
        polygonsDK: polygonsDK,
        setPolygonsDK: setPolygonsDK,
        polygonsUS: polygonsUS,
        setPolygonsUS: setPolygonsUS,
        eezDKOutlineVisible: eezDKOutlineVisible,
        setEezDKOutlineVisible: setDKEezOutlineVisible,
        eezUSOutlineVisible: eezUSOutlineVisible,
        setEezUSOutlineVisible: setEezUSOutlineVisible,
        fullTrajectoryFidelity,
        setFullTrajectoryFidelity,
        fullEezFidelity,
        setFullEezFidelity,
        showMapTiles,
        setShowMapTiles,
        showModelPredictions,
        setShowModelPredictions,
        modelPredictions,
        setModelPredictions,
        showLabels,
        setShowLabels,
        labels,
        setLabels,
        trajectoryDensity,
        setTrajectoryDensity,
        fullPredictionFidelity,
        setFullPredictionFidelity,
        enableShipSizeGuide,
        setEnableShipSizeGuide,
        shipSizeGuideImage,
        setShipSizeGuideImage,
        showTrajectoryDots,
        setShowTrajectoryDots,
        showPredictionDots,
        setShowPredictionDots,
        drawConfig,
        setDrawConfig,
        imageOverlays,
        setImageOverlays,
        imageOpacities,
        setImageOpacities,
        projection,
        setProjection,
        showImageOverlay,
        setShowImageOverlay,
        zoom,
        setZoom,
        center,
        setCenter,
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