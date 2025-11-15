import { createContext, useContext, useState, type JSX } from 'react';
import type { Polygon } from '../types/Polygon';
import type { ZoomLevels } from '../types/ZoomLevels';
import type { Trajectory } from '../types/Trajectory';
import type { GeoImage } from '../types/GeoImage';

interface AppContextType {
    trajectories: ZoomLevels<Trajectory[]>;
    setTrajectories: (trajectories: ZoomLevels<Trajectory[]>) => void;
    polygons: ZoomLevels<Polygon[]>;
    setPolygons: (polygons: ZoomLevels<Polygon[]>) => void;
    eecOutlineVisible: boolean;
    setEecOutlineVisible: (visible: boolean) => void;
    trajectoriesVisible: boolean;
    setTrajectoriesVisible: (visible: boolean) => void;
    numTrajectoriesVisible: number;
    setNumTrajectoriesVisible: (num: number) => void;
    fullTrajectoryFidelity: boolean;
    setFullTrajectoryFidelity: (fidelity: boolean) => void;
    depthImage: GeoImage | null;
    setDepthImage: (image: GeoImage | null) => void;
    showMapTiles: boolean;
    setShowMapTiles: (show: boolean) => void;
    showDepthImage: boolean;
    setShowDepthImage: (show: boolean) => void;
    depthImageOpacity: number;
    setDepthImageOpacity: (opacity: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: JSX.Element }) => {
    const [trajectories, setTrajectories] = useState<ZoomLevels<Trajectory[]>>([]);
    const [polygons, setPolygons] = useState<ZoomLevels<Polygon[]>>([]);
    const [eecOutlineVisible, setEecOutlineVisible] = useState(true);
    const [trajectoriesVisible, setTrajectoriesVisible] = useState(true);
    const [numTrajectoriesVisible, setNumTrajectoriesVisible] = useState(0);
    const [fullTrajectoryFidelity, setFullTrajectoryFidelity] = useState(false);
    const [depthImage, setDepthImage] = useState<GeoImage | null>(null);
    const [showMapTiles, setShowMapTiles] = useState(true);
    const [showDepthImage, setShowDepthImage] = useState(false);
    const [depthImageOpacity, setDepthImageOpacity] = useState(1);

    const value: AppContextType = {
        trajectories,
        setTrajectories,
        polygons,
        setPolygons,
        eecOutlineVisible,
        setEecOutlineVisible,
        trajectoriesVisible,
        setTrajectoriesVisible,
        numTrajectoriesVisible,
        setNumTrajectoriesVisible,
        fullTrajectoryFidelity,
        setFullTrajectoryFidelity,
        depthImage,
        setDepthImage,
        showMapTiles,
        setShowMapTiles,
        showDepthImage,
        setShowDepthImage,
        depthImageOpacity,
        setDepthImageOpacity,
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