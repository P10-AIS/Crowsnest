import { useEffect, type JSX } from "react";
import { useAppContext } from "../contexts/AppContext";
import { parseTrajectory } from "../utils/parse";
import { prepareEecPolygons, prepareTrajectories } from "../utils/prepare";
import eecData from '../assets/eec.json';


function DataLoader({ children }: { children: JSX.Element }) {
    const ctx = useAppContext();

    useEffect(() => {
        const fetchLatestTrajectory = async () => {
            try {
                const response = await fetch('http://localhost:4000/latest');
                const data = await response.json();
                const { trajectory } = data;
                const parsed = parseTrajectory(trajectory);
                const zoomed = prepareTrajectories(parsed);
                ctx.setTrajectories(zoomed);
                ctx.setNumTrajectoriesVisible(zoomed[1].length);
            } catch (err) {
                console.error('Failed to fetch trajectory:', err);
            }
        };
        fetchLatestTrajectory()

    }, []);

    useEffect(() => {
        ctx.setPolygons(prepareEecPolygons(eecData.features[0].geometry.coordinates));
    }, []);

    return children;
}

export default DataLoader;