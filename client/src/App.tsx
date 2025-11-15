
import Map from './components/Map';
import { drawDepthImage, drawPolygons, drawTrajectories } from './utils/draw';
import CanvasLayer from './components/CanvasLayer';
import SettingsPanel from './components/SettingsPanel';
import { useAppContext } from './contexts/AppContext';
import DataLoader from './components/DataLoader';
import TileLayer3034 from './components/TileLayer3034';

function App() {
  const ctx = useAppContext();

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <SettingsPanel />
      <DataLoader >
        <Map>
          <>
            {ctx.showMapTiles && <TileLayer3034 />}
            {ctx.showDepthImage && <CanvasLayer drawMethod={(info) => drawDepthImage(ctx.depthImage, ctx.depthImageOpacity, info)} />}
            {ctx.eecOutlineVisible && <CanvasLayer drawMethod={(info) => drawPolygons(ctx.polygons, info)} />}
            {ctx.trajectoriesVisible && <CanvasLayer drawMethod={(info) => drawTrajectories(ctx.trajectories, ctx.numTrajectoriesVisible, ctx.fullTrajectoryFidelity, info)} />}
          </>
        </ Map>
      </DataLoader>
    </div>
  );
}


export default App
