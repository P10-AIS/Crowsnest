
import Map3034 from './components/Map3034';
import { drawGeoImage, drawPolygons, drawPredictions, drawTrajectories, drawShipCursor } from './utils/draw';
import CanvasLayer from './components/CanvasLayer';
import SettingsPanel from './components/SettingsPanel';
import { useAppContext } from './contexts/AppContext';
import DataLoader from './components/DataLoader';
import TileLayer3034 from './components/TileLayer3034';
import Map3857 from './components/Map3857';
import TileLayer3857 from './components/TileLayer3857';

function App() {
  const ctx = useAppContext();

  const MapComponent = ctx.showESPG3034 ? Map3034 : Map3857;
  const TileLayerComponent = ctx.showESPG3034 ? TileLayer3034 : TileLayer3857;
  const depthImage = ctx.showESPG3034 ? ctx.depthImage3034 : ctx.depthImage3857;
  const trafficImage = ctx.showESPG3034 ? ctx.trafficImage3034 : ctx.trafficImage3857;

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <SettingsPanel />
      <DataLoader >
        <MapComponent>
          <>
            {ctx.showMapTiles && <TileLayerComponent />}
            {ctx.showDepthImage && <CanvasLayer zIndex={1} drawMethod={(info) => drawGeoImage(depthImage, ctx.depthImageOpacity, info)} />}
            {ctx.showTrafficImage && <CanvasLayer zIndex={2} drawMethod={(info) => drawGeoImage(trafficImage, ctx.trafficImageOpacity, info)} />}
            {ctx.eezOutlineVisible && <CanvasLayer zIndex={3} drawMethod={(info) => drawPolygons(ctx.polygons, ctx.fullEezFidelity, info)} />}
            {ctx.trajectoriesVisible && <CanvasLayer zIndex={4} drawMethod={(info) => drawTrajectories(ctx.trajectories, ctx.numTrajectoriesVisible, ctx.fullTrajectoryFidelity, ctx.showTrajectoryDots, info)} />}

            {Object.entries(ctx.modelPredictions).map(([modelName, predictions]) => (
              ctx.showModelPredictions[modelName] &&
              <CanvasLayer key={modelName} zIndex={5} drawMethod={(info) => drawPredictions(predictions, ctx.fullPredictionFidelity, ctx.showPredictionDots, ctx.showPredictionCorrectionLines, info)} />
            ))}

            {ctx.enableShipSizeGuide && <CanvasLayer zIndex={6} drawMethod={(info) => drawShipCursor(info, ctx.shipSizeGuideImage)} />}
          </>
        </ MapComponent>
      </DataLoader>
    </div>
  );
}


export default App
