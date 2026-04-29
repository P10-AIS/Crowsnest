import { useCallback, useRef } from "react";
import { useAppContext } from "../contexts/AppContext";
import type { Trajectory } from "../types/Prediction";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Viewport {
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
    zoom: number;
}

type RawPoint = [number, number, number]; // [lat, lon, timestamp]

// ---------------------------------------------------------------------------
// NDJSON streaming
// ---------------------------------------------------------------------------

async function streamTrajectories(
    url: string,
    onHeader: (source: string, total: number) => void,
    onTrajectory: (pts: RawPoint[]) => void,
    signal: AbortSignal,
): Promise<void> {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Stream request failed: ${response.status}`);
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
                const msg = JSON.parse(trimmed);
                if (msg.type === "header") onHeader(msg.source, msg.total);
                else if (msg.type === "traj") onTrajectory(msg.pts);
            } catch {
                console.warn("Failed to parse NDJSON line:", trimmed);
            }
        }
    }
}

function viewportQuery(vp: Viewport): string {
    return new URLSearchParams({
        lat_min: String(vp.latMin),
        lat_max: String(vp.latMax),
        lon_min: String(vp.lonMin),
        lon_max: String(vp.lonMax),
        zoom: String(vp.zoom),
    }).toString();
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLoadTrajectories() {
    const {
        setModelPredictions,
        setLabels,
        setShowModelPredictions,
        setShowLabels,
    } = useAppContext();

    // One AbortController per active stream, keyed by "pred:modelName" etc.
    const abortRefs = useRef<Map<string, AbortController>>(new Map());

    return useCallback(async (viewport: Viewport) => {
        // Cancel all in-flight streams from previous viewport
        for (const [, controller] of abortRefs.current) {
            controller.abort();
        }
        abortRefs.current.clear();

        const query = viewportQuery(viewport);

        // Fetch available model/dataset names (tiny, browser-cached)
        let predNames: string[] = [];
        let labelNames: string[] = [];

        try {
            const [predRes, labelRes] = await Promise.all([
                fetch("/api/predictions").then(r => r.json()),
                fetch("/api/labels").then(r => r.json()),
            ]);
            predNames = Object.keys(predRes);
            labelNames = Object.keys(labelRes);
        } catch (err) {
            console.error("Failed to fetch model/dataset names:", err);
            return;
        }

        // ── Predictions ────────────────────────────────────────────────────

        for (const modelName of predNames) {
            const controller = new AbortController();
            abortRefs.current.set(`pred:${modelName}`, controller);

            // Clear existing data and ensure toggle entry exists
            setModelPredictions(prev => ({ ...prev, [modelName]: [] }));
            setShowModelPredictions(prev => ({
                ...prev,
                // Only set to true on first encounter, don't override user toggle
                [modelName]: prev[modelName] ?? false,
            }));

            streamTrajectories(
                `/api/predictions/${modelName}?${query}`,
                (source, total) => {
                    console.debug(`[predictions] ${source}: expecting ${total} trajectories`);
                },
                (pts) => {
                    // Cast raw [lat, lon, ts] arrays to Trajectory — adapt if your
                    // Trajectory type has a different shape
                    setModelPredictions(prev => ({
                        ...prev,
                        [modelName]: [...(prev[modelName] ?? []), pts as unknown as Trajectory],
                    }));
                },
                controller.signal,
            ).catch(err => {
                if (err.name !== "AbortError") {
                    console.error(`Failed streaming predictions '${modelName}':`, err);
                }
            });
        }

        // ── Labels ─────────────────────────────────────────────────────────

        for (const datasetName of labelNames) {
            const controller = new AbortController();
            abortRefs.current.set(`label:${datasetName}`, controller);

            setLabels(prev => ({ ...prev, [datasetName]: [] }));
            setShowLabels(prev => ({
                ...prev,
                [datasetName]: prev[datasetName] ?? false,
            }));

            streamTrajectories(
                `/api/labels/${datasetName}?${query}`,
                (source, total) => {
                    console.debug(`[labels] ${source}: expecting ${total} trajectories`);
                },
                (pts) => {
                    setLabels(prev => ({
                        ...prev,
                        [datasetName]: [...(prev[datasetName] ?? []), pts as unknown as Trajectory],
                    }));
                },
                controller.signal,
            ).catch(err => {
                if (err.name !== "AbortError") {
                    console.error(`Failed streaming labels '${datasetName}':`, err);
                }
            });
        }
    }, [setModelPredictions, setLabels, setShowModelPredictions, setShowLabels]);
}