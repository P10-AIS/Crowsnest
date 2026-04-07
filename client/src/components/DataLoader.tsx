import { useEffect, type JSX } from "react";
import { useAppContext } from "../contexts/AppContext";
import { parseMultiPolygon, parsePoints } from "../utils/parse";
import { prepareEezPolygons, preparePoints } from "../utils/prepare";
import eezDataDK from '../assets/eez.json';
import eezDataUS from '../assets/eezUS.json';
import type { GeoImage } from "../types/GeoImage";
import shipPng from "../assets/boat.png";


async function fetchMapImage(imageName: string): Promise<GeoImage> {
    const response = await fetch(`/api/image/${imageName}`);
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
                opacity: 1,
                projection: data.projection,
            });
        };
        img.onerror = reject;
    });
}


function DataLoader({ children }: { children: JSX.Element }) {
    const ctx = useAppContext();
    useEffect(() => {
        const loadAllImages = async () => {
            try {
                const mapNames = await fetch("/api/images");
                const data = await mapNames.json();
                for (const imageName of data.images) {
                    try {
                        const image = await fetchMapImage(imageName);
                        ctx.setImageOverlays(prev => ({
                            ...prev,
                            [imageName]: image,
                        }));
                    } catch (err) {
                        console.error(`Failed to load image ${imageName}:`, err);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch image list:", err);
            }
        }
        loadAllImages()
    }, []);

    useEffect(() => {
        const parsed = parseMultiPolygon(eezDataDK.features[0].geometry.coordinates);
        const zoomed = prepareEezPolygons(parsed);
        ctx.setPolygonsDK(zoomed);
    }, []);
    
    useEffect(() => {
        const parsed = parseMultiPolygon(eezDataUS.features[0].geometry.coordinates); //ignore error...
        const zoomed = prepareEezPolygons(parsed);
        ctx.setPolygonsUS(zoomed);
    }, []);

    useEffect(() => {
        const fetchModelsAndPredictions = async () => {
            try {
                const predictionsRes = await fetch('/api/predictions');
                
                const responseData = await predictionsRes.json();
                const predictions = responseData.points;

                for (const model in predictions) {
                    const data = predictions[model];
                    const parsed = parsePoints(data);
                    const zoomed = preparePoints(parsed);
                    
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
        const fetchLabels = async () => {
            try {
                const labelsRes = await fetch('/api/labels');
                
                const responseData = await labelsRes.json();
                const labels = responseData.points;

                for (const dataset in labels) {
                    const data = labels[dataset];
                    const parsed = parsePoints(data);
                    const zoomed = preparePoints(parsed);
                    
                    ctx.setLabels((prev) => ({
                        ...prev,
                        [dataset]: zoomed,
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch labels:', err);
            }
        };

        fetchLabels();
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