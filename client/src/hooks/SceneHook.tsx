import { useAppContext } from '../contexts/AppContext';
import { useLocalStorageState } from './LocalStorageState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AppSnapshot {
    eezDKOutlineVisible: boolean;
    eezUSOutlineVisible: boolean;
    fullFidelity: boolean;
    showMapTiles: boolean;
    showModelPredictions: Record<string, boolean>;
    showLabels: Record<string, boolean>;
    trajectoryDensity: number;
    enableShipSizeGuide: boolean;
    showTrajectoryDots: boolean;
    drawConfig: object;
    showImageOverlay: Record<string, boolean>;
    projection: string;
    zoom: number;
    center: [number, number];
    imageOpacities: Record<string, number>;
}

export interface Snapshot {
    id: string;
    timestamp: number;
    name: string;
    appData: AppSnapshot;
    // Which trajectory indices were in view per model at snapshot time
    inViewData: Record<string, number[]>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useSnapshotManager = () => {
    const appContext = useAppContext();
    const [snapshots, setSnapshots] = useLocalStorageState<Snapshot[]>('app_snapshots', []);

    // ── Take snapshot ───────────────────────────────────────────────────────

    const takeSnapshot = (name: string) => {
        const appData: AppSnapshot = {
            eezDKOutlineVisible: appContext.eezDKOutlineVisible,
            eezUSOutlineVisible: appContext.eezUSOutlineVisible,
            fullFidelity: appContext.fullFidelity,
            showMapTiles: appContext.showMapTiles,
            showModelPredictions: { ...appContext.showModelPredictions },
            showLabels: { ...appContext.showLabels },
            trajectoryDensity: appContext.trajectoryDensity,
            enableShipSizeGuide: appContext.enableShipSizeGuide,
            showTrajectoryDots: appContext.showTrajectoryDots,
            drawConfig: appContext.drawConfig,
            showImageOverlay: { ...appContext.showImageOverlay },
            projection: appContext.projection,
            zoom: appContext.zoom,
            center: appContext.center,
            imageOpacities: { ...appContext.imageOpacities },
        };

        // Serialise inView Sets → arrays
        const inViewData: Record<string, number[]> = {};
        for (const [key, set] of Object.entries(appContext.modelPredictionsInView)) {
            inViewData[key] = Array.from(set as Set<number>);
        }

        setSnapshots(prev => [
            ...prev,
            { id: crypto.randomUUID(), timestamp: Date.now(), name, appData, inViewData },
        ]);
    };

    // ── Restore snapshot ────────────────────────────────────────────────────

    const restoreSnapshot = (snapshot: Snapshot) => {
        const { appData } = snapshot;
        const missingKeys: string[] = [];

        // Simple scalar fields
        const simpleSetters: [keyof AppSnapshot, keyof typeof appContext][] = [
            ['eezDKOutlineVisible', 'setEezDKOutlineVisible'],
            ['eezUSOutlineVisible', 'setEezUSOutlineVisible'],
            ['fullFidelity', 'setFullFidelity'],
            ['showMapTiles', 'setShowMapTiles'],
            ['trajectoryDensity', 'setTrajectoryDensity'],
            ['enableShipSizeGuide', 'setEnableShipSizeGuide'],
            ['showTrajectoryDots', 'setShowTrajectoryDots'],
            ['drawConfig', 'setDrawConfig'],
            ['projection', 'setProjection'],
            ['zoom', 'setZoom'],
            ['center', 'setCenter'],
        ];

        for (const [dataKey, setterKey] of simpleSetters) {
            if (dataKey in appData) {
                const setter = appContext[setterKey];
                if (typeof setter === 'function') {
                    (setter as Function)(appData[dataKey]);
                }
            } else {
                missingKeys.push(dataKey);
            }
        }

        // Record fields — only restore keys that still exist in context
        const restoreRecord = (
            snapshotRecord: Record<string, any> | undefined,
            contextRecord: Record<string, any>,
            setter: Function,
            label: string,
        ) => {
            if (!snapshotRecord) { missingKeys.push(label); return; }
            const filtered: Record<string, any> = {};
            for (const [k, v] of Object.entries(snapshotRecord)) {
                if (k in contextRecord) filtered[k] = v;
            }
            setter(filtered);
        };

        restoreRecord(appData.imageOpacities, appContext.imageOverlays, appContext.setImageOpacities, 'imageOpacities');
        restoreRecord(appData.showImageOverlay, appContext.imageOverlays, appContext.setShowImageOverlay, 'showImageOverlay');

        if (appData.showLabels) appContext.setShowLabels(appData.showLabels);
        if (appData.showModelPredictions) appContext.setShowModelPredictions(appData.showModelPredictions);

        // Restore inView state
        if (snapshot.inViewData) {
            const restoredInView: Record<string, Set<number>> = {};
            for (const [key, arr] of Object.entries(snapshot.inViewData)) {
                restoredInView[key] = new Set(arr);
            }
            appContext.setModelPredictionsInView(restoredInView);
        } else {
            missingKeys.push('inViewData');
        }

        return {
            success: missingKeys.length === 0,
            missingKeys,
        };
    };

    // ── Delete snapshot ─────────────────────────────────────────────────────

    const deleteSnapshot = (id: string) => {
        setSnapshots(prev => prev.filter(s => s.id !== id));
    };

    // ── Check which snapshot keys are missing from current context ──────────

    const missingApplicableKeys = (snapshotData: AppSnapshot): string[] => {
        const missing = new Set<string>();

        const scalarKeys: (keyof AppSnapshot)[] = [
            'eezDKOutlineVisible', 'eezUSOutlineVisible', 'fullFidelity',
            'showMapTiles', 'trajectoryDensity', 'enableShipSizeGuide',
            'showTrajectoryDots', 'drawConfig', 'projection', 'zoom', 'center',
        ];

        for (const key of scalarKeys) {
            if (!(key in appContext)) missing.add(key);
        }

        for (const key of Object.keys(snapshotData.imageOpacities ?? {})) {
            if (!(key in appContext.imageOverlays)) missing.add(`imageOverlay.${key}`);
        }
        for (const key of Object.keys(snapshotData.showLabels ?? {})) {
            if (!appContext.labels[key]) missing.add(`label.${key}`);
        }
        for (const key of Object.keys(snapshotData.showModelPredictions ?? {})) {
            if (!appContext.modelPredictions[key]) missing.add(`model.${key}`);
        }

        return Array.from(missing);
    };

    return { snapshots, takeSnapshot, restoreSnapshot, deleteSnapshot, missingApplicableKeys };
};