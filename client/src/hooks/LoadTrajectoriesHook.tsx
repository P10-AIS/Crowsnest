import { useCallback, useRef } from "react";
import { useAppContext } from "../contexts/AppContext";
import type { RawForces, RawTrajectory } from "../utils/draw";

export interface Viewport {
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
    zoom: number;
}

const BATCH_SIZE = 50;

async function streamTrajectories(
    url: string,
    onHeader: (source: string, total: number) => void,
    onTrajectory: (pts: RawTrajectory, idx: number, forces: RawForces | null) => void,
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
                else if (msg.type === "traj") onTrajectory(msg.pts, msg.i, msg.forces ?? null);
            } catch {
                console.warn("Failed to parse NDJSON line:", trimmed);
            }
        }
    }
}

function buildQuery(vp: Viewport, density: number, totalCount: number, fullFidelity: boolean): string {
    const limit = Math.max(1, Math.ceil(totalCount * density));
    return new URLSearchParams({
        lat_min: String(vp.latMin),
        lat_max: String(vp.latMax),
        lon_min: String(vp.lonMin),
        lon_max: String(vp.lonMax),
        zoom: fullFidelity ? "18" : String(vp.zoom),
        limit: String(limit),
    }).toString();
}

export function useLoadTrajectories() {
    const {
        setModelPredictions,
        setModelForces,
        setLabels,
        showModelPredictions,
        showLabels,
        trajectoryDensity,
        fullFidelity,
    } = useAppContext();

    const abortRefs = useRef<Map<string, AbortController>>(new Map());

    return useCallback(async (viewport: Viewport) => {
        for (const [, controller] of abortRefs.current) {
            controller.abort();
        }
        abortRefs.current.clear();

        let predRes: Record<string, { count: number; num_forces: number }> = {};
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

        // ── Predictions ────────────────────────────────────────────────────

        for (const modelName of Object.keys(predRes)) {
            if (!showModelPredictions[modelName]) continue;

            const controller = new AbortController();
            abortRefs.current.set(`pred:${modelName}`, controller);

            const query = buildQuery(viewport, trajectoryDensity, predRes[modelName].count, fullFidelity);

            const receivedIds = new Set<number>();
            const trajBatch = new Map<number, RawTrajectory>();
            const forcesBatch = new Map<number, RawForces | null>();

            const flush = () => {
                if (trajBatch.size === 0) return;
                const trajSnap = new Map(trajBatch);
                const forcesSnap = new Map(forcesBatch);
                trajBatch.clear();
                forcesBatch.clear();

                setModelPredictions(prev => {
                    const next = new Map(prev[modelName] ?? []);
                    for (const [idx, pts] of trajSnap) next.set(idx, pts);
                    return { ...prev, [modelName]: next };
                });
                setModelForces(prev => {
                    const next = new Map(prev[modelName] ?? []);
                    for (const [idx, f] of forcesSnap) next.set(idx, f);
                    return { ...prev, [modelName]: next };
                });
            };

            streamTrajectories(
                `/api/predictions/${modelName}?${query}`,
                (_source, _total) => { },
                (pts, idx, forces) => {
                    receivedIds.add(idx);
                    trajBatch.set(idx, pts);
                    forcesBatch.set(idx, forces);
                    if (trajBatch.size >= BATCH_SIZE) flush();
                },
                controller.signal,
            ).then(() => {
                flush();
                setModelPredictions(prev => {
                    const next = new Map(prev[modelName] ?? []);
                    for (const key of next.keys()) if (!receivedIds.has(key)) next.delete(key);
                    return { ...prev, [modelName]: next };
                });
                setModelForces(prev => {
                    const next = new Map(prev[modelName] ?? []);
                    for (const key of next.keys()) if (!receivedIds.has(key)) next.delete(key);
                    return { ...prev, [modelName]: next };
                });
            }).catch(err => {
                if (err.name !== "AbortError") console.error(`Failed streaming predictions '${modelName}':`, err);
            });
        }

        // ── Labels ─────────────────────────────────────────────────────────

        for (const datasetName of Object.keys(labelRes)) {
            if (!showLabels[datasetName]) continue;

            const controller = new AbortController();
            abortRefs.current.set(`label:${datasetName}`, controller);

            const query = buildQuery(viewport, trajectoryDensity, labelRes[datasetName].count, fullFidelity);

            const receivedIds = new Set<number>();
            const batch = new Map<number, RawTrajectory>();

            const flush = () => {
                if (batch.size === 0) return;
                const snapshot = new Map(batch);
                batch.clear();
                setLabels(prev => {
                    const next = new Map(prev[datasetName] ?? []);
                    for (const [idx, pts] of snapshot) next.set(idx, pts);
                    return { ...prev, [datasetName]: next };
                });
            };

            streamTrajectories(
                `/api/labels/${datasetName}?${query}`,
                (_source, _total) => { },
                (pts, idx, _forces) => {
                    receivedIds.add(idx);
                    batch.set(idx, pts);
                    if (batch.size >= BATCH_SIZE) flush();
                },
                controller.signal,
            ).then(() => {
                flush();
                setLabels(prev => {
                    const next = new Map(prev[datasetName] ?? []);
                    for (const key of next.keys()) if (!receivedIds.has(key)) next.delete(key);
                    return { ...prev, [datasetName]: next };
                });
            }).catch(err => {
                if (err.name !== "AbortError") console.error(`Failed streaming labels '${datasetName}':`, err);
            });
        }
    }, [
        setModelPredictions,
        setModelForces,
        setLabels,
        showModelPredictions,
        showLabels,
        trajectoryDensity,
        fullFidelity,
    ]);
}