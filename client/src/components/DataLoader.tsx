import { useEffect, type JSX } from "react";
import { useAppContext } from "../contexts/AppContext";
import { parseMultiPolygon } from "../utils/parse";
import { prepareEezPolygons } from "../utils/prepare";
import eezDataDK from '../assets/eez.json';
import eezDataUS from '../assets/eezUS.json';
import type { GeoImage } from "../types/GeoImage";
import shipPng from "../assets/boat.png";

// ---------------------------------------------------------------------------
// Image loader
// ---------------------------------------------------------------------------

async function fetchMapImage(imageName: string): Promise<GeoImage> {
    const response = await fetch(`/api/image/${imageName}`);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

    const metadataRaw = response.headers.get("x-image-metadata");
    const data = JSON.parse(metadataRaw || "{}");

    const blob = await response.blob();
    const objectURL = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = objectURL;
        img.onload = () =>
            resolve({
                img,
                area: {
                    topRight: { lat: data.area.top_right.lat, lng: data.area.top_right.lon },
                    bottomLeft: { lat: data.area.bottom_left.lat, lng: data.area.bottom_left.lon },
                },
                projection: data.projection,
            });
        img.onerror = reject;
    });
}

// ---------------------------------------------------------------------------
// DataLoader — handles one-time static data only.
// Trajectory loading is now done in MapController via useLoadTrajectories.
// ---------------------------------------------------------------------------

function DataLoader({ children }: { children: JSX.Element }) {
    const ctx = useAppContext();

    useEffect(() => {
        const parsed = parseMultiPolygon(eezDataDK.features[0].geometry.coordinates);
        ctx.setPolygonsDK(prepareEezPolygons(parsed));
    }, []);

    useEffect(() => {
        const parsed = parseMultiPolygon(eezDataUS.features[0].geometry.coordinates);
        ctx.setPolygonsUS(prepareEezPolygons(parsed));
    }, []);

    useEffect(() => {
        const img = new Image();
        img.src = shipPng;
        img.onload = () => ctx.setShipSizeGuideImage(img);
    }, []);

    useEffect(() => {
        const loadAllImages = async () => {
            try {
                const res = await fetch("/api/images");
                const data = await res.json();
                for (const imageName of data.images) {
                    try {
                        const image = await fetchMapImage(imageName);
                        ctx.setImageOverlays(prev => ({ ...prev, [imageName]: image }));
                    } catch (err) {
                        console.error(`Failed to load image ${imageName}:`, err);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch image list:", err);
            }
        };
        loadAllImages();
    }, []);

    return children;
}

export default DataLoader;