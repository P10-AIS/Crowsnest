import { useAppContext, type AppContextType } from '../contexts/AppContext';
import { useInViewContext} from '../contexts/InViewContext';
import { useLocalStorageState } from '../contexts/LocalStorageState';
import type { AppSnapshot } from '../types/AppContextSceneState';

export interface Snapshot {
    id: string;
    timestamp: number;
    name: string;
    appData: AppSnapshot; 
    enabledPredictions: Record<string, number[]>;
    inViewData: Record<string, number[]>;
}


export const useSnapshotManager = () => {

    const appContext = useAppContext();
    const inViewContext = useInViewContext();
    const [snapshots, setSnapshots] = useLocalStorageState<Snapshot[]>('app_snapshots', []);

    function syncLabelsWithInViewPredictions(
        predictions: typeof appContext.modelPredictions,
        setLabels: typeof appContext.setLabels
    ) {
        const activePredictionIds = new Set<number>();
        let totalPredictions = 0;
        let activePredictionsCount = 0;
        
        // Use Object.values since we don't need the modelName key
        Object.values(predictions).forEach((modelPredictions) => {
            totalPredictions += modelPredictions.length;
            modelPredictions.forEach(p => {
                if (p.enabled) { 
                    activePredictionsCount++;
                    activePredictionIds.add(p.trajectoryId);
                }
            });
        });

        // True if there is at least one prediction and all of them are enabled
        const allSelected = totalPredictions > 0 && activePredictionsCount === totalPredictions;

        setLabels(prevLabels => {
            const updated: typeof prevLabels = {};
            for (const [key, labels] of Object.entries(prevLabels)) {
                updated[key] = labels.map(l => ({
                    ...l,
                    // Enable if its specific ID is active, or if ALL predictions are selected
                    enabled: activePredictionIds.has(l.trajectoryId) || allSelected
                }));
            }
            return updated;
        });
    }
    
    const takeSnapshot = (name: string) => {
        const appData: AppSnapshot = {
            eezDKOutlineVisible: appContext.eezDKOutlineVisible,
            eezUSOutlineVisible: appContext.eezUSOutlineVisible,
            fullTrajectoryFidelity: appContext.fullTrajectoryFidelity,
            fullEezFidelity: appContext.fullEezFidelity,
            showMapTiles: appContext.showMapTiles,
            showModelPredictions: appContext.showModelPredictions,
            showLabels: appContext.showLabels,
            trajectoryDensity: appContext.trajectoryDensity,
            fullPredictionFidelity: appContext.fullPredictionFidelity,
            enableShipSizeGuide: appContext.enableShipSizeGuide,
            showTrajectoryDots: appContext.showTrajectoryDots,
            showPredictionDots: appContext.showPredictionDots,
            drawConfig: appContext.drawConfig,
            showImageOverlay: appContext.showImageOverlay,
            projection: appContext.projection,
            zoom: appContext.zoom,
            center: appContext.center,
            imageOpacities: appContext.imageOpacities,
        };

        const serializableInView: Record<string, number[]> = {};
        for (const [key, set] of Object.entries(inViewContext.modelPredictionsInView)) {
            serializableInView[key] = Array.from(set as Set<number>);
        }

        const enabledPredictions: Record<string, number[]> = {};
    
        Object.entries(appContext.modelPredictions).forEach(([modelName, predictions]) => {
            enabledPredictions[modelName] = predictions
                .filter(p => p.enabled)
                .map(p => p.trajectoryId);
        });

        const newSnapshot: Snapshot = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            name,
            appData,
            enabledPredictions,
            inViewData: serializableInView 
        };

        setSnapshots(prev => [...prev, newSnapshot]);

    };

    const restoreSnapshot = (snapshot: Snapshot) => {
        const { appData } = snapshot;
        const missingKeys: string[] = [];
        const missingRecords: Record<string, string[]> = {};

        const simpleKeys = [
            "eezDKOutlineVisible",
            "eezUSOutlineVisible",
            "fullTrajectoryFidelity",
            "fullEezFidelity",
            "showMapTiles",
            "fullPredictionFidelity",
            "enableShipSizeGuide",
            "showTrajectoryDots",
            "showPredictionDots",
            "trajectoryDensity",
            "zoom",
            "center",
            "drawConfig",
            "projection",
        ] as const;

        simpleKeys.forEach((key) => {
            const existsInSnapshot = appData && key in appData;
            const existsInContext = key in appContext;

            if (existsInSnapshot && existsInContext) {
                const setterName = `set${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof appContext;
                const setter = appContext[setterName];
                if (typeof setter === 'function') {
                    (setter as Function)(appData[key]);
                }
            } else {
                missingKeys.push(key);
            }
        });

        const filterAndSet = (
            snapshotRecord: Record<string, any> | undefined, 
            contextRecord: Record<string, any> | undefined, 
            setterName: keyof typeof appContext,
            recordLabel: string 
        ) => {
            const setter = appContext[setterName];
            if (!snapshotRecord || !contextRecord || typeof setter !== 'function') {
                missingKeys.push(recordLabel);
                return;
            }

            const filteredRecord: Record<string, any> = {};
            const missingFromThisRecord: string[] = [];

            for (const key of Object.keys(snapshotRecord)) {
                if (key in contextRecord) {
                    filteredRecord[key] = snapshotRecord[key];
                } else {
                    missingFromThisRecord.push(key);
                }
            }

            if (missingFromThisRecord.length > 0) {
                missingRecords[recordLabel] = missingFromThisRecord;
            }

            (setter as Function)(filteredRecord);
        };

        filterAndSet(appData?.imageOpacities, appContext.imageOverlays, 'setImageOpacities', 'imageOpacities');
        filterAndSet(appData?.showImageOverlay, appContext.imageOverlays, 'setShowImageOverlay', 'showImageOverlay');
        filterAndSet(appData?.showLabels, appContext.labels, 'setShowLabels', 'showLabels');
        filterAndSet(appData?.showModelPredictions, appContext.modelPredictions, 'setShowModelPredictions', 'showModelPredictions');

        const restoredInView: Record<string, Set<number>> = {};
        if (snapshot.inViewData) {
            for (const [key, arr] of Object.entries(snapshot.inViewData)) {
                restoredInView[key] = new Set(arr);
            }
        } else {
            missingKeys.push('inViewData');
        }

        if (typeof appContext.setModelPredictions === 'function') {
            const updatedPredictions = { ...appContext.modelPredictions };
            
            Object.keys(updatedPredictions).forEach(modelName => {
                const enabledInSnapshot = new Set(snapshot.enabledPredictions?.[modelName] || []);
                updatedPredictions[modelName] = updatedPredictions[modelName].map(p => ({
                    ...p,
                    enabled: enabledInSnapshot.has(p.trajectoryId) || enabledInSnapshot.size === 0
                }));
            });

            appContext.setModelPredictions(updatedPredictions);

            syncLabelsWithInViewPredictions(
                updatedPredictions, 
                appContext.setLabels
            );
        }

        if (inViewContext && typeof inViewContext.setModelPredictionsInView === 'function') {
            inViewContext.setModelPredictionsInView(restoredInView);
        }

        return {
            success: missingKeys.length === 0 && Object.keys(missingRecords).length === 0,
            missingKeys,
            missingRecords
        };
    };
    const deleteSnapshot = (id: string) => {
        setSnapshots(prev => prev.filter(s => s.id !== id));
    };

    const missingApplicableKeys = (snapshotData: AppSnapshot): string[] => {
        const missingKeys: Set<string> = new Set();
        const simpleKeys: (keyof AppSnapshot)[] = [
            "eezDKOutlineVisible",
            "eezUSOutlineVisible",
            "fullTrajectoryFidelity",
            "fullEezFidelity",
            "showMapTiles",
            "fullPredictionFidelity",
            "enableShipSizeGuide",
            "showTrajectoryDots",
            "showPredictionDots",
            "trajectoryDensity",
            "zoom",
            "center",
            "projection",
            "drawConfig",
        ];
        for (const key of simpleKeys) {
            if (!(key in appContext)) {
                missingKeys.add(key);
            }
        }

        for (const key of Object.keys(snapshotData.imageOpacities || {})) {
            if (!(key in appContext.imageOverlays)) {
                missingKeys.add(`image overlay.${key}`);
            }
        }
        for (const key of Object.keys(snapshotData.showImageOverlay || {})) {
            if (!(key in appContext.imageOverlays)) {
                missingKeys.add(`image overlay.${key}`);
            }
        }
        for (const key of Object.keys(snapshotData.showLabels || {})) {
            if (!(key in appContext.labels)) {
                missingKeys.add(`label ${key}`);
            }
        }

        for (const key of Object.keys(snapshotData.showModelPredictions || {})) {
            if (!(key in appContext.modelPredictions)) {
                missingKeys.add(`model prediction ${key}`);
            }
        }

        return Array.from(missingKeys);
    };

    return { snapshots, takeSnapshot, restoreSnapshot, deleteSnapshot, missingApplicableKeys };
};