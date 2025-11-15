import { createContext, useContext, useState, type JSX } from 'react';
import type { Polygon } from '../types/Polygon';
import type { ZoomLevels } from '../types/ZoomLevels';
import type { Trajectory } from '../types/Trajectory';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: JSX.Element }) => {
    const [trajectories, setTrajectories] = useState<ZoomLevels<Trajectory[]>>([]);
    const [polygons, setPolygons] = useState<ZoomLevels<Polygon[]>>([]);
    const [eecOutlineVisible, setEecOutlineVisible] = useState(true);
    const [trajectoriesVisible, setTrajectoriesVisible] = useState(true);
    const [numTrajectoriesVisible, setNumTrajectoriesVisible] = useState(0);
    const [fullTrajectoryFidelity, setFullTrajectoryFidelity] = useState(false);

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