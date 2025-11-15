import { useEffect, type JSX } from "react";
import { useAppContext } from "../contexts/AppContext";
import { parseTrajectory } from "../utils/parse";
import { prepareEecPolygons, prepareTrajectories } from "../utils/prepare";
import eecData from '../assets/eec.json';


function DataLoader({ children }: { children: JSX.Element }) {
    const ctx = useAppContext();


    useEffect(() => {
        const fetchImage = async () => {
            try {
                const imageName = "depth_heatmap";
                const response = await fetch(`http://localhost:4000/image/${imageName}`);
                if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

                const data = await response.json();

                const img = new Image();
                img.src = `data:${data.mimeType};base64,${data.data}`;
                img.onload = () => {
                    ctx.setDepthImage({
                        name: data.name,
                        img,
                        area: {
                            topRight: {
                                lat: data.area.top_right.lat,
                                lng: data.area.top_right.lon,
                            },
                            bottomLeft: {
                                lat: data.area.bottom_left.lat,
                                lng: data.area.bottom_left.lon,
                            }
                        }
                    });
                };
            } catch (err) {
                console.error('Failed to load image:', err);
            }
        };

        fetchImage();
    }, []);

    useEffect(() => {
        const fetchLatestTrajectory = async () => {
            try {
                const response = await fetch('http://localhost:4000/trajectories');
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