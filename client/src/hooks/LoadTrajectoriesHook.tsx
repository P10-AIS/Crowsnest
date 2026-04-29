import { useCallback, useRef } from "react";
import { useAppContext } from "../contexts/AppContext";
import type { RawTrajectory } from "../utils/draw";

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

// ---------------------------------------------------------------------------
// NDJSON streaming
// ---------------------------------------------------------------------------

async function streamTrajectories(
    url: string,
    onHeader: (source: string, total: number) => void,
    onTrajectory: (pts: RawTrajectory) => void,
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

// Builds query string including a density-derived limit for one model/dataset.
// totalCount comes from the /api/predictions or /api/labels list endpoint.
function buildQuery(vp: Viewport, density: number, totalCount: number): string {
    const limit = Math.max(1, Math.ceil(totalCount * density));
    return new URLSearchParams({
        lat_min: String(vp.latMin),
        lat_max: String(vp.latMax),
        lon_min: String(vp.lonMin),
        lon_max: String(vp.lonMax),
        zoom: String(vp.zoom),
        limit: String(limit),
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
        showModelPredictions,
        showLabels,
        trajectoryDensity,
    } = useAppContext();

    const abortRefs = useRef<Map<string, AbortController>>(new Map());

    return useCallback(async (viewport: Viewport) => {
        // Cancel all in-flight streams from the previous viewport
        for (const [, controller] of abortRefs.current) {
            controller.abort();
        }
        abortRefs.current.clear();

        // Fetch available model/dataset names + total counts (cheap, browser-cached)
        // Response shape: { modelName: { count: number }, ... }
        let predRes: Record<string, { count: number }> = {};
        let labelRes: Record<string, { count: number }> = {};

        try {
            [predRes, labelRes] = await Promise.all([
                fetch("/api/predictions").then(r => r.json()),
                fetch("/api/labels").then(r => r.json()),
            ]);
        } catch (err) {
            console.error("Failed to fetch model/dataset names:", err);
            return;
        }

        // Register any newly discovered models/datasets as off by default
        setShowModelPredictions(prev => {
            const updates: Record<string, boolean> = {};
            for (const name of Object.keys(predRes)) {
                if (!(name in prev)) updates[name] = false;
            }
            return Object.keys(updates).length ? { ...prev, ...updates } : prev;
        });

        setShowLabels(prev => {
            const updates: Record<string, boolean> = {};
            for (const name of Object.keys(labelRes)) {
                if (!(name in prev)) updates[name] = false;
            }
            return Object.keys(updates).length ? { ...prev, ...updates } : prev;
        });

        // ── Predictions ────────────────────────────────────────────────────

        for (const modelName of Object.keys(predRes)) {
            if (!showModelPredictions[modelName]) continue;

            const controller = new AbortController();
            abortRefs.current.set(`pred:${modelName}`, controller);

            // Each model gets its own query with its own count → its own limit
            const query = buildQuery(viewport, trajectoryDensity, predRes[modelName].count);

            setModelPredictions(prev => ({ ...prev, [modelName]: [] }));

            streamTrajectories(
                `/api/predictions/${modelName}?${query}`,
                (source, total) => {
                    console.debug(`[predictions] ${source}: streaming ${total} trajectories`);
                },
                (pts) => {
                    setModelPredictions(prev => ({
                        ...prev,
                        [modelName]: [...(prev[modelName] ?? []), pts],
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

        for (const datasetName of Object.keys(labelRes)) {
            if (!showLabels[datasetName]) continue;

            const controller = new AbortController();
            abortRefs.current.set(`label:${datasetName}`, controller);

            const query = buildQuery(viewport, trajectoryDensity, labelRes[datasetName].count);

            setLabels(prev => ({ ...prev, [datasetName]: [] }));

            streamTrajectories(
                `/api/labels/${datasetName}?${query}`,
                (source, total) => {
                    console.debug(`[labels] ${source}: streaming ${total} trajectories`);
                },
                (pts) => {
                    setLabels(prev => ({
                        ...prev,
                        [datasetName]: [...(prev[datasetName] ?? []), pts],
                    }));
                },
                controller.signal,
            ).catch(err => {
                if (err.name !== "AbortError") {
                    console.error(`Failed streaming labels '${datasetName}':`, err);
                }
            });
        }
    }, [
        setModelPredictions,
        setLabels,
        setShowModelPredictions,
        setShowLabels,
        showModelPredictions,
        showLabels,
        trajectoryDensity,
    ]);
}