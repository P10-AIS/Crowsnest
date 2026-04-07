
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

function App() {
  const appCtx = useAppContext();
  const inViewCtx = useInViewContext();

  const MapComponent = appCtx.showESPG3034 ? Map3034 : Map3857;
  const TileLayerComponent = appCtx.showESPG3034 ? TileLayer3034 : TileLayer3857;
  const depthImage = appCtx.showESPG3034 ? appCtx.depthImage3034 : appCtx.depthImage3857;
  const bwDepthImage = appCtx.showESPG3034 ? appCtx.bwDepthImage3034 : appCtx.bwDepthImage3857;
  const trafficImage = appCtx.showESPG3034 ? appCtx.trafficImage3034 : appCtx.trafficImage3857;

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
            {/* {appCtx.showDepthImage && <CanvasLayer zIndex={1} drawMethod={(info) => drawGeoImage(depthImage, appCtx.depthImageOpacity, info)} />}
            {appCtx.showBWDepthImage && <CanvasLayer zIndex={1} drawMethod={(info) => drawGeoImage(bwDepthImage, appCtx.bwDepthImageOpacity, info)} />}
            {appCtx.showTrafficImage && <CanvasLayer zIndex={2} drawMethod={(info) => drawGeoImage(trafficImage, appCtx.trafficImageOpacity, info)} />}
            {appCtx.eezOutlineVisible && <CanvasLayer zIndex={3} drawMethod={(info) => drawPolygons(appCtx.polygons, appCtx.fullEezFidelity, info, appCtx.drawConfig)} />} */}
            {Object.entries(appCtx.imageOverlays).map(([name, image]) => (
              appCtx.showImageOverlay[name] &&
              <CanvasLayer key={name} zIndex={1} drawMethod={(info) => drawGeoImage(image, info)} />
            ))}

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
