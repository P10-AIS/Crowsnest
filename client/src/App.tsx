
import Map3034 from './components/Map3034';
import { drawDepthImage, drawPolygons, drawTrajectories } from './utils/draw';
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
              {ctx.showDepthImage && <CanvasLayer drawMethod={(info) => drawDepthImage(ctx.depthImage, ctx.depthImageOpacity, info)} />}
              {ctx.eecOutlineVisible && <CanvasLayer drawMethod={(info) => drawPolygons(ctx.polygons, info)} />}
              {ctx.trajectoriesVisible && <CanvasLayer drawMethod={(info) => drawTrajectories(ctx.trajectories, ctx.numTrajectoriesVisible, ctx.fullTrajectoryFidelity, info)} />}
            </>
          </ Map3034>) : (
          <Map3857>
            <>
              {ctx.showMapTiles && <TileLayer3857 />}
              {ctx.showDepthImage && <CanvasLayer drawMethod={(info) => drawDepthImage(ctx.depthImage, ctx.depthImageOpacity, info)} />}
              {ctx.eecOutlineVisible && <CanvasLayer drawMethod={(info) => drawPolygons(ctx.polygons, info)} />}
              {ctx.trajectoriesVisible && <CanvasLayer drawMethod={(info) => drawTrajectories(ctx.trajectories, ctx.numTrajectoriesVisible, ctx.fullTrajectoryFidelity, info)} />}
            </>
          </ Map3857>
        )}
      </DataLoader>
    </div>
  );
}


export default App
