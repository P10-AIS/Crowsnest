import { useEffect, type JSX } from "react";
import { useAppContext } from "../contexts/AppContext";
import { parsePredictions, parseTrajectory } from "../utils/parse";
import { prepareEezPolygons, preparePredictions, prepareTrajectories } from "../utils/prepare";
import eezData from '../assets/eez.json';
import type { GeoImage } from "../types/GeoImage";
import shipPng from "../assets/boat.png";


async function fetchMapImage(imageName: string): Promise<GeoImage> {
    const response = await fetch(`http://localhost:4000/image/${imageName}`);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

    const data = await response.json();

    const img = new Image();
    img.src = `data:${data.mimeType};base64,${data.data}`;

    return new Promise((resolve, reject) => {
        img.onload = () => {
            resolve({
                img,
                area: {
                    topRight: {
                        lat: data.area.top_right.lat,
                        lng: data.area.top_right.lon,
                    },
                    bottomLeft: {
                        lat: data.area.bottom_left.lat,
                        lng: data.area.bottom_left.lon,
                    },
                },
            });
        };
        img.onerror = reject;
    });
}


function DataLoader({ children }: { children: JSX.Element }) {
    const ctx = useAppContext();


    useEffect(() => {
        fetchMapImage("depth_heatmap_3034")
            .then(ctx.setDepthImage3034)
            .catch(err => console.error("Failed to load image 3034:", err));
    }, []);

    useEffect(() => {
        fetchMapImage("depth_heatmap_3857")
            .then(ctx.setDepthImage3857)
            .catch(err => console.error("Failed to load image 3857:", err));
    }, []);
    useEffect(() => {
        fetchMapImage("traffic_heatmap_3034")
            .then(ctx.setTrafficImage3034)
            .catch(err => console.error("Failed to load image 3034:", err));
    }, []);

    useEffect(() => {
        fetchMapImage("traffic_heatmap_3857")
            .then(ctx.setTrafficImage3857)
            .catch(err => console.error("Failed to load image 3857:", err));
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
                ctx.setNumTrajectoriesVisible(Math.min(zoomed[1].length, 1000));
            } catch (err) {
                console.error('Failed to fetch trajectory:', err);
            }
        };
        fetchLatestTrajectory()

    }, []);

    useEffect(() => {
        ctx.setPolygons(prepareEezPolygons(eezData.features[0].geometry.coordinates));
    }, []);

    useEffect(() => {
        const fetchModelsAndPredictions = async () => {
            try {
                const modelRes = await fetch('http://localhost:4000/predictions');
                const { models } = await modelRes.json();

                for (const model of models) {
                    const response = await fetch(
                        `http://localhost:4000/predictions/${model}`
                    );
                    const data = await response.json();

                    const parsed = parsePredictions(data);
                    const zoomed = preparePredictions(parsed);

                    ctx.setModelPredictions((prev) => ({
                        ...prev,
                        [model]: zoomed,
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch predictions:', err);
            }
        };

        fetchModelsAndPredictions();
    }, []);

    useEffect(() => {
        const img = new Image();
        img.src = shipPng;
        img.onload = () => {
            ctx.setShipSizeGuideImage(img);
        };
    }, []);

    return children;
}

export default DataLoader;