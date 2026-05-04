import { useEffect, type JSX } from "react";
import { useAppContext } from "../contexts/AppContext";
import { parseMultiPolygon } from "../utils/parse";
import { prepareEezPolygons } from "../utils/prepare";
import eezDataDK from '../assets/eez.json';
import eezDataUS from '../assets/eezUS.json';
import type { GeoImage } from "../types/GeoImage";
import shipPng from "../assets/boat.png";

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

function DataLoader({ children }: { children: JSX.Element }) {
    const ctx = useAppContext();

    useEffect(() => {
        const discoverNames = async () => {
            try {
                const [predRes, labelRes] = await Promise.all([
                    fetch("/api/predictions").then(r => r.json()),
                    fetch("/api/labels").then(r => r.json()),
                ]);

                // Register prediction toggles (default off)
                ctx.setShowModelPredictions(prev => {
                    const updates: Record<string, boolean> = {};
                    for (const name of Object.keys(predRes)) {
                        if (!(name in prev)) updates[name] = false;
                    }
                    return Object.keys(updates).length ? { ...prev, ...updates } : prev;
                });

                // Register label toggles (default off)
                ctx.setShowLabels(prev => {
                    const updates: Record<string, boolean> = {};
                    for (const name of Object.keys(labelRes)) {
                        if (!(name in prev)) updates[name] = false;
                    }
                    return Object.keys(updates).length ? { ...prev, ...updates } : prev;
                });

                // Historic horizon
                ctx.setHistoricHorizonM(prev => {
                    const updates: Record<string, number | null> = {};
                    for (const name of Object.keys(predRes)) {
                        if (!(name in prev)) updates[name] = predRes[name].historic_horizon_m ?? null;
                    }
                    return Object.keys(updates).length ? { ...prev, ...updates } : prev;
                });

                // Force counts
                ctx.setNumForces(prev => {
                    const updates: Record<string, number> = {};
                    for (const name of Object.keys(predRes)) {
                        if (!(name in prev)) updates[name] = predRes[name].num_forces ?? 0;
                    }
                    return Object.keys(updates).length ? { ...prev, ...updates } : prev;
                });

                // Force names
                ctx.setForceNames(prev => {
                    const updates: Record<string, string[]> = {};
                    for (const name of Object.keys(predRes)) {
                        if (!(name in prev)) updates[name] = predRes[name].force_names ?? [];
                    }
                    return Object.keys(updates).length ? { ...prev, ...updates } : prev;
                });

                // Force config — scale + per-component enabled, default all on
                ctx.setForceConfig(prev => {
                    const updates: Record<string, { scale: number; enabled: boolean[] }> = {};
                    for (const name of Object.keys(predRes)) {
                        if (!(name in prev)) {
                            const n = predRes[name].num_forces ?? 0;
                            updates[name] = { scale: 20, enabled: new Array(n).fill(true) };
                        }
                    }
                    return Object.keys(updates).length ? { ...prev, ...updates } : prev;
                });

            } catch (err) {
                console.error("Failed to discover model/dataset names:", err);
            }
        };
        discoverNames();
    }, []);

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