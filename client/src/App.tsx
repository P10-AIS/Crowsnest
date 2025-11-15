
import MapWithCanvas from './components/MapWithCanvas';
import { draw } from './utils/draw';
import CanvasLayer from './components/CanvasLayer';
import SettingsPanel from './components/SettingsPanel';
import { useAppContext } from './contexts/AppContext';
import DataLoader from './components/DataLoader';

function App() {
  const ctx = useAppContext();

  const drawSettings = {
    showEecOutline: ctx.eecOutlineVisible,
    showTrajectories: ctx.trajectoriesVisible,
    maxTrajectories: ctx.numTrajectoriesVisible,
    fullTrajectoryFidelity: ctx.fullTrajectoryFidelity,
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <SettingsPanel />
      <DataLoader >
        <MapWithCanvas>
          <CanvasLayer drawMethod={(info) => draw(ctx.trajectories, ctx.polygons, drawSettings, info)} />
        </ MapWithCanvas>
      </DataLoader>
    </div>
  );
}


export default App
