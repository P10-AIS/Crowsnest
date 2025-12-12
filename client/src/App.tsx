
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

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <SettingsPanel />
      <DataLoader >
        {ctx.showESPG3034 ? (
          <Map3034>
            <>
              {ctx.showMapTiles && <TileLayer3034 />}
              {ctx.showDepthImage && <CanvasLayer zIndex={1} drawMethod={(info) => drawGeoImage(ctx.depthImage3034, ctx.depthImageOpacity, info)} />}
              {ctx.showTrafficImage && <CanvasLayer zIndex={2} drawMethod={(info) => drawGeoImage(ctx.trafficImage3034, ctx.trafficImageOpacity, info)} />}
              {ctx.eezOutlineVisible && <CanvasLayer zIndex={3} drawMethod={(info) => drawPolygons(ctx.polygons, ctx.fullEezFidelity, info)} />}
              {ctx.trajectoriesVisible && <CanvasLayer zIndex={4} drawMethod={(info) => drawTrajectories(ctx.trajectories, ctx.numTrajectoriesVisible, ctx.fullTrajectoryFidelity, info)} />}
              {ctx.showPredictionSteps && <CanvasLayer zIndex={5} drawMethod={(info) => drawPredictions(ctx.predictionSteps[ctx.currentPredictionStep], ctx.fullPredictionFidelity, info)} />}
              {ctx.enableShipSizeGuide && <CanvasLayer zIndex={6} drawMethod={(info) => drawShipCursor(info, ctx.shipSizeGuideImage)} />}
            </>
          </ Map3034>) : (
          <Map3857>
            <>
              {ctx.showMapTiles && <TileLayer3857 />}
              {ctx.showDepthImage && <CanvasLayer zIndex={1} drawMethod={(info) => drawGeoImage(ctx.depthImage3857, ctx.depthImageOpacity, info)} />}
              {ctx.showTrafficImage && <CanvasLayer zIndex={2} drawMethod={(info) => drawGeoImage(ctx.trafficImage3857, ctx.trafficImageOpacity, info)} />}
              {ctx.eezOutlineVisible && <CanvasLayer zIndex={3} drawMethod={(info) => drawPolygons(ctx.polygons, ctx.fullEezFidelity, info)} />}
              {ctx.trajectoriesVisible && <CanvasLayer zIndex={4} drawMethod={(info) => drawTrajectories(ctx.trajectories, ctx.numTrajectoriesVisible, ctx.fullTrajectoryFidelity, info)} />}
              {ctx.showPredictionSteps && <CanvasLayer zIndex={5} drawMethod={(info) => drawPredictions(ctx.predictionSteps[ctx.currentPredictionStep], ctx.fullPredictionFidelity, info)} />}
              {ctx.enableShipSizeGuide && <CanvasLayer zIndex={6} drawMethod={(info) => drawShipCursor(info, ctx.shipSizeGuideImage)} />}
            </>
          </ Map3857>
        )}
      </DataLoader>
    </div>
  );
}


export default App
