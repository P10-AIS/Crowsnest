
import Map3034 from './components/Map3034';
import { drawGeoImage, drawPolygons, drawPredictions, drawTrajectories, drawShipCursor } from './utils/draw';
import CanvasLayer from './components/CanvasLayer';
import SettingsPanel from './components/SettingsPanel';
import { useAppContext } from './contexts/AppContext';
import DataLoader from './components/DataLoader';
import TileLayer3034 from './components/TileLayer3034';
import Map3857 from './components/Map3857';
import TileLayer3857 from './components/TileLayer3857';
import InViewPanel from './components/InViewPanel';
import { useInViewContext } from './contexts/InViewContext';
import { Projection } from './types/projection';


function App() {
  const appCtx = useAppContext();
  const inViewCtx = useInViewContext();
  const [MapComponent, TileLayerComponent] = (() => {
    switch (appCtx.projection) {
      case Projection.EPSG3034:
        return [Map3034, TileLayer3034];
      case Projection.EPSG3857:
        return [Map3857, TileLayer3857];
      default:
        return [Map3857, TileLayer3857];
    }
  })();

  function handlePredictionsInView(modelName: string, idsInView: Set<number>) {
    inViewCtx.setModelPredictionsInView(prev => {
      const prevSet = prev[modelName];

      if (prevSet && setsEqual(prevSet, idsInView)) {
        return prev;
      }

      return {
        ...prev,
        [modelName]: idsInView,
      };
    });
  }

  function setsEqual(a: Set<number>, b: Set<number>) {
    if (a.size !== b.size) return false;
    for (const v of a) {
      if (!b.has(v)) return false;
    }
    return true;
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <SettingsPanel />
      <InViewPanel />
      <DataLoader >
        <MapComponent>
          <>
            {appCtx.showMapTiles && <TileLayerComponent />}
            {Object.entries(appCtx.imageOverlays).map(([name, image]) => (
              appCtx.showImageOverlay[name] &&
              <CanvasLayer key={name} zIndex={1} drawMethod={(info) => drawGeoImage(image, info)} />
            ))}
            {appCtx.eezDKOutlineVisible && <CanvasLayer zIndex={3} drawMethod={(info) => drawPolygons(appCtx.polygonsDK, appCtx.fullEezFidelity, info, appCtx.drawConfig)} />} 
            {appCtx.eezUSOutlineVisible && <CanvasLayer zIndex={3} drawMethod={(info) => drawPolygons(appCtx.polygonsUS, appCtx.fullEezFidelity, info, appCtx.drawConfig)} />} 

            {Object.entries(appCtx.labels).map(([labelName, trajectories]) => (
              appCtx.showLabels[labelName] &&
              <CanvasLayer key={labelName} zIndex={4} drawMethod={(info) => drawTrajectories(trajectories, appCtx.trajectoryDensity, appCtx.fullTrajectoryFidelity, appCtx.showTrajectoryDots, info, appCtx.drawConfig)} />
            ))}

            {Object.entries(appCtx.modelPredictions).map(([modelName, predictions]) => (
              appCtx.showModelPredictions[modelName] &&
              <CanvasLayer key={modelName} zIndex={5} drawMethod={(info) => drawPredictions(predictions, appCtx.trajectoryDensity, appCtx.fullPredictionFidelity, appCtx.showPredictionDots, (idsInView) => handlePredictionsInView(modelName, idsInView), info, appCtx.drawConfig)} />
            ))}

            {appCtx.enableShipSizeGuide && <CanvasLayer zIndex={6} drawMethod={(info) => drawShipCursor(info, appCtx.shipSizeGuideImage)} />}
          </>
        </ MapComponent>
      </DataLoader>
    </div>
  );
}


export default App
