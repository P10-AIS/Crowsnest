import { createContext, useContext, useState, type JSX } from 'react';
import type { Polygon } from '../types/Polygon';
import type { Trajectory } from '../types/Trajectory';
import type { GeoImage } from '../types/GeoImage';
import type { Prediction } from '../types/Prediction';
import { useLocalStorageState } from './LocalStorageState';
import type { DrawConfig } from '../types/DrawConfig';

interface AppContextType {
    trajectories: Trajectory[];
    setTrajectories: (trajectories: Trajectory[]) => void;
    polygons: Polygon[];
    setPolygons: (polygons: Polygon[]) => void;
    eezOutlineVisible: boolean;
    setEezOutlineVisible: (visible: boolean) => void;
    trajectoriesVisible: boolean;
    setTrajectoriesVisible: (visible: boolean) => void;
    numTrajectoriesVisible: number;
    setNumTrajectoriesVisible: (num: number) => void;
    fullTrajectoryFidelity: boolean;
    setFullTrajectoryFidelity: (fidelity: boolean) => void;
    fullEezFidelity: boolean;
    setFullEezFidelity: (fidelity: boolean) => void;
    depthImage3034: GeoImage | null;
    setDepthImage3034: (image: GeoImage | null) => void;
    bwDepthImage3034: GeoImage | null;
    setBWDepthImage3034: (image: GeoImage | null) => void;
    bwDepthImage3857: GeoImage | null;
    setBWDepthImage3857: (image: GeoImage | null) => void;
    depthImage3857: GeoImage | null;
    setDepthImage3857: (image: GeoImage | null) => void;
    trafficImage3034: GeoImage | null;
    setTrafficImage3034: (image: GeoImage | null) => void;
    trafficImage3857: GeoImage | null;
    setTrafficImage3857: (image: GeoImage | null) => void;
    showMapTiles: boolean;
    setShowMapTiles: (show: boolean) => void;
    showDepthImage: boolean;
    setShowDepthImage: (show: boolean) => void;
    showBWDepthImage: boolean;
    setShowBWDepthImage: (show: boolean) => void;
    showTrafficImage: boolean;
    setShowTrafficImage: (show: boolean) => void;
    depthImageOpacity: number;
    setDepthImageOpacity: (opacity: number) => void;
    bwDepthImageOpacity: number;
    setBWDepthImageOpacity: (opacity: number) => void;
    trafficImageOpacity: number;
    setTrafficImageOpacity: (opacity: number) => void;
    showESPG3034: boolean;
    setShowESPG3034: (show: boolean) => void;
    showModelPredictions: Record<string, boolean>;
    setShowModelPredictions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    modelPredictions: Record<string, Prediction[]>;
    setModelPredictions: React.Dispatch<React.SetStateAction<Record<string, Prediction[]>>>;
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
    showPredictionCorrectionLines: boolean;
    setShowPredictionCorrectionLines: (show: boolean) => void;
    showGroundTruth: boolean;
    setShowGroundTruth: (show: boolean) => void;
    drawConfig: DrawConfig;
    setDrawConfig: (config: DrawConfig) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: JSX.Element }) => {
    const [eezOutlineVisible, setEezOutlineVisible] = useLocalStorageState('eezOutlineVisible', true);
    const [trajectoriesVisible, setTrajectoriesVisible] = useLocalStorageState('trajectoriesVisible', true);
    const [fullTrajectoryFidelity, setFullTrajectoryFidelity] = useLocalStorageState('fullTrajectoryFidelity', false);
    const [fullEezFidelity, setFullEezFidelity] = useLocalStorageState('fullEezFidelity', false);
    const [showMapTiles, setShowMapTiles] = useLocalStorageState('showMapTiles', true);
    const [showDepthImage, setShowDepthImage] = useLocalStorageState('showDepthImage', false);
    const [showBWDepthImage, setShowBWDepthImage] = useLocalStorageState('showBWDepthImage', false);
    const [showTrafficImage, setShowTrafficImage] = useLocalStorageState('showTrafficImage', false);
    const [depthImageOpacity, setDepthImageOpacity] = useLocalStorageState('depthImageOpacity', 1);
    const [bwDepthImageOpacity, setBWDepthImageOpacity] = useLocalStorageState('bwDepthImageOpacity', 1);
    const [trafficImageOpacity, setTrafficImageOpacity] = useLocalStorageState('trafficImageOpacity', 1);
    const [showESPG3034, setShowESPG3034] = useLocalStorageState('showESPG3034', true);
    const [fullPredictionFidelity, setFullPredictionFidelity] = useLocalStorageState('fullPredictionFidelity', false);
    const [showModelPredictions, setShowModelPredictions] = useLocalStorageState<Record<string, boolean>>('showModelPredictions', {});
    const [enableShipSizeGuide, setEnableShipSizeGuide] = useLocalStorageState('enableShipSizeGuide', false);
    const [showTrajectoryDots, setShowTrajectoryDots] = useLocalStorageState('showTrajectoryDots', true);
    const [showPredictionDots, setShowPredictionDots] = useLocalStorageState('showPredictionDots', true);
    const [showPredictionCorrectionLines, setShowPredictionCorrectionLines] = useLocalStorageState('showPredictionCorrectionLines', true);
    const [showGroundTruth, setShowGroundTruth] = useLocalStorageState('showGroundTruth', true);

    const [trajectories, setTrajectories] = useState<Trajectory[]>([]);
    const [numTrajectoriesVisible, setNumTrajectoriesVisible] = useState(0);
    const [polygons, setPolygons] = useState<Polygon[]>([]);
    const [depthImage3034, setDepthImage3034] = useState<GeoImage | null>(null);
    const [depthImage3857, setDepthImage3857] = useState<GeoImage | null>(null);
    const [bwDepthImage3034, setBWDepthImage3034] = useState<GeoImage | null>(null);
    const [bwDepthImage3857, setBWDepthImage3857] = useState<GeoImage | null>(null);
    const [trafficImage3034, setTrafficImage3034] = useState<GeoImage | null>(null);
    const [trafficImage3857, setTrafficImage3857] = useState<GeoImage | null>(null);
    const [modelPredictions, setModelPredictions] = useState<Record<string, Prediction[]>>({});
    const [shipSizeGuideImage, setShipSizeGuideImage] = useState<HTMLImageElement | null>(null);
    const [drawConfig, setDrawConfig] = useState<DrawConfig>({
        colors: {
            true: "rgba(0,100,255)",
            masked: "rgba(255,0,0)",
            truePoints: "rgba(0,100,255)",
            truePredictedLine: "black",
            polygonStroke: "orange",
            start: "green",
            end: "red",
        },
        dotsZoom: 10,
        radiusScale: 3,
        lineWidthScale: 2,
        dashPattern: [4, 4],
    });


    const value: AppContextType = {
        trajectories,
        setTrajectories,
        polygons,
        setPolygons,
        eezOutlineVisible: eezOutlineVisible,
        setEezOutlineVisible: setEezOutlineVisible,
        trajectoriesVisible,
        setTrajectoriesVisible,
        numTrajectoriesVisible,
        setNumTrajectoriesVisible,
        fullTrajectoryFidelity,
        setFullTrajectoryFidelity,
        fullEezFidelity,
        setFullEezFidelity,
        depthImage3034: depthImage3034,
        setDepthImage3034: setDepthImage3034,
        depthImage3857: depthImage3857,
        setDepthImage3857: setDepthImage3857,
        bwDepthImage3034: bwDepthImage3034,
        setBWDepthImage3034: setBWDepthImage3034,
        bwDepthImage3857: bwDepthImage3857,
        setBWDepthImage3857: setBWDepthImage3857,
        trafficImage3034: trafficImage3034,
        setTrafficImage3034: setTrafficImage3034,
        trafficImage3857: trafficImage3857,
        setTrafficImage3857: setTrafficImage3857,
        showMapTiles,
        setShowMapTiles,
        showDepthImage,
        setShowDepthImage,
        depthImageOpacity,
        setDepthImageOpacity,
        bwDepthImageOpacity,
        setBWDepthImageOpacity,
        showBWDepthImage,
        setShowBWDepthImage,
        showTrafficImage,
        setShowTrafficImage,
        trafficImageOpacity,
        setTrafficImageOpacity,
        showESPG3034,
        setShowESPG3034,
        showModelPredictions,
        setShowModelPredictions,
        modelPredictions,
        setModelPredictions,
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
        showPredictionCorrectionLines,
        setShowPredictionCorrectionLines,
        showGroundTruth,
        setShowGroundTruth,
        drawConfig,
        setDrawConfig,
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