import { createContext, useContext, useState, type JSX } from 'react';
import type { Polygon } from '../types/Polygon';
import type { ZoomLevels } from '../types/ZoomLevels';
import type { Trajectory } from '../types/Trajectory';
import type { GeoImage } from '../types/GeoImage';
import type { PredictionStep } from '../types/Prediction';

interface AppContextType {
    trajectories: ZoomLevels<Trajectory[]>;
    setTrajectories: (trajectories: ZoomLevels<Trajectory[]>) => void;
    polygons: ZoomLevels<Polygon[]>;
    setPolygons: (polygons: ZoomLevels<Polygon[]>) => void;
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
    showTrafficImage: boolean;
    setShowTrafficImage: (show: boolean) => void;
    depthImageOpacity: number;
    setDepthImageOpacity: (opacity: number) => void;
    trafficImageOpacity: number;
    setTrafficImageOpacity: (opacity: number) => void;
    showESPG3034: boolean;
    setShowESPG3034: (show: boolean) => void;
    showPredictionSteps: boolean;
    setShowPredictionSteps: (show: boolean) => void;
    predictionSteps: ZoomLevels<PredictionStep>[];
    setPredictionSteps: (steps: ZoomLevels<PredictionStep>[]) => void;
    currentPredictionStep: number;
    setCurrentPredictionStep: (step: number) => void;
    fullPredictionFidelity: boolean;
    setFullPredictionFidelity: (fidelity: boolean) => void;
    enableShipSizeGuide: boolean;
    setEnableShipSizeGuide: (enable: boolean) => void;
    shipSizeGuideImage: HTMLImageElement | null;
    setShipSizeGuideImage: (image: HTMLImageElement | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: JSX.Element }) => {
    const [trajectories, setTrajectories] = useState<ZoomLevels<Trajectory[]>>([]);
    const [polygons, setPolygons] = useState<ZoomLevels<Polygon[]>>([]);
    const [eezOutlineVisible, setEezOutlineVisible] = useState(true);
    const [trajectoriesVisible, setTrajectoriesVisible] = useState(true);
    const [numTrajectoriesVisible, setNumTrajectoriesVisible] = useState(0);
    const [fullTrajectoryFidelity, setFullTrajectoryFidelity] = useState(false);
    const [fullEezFidelity, setFullEezFidelity] = useState(false);
    const [depthImage3034, setDepthImage3034] = useState<GeoImage | null>(null);
    const [depthImage3857, setDepthImage3857] = useState<GeoImage | null>(null);
    const [trafficImage3034, setTrafficImage3034] = useState<GeoImage | null>(null);
    const [trafficImage3857, setTrafficImage3857] = useState<GeoImage | null>(null);
    const [showMapTiles, setShowMapTiles] = useState(true);
    const [showDepthImage, setShowDepthImage] = useState(false);
    const [showTrafficImage, setShowTrafficImage] = useState(false);
    const [depthImageOpacity, setDepthImageOpacity] = useState(1);
    const [trafficImageOpacity, setTrafficImageOpacity] = useState(1);
    const [showESPG3034, setShowESPG3034] = useState(true);
    const [showPredictionSteps, setShowPredictionSteps] = useState(false);
    const [predictionSteps, setPredictionSteps] = useState<ZoomLevels<PredictionStep>[]>([]);
    const [currentPredictionStep, setCurrentPredictionStep] = useState(0);
    const [fullPredictionFidelity, setFullPredictionFidelity] = useState(false);
    const [enableShipSizeGuide, setEnableShipSizeGuide] = useState(false);
    const [shipSizeGuideImage, setShipSizeGuideImage] = useState<HTMLImageElement | null>(null);

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
        showTrafficImage,
        setShowTrafficImage,
        trafficImageOpacity,
        setTrafficImageOpacity,
        showESPG3034,
        setShowESPG3034,
        showPredictionSteps,
        setShowPredictionSteps,
        predictionSteps,
        setPredictionSteps,
        currentPredictionStep,
        setCurrentPredictionStep,
        fullPredictionFidelity,
        setFullPredictionFidelity,
        enableShipSizeGuide,
        setEnableShipSizeGuide,
        shipSizeGuideImage,
        setShipSizeGuideImage,
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