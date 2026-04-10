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
        inViewIdsByModel: Record<string, Set<number>>,
        setLabels: typeof appContext.setLabels
    ) {
        const activeInViewIds = new Set<number>();
        
        Object.entries(predictions).forEach(([modelName, modelPredictions]) => {
            const inViewForModel = inViewIdsByModel[modelName] || new Set();
            
            modelPredictions.forEach(p => {
                if (p.enabled && inViewForModel.has(p.trajectoryId)) {
                    activeInViewIds.add(p.trajectoryId);
                }
            });
        });

        setLabels(prevLabels => {
            const updated: typeof prevLabels = {};
            for (const [key, labels] of Object.entries(prevLabels)) {
                updated[key] = labels.map(l => ({
                    ...l,
                    enabled: activeInViewIds.has(l.trajectoryId)
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
    Object.entries(snapshot.appData).forEach(([key, value]) => {
        const setterName = `set${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof appContext;
        const setter = appContext[setterName];
        if (typeof setter === 'function') (setter as Function)(value);
    });

    const restoredInView: Record<string, Set<number>> = {};
    for (const [key, arr] of Object.entries(snapshot.inViewData)) {
        restoredInView[key] = new Set(arr);
    }

    appContext.setModelPredictions(prevPredictions => {
        const updatedPredictions = { ...prevPredictions };
        
        Object.keys(updatedPredictions).forEach(modelName => {
            const enabledInSnapshot = new Set(snapshot.enabledPredictions?.[modelName] || []);
            updatedPredictions[modelName] = updatedPredictions[modelName].map(p => ({
                ...p,
                enabled: enabledInSnapshot.has(p.trajectoryId)
            }));
        });

        syncLabelsWithInViewPredictions(
            updatedPredictions, 
            restoredInView, 
            appContext.setLabels
        );

        return updatedPredictions;
    });

    inViewContext.setModelPredictionsInView(restoredInView);
};
    const deleteSnapshot = (id: string) => {
        setSnapshots(prev => prev.filter(s => s.id !== id));
    };

    const missingApplicableKeys = (curCtx: AppContextType, snapshotData: AppSnapshot): string[] => {
        const recordFieldsToCheck: (keyof AppSnapshot)[] = [
            "showModelPredictions",
            "showLabels",
            "showImageOverlay",
            "imageOpacities"
        ];

        const missingKeys: string[] = [];

        recordFieldsToCheck.forEach((field) => {
            const snapshotRecord = snapshotData[field];
            const currentRecord = curCtx[field];

            // Ensure both fields exist and are objects/records before comparing
            if (snapshotRecord && typeof snapshotRecord === 'object' && currentRecord) {
                const snapshotEntryKeys = Object.keys(snapshotRecord);
                const currentEntryKeys = new Set(Object.keys(currentRecord));

                snapshotEntryKeys.forEach((key) => {
                    // If the key from the snapshot isn't in the current context, it's "missing"
                    if (!currentEntryKeys.has(key)) {
                        missingKeys.push(key);
                    }
                });
            }
        });
        return missingKeys;
    };

    return { snapshots, takeSnapshot, restoreSnapshot, deleteSnapshot, missingApplicableKeys };
};