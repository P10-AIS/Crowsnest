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
        const { appData } = snapshot;

        // 1. Hardcode and filter the boolean settings
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
            "zoom",
            "center",
            "drawConfig",
            "projection",
        ] as const;

        simpleKeys.forEach((key) => {
            if (key in appContext && appData && key in appData) {
                const setterName = `set${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof appContext;
                const setter = appContext[setterName];
                if (typeof setter === 'function') {
                    (setter as Function)(appData[key]);
                }
            }
        });

        const filterAndSet = (
            snapshotRecord: Record<string, any> | undefined, 
            contextRecord: Record<string, any> | undefined, 
            setterName: keyof typeof appContext
        ) => {
            const setter = appContext[setterName];
            if (!snapshotRecord || !contextRecord || typeof setter !== 'function') return;

            const filteredRecord: Record<string, any> = {};
            for (const [key, value] of Object.entries(snapshotRecord)) {
                if (key in contextRecord) {
                    filteredRecord[key] = value;
                }
            }
            (setter as Function)(filteredRecord);
        };

        filterAndSet(appData?.imageOpacities, appContext.imageOverlays, 'setImageOpacities');
        filterAndSet(appData?.showImageOverlay, appContext.imageOverlays, 'setShowImageOverlay');
        filterAndSet(appData?.showLabels, appContext.labels, 'setShowLabels');
        filterAndSet(appData?.showModelPredictions, appContext.modelPredictions, 'setShowModelPredictions');

        const restoredInView: Record<string, Set<number>> = {};
        if (snapshot.inViewData) {
            for (const [key, arr] of Object.entries(snapshot.inViewData)) {
                restoredInView[key] = new Set(arr);
            }
        }

        if (typeof appContext.setModelPredictions === 'function') {
            appContext.setModelPredictions((prevPredictions: Record<string, any[]>) => {
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
        }

        if (inViewContext && typeof inViewContext.setModelPredictionsInView === 'function') {
            inViewContext.setModelPredictionsInView(restoredInView);
        }
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