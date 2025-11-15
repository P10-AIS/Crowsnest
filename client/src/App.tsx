import { useEffect, useState } from 'react';
import MapWithCanvas from './components/MapWithCanvas';
import { draw } from './utils/draw';
import CanvasLayer from './components/CanvasLayer';
import { parseTrajectory } from './utils/parse';
import type { ZoomLevels } from './types/ZoomLevels';
import { prepareEecPolygons, prepareTrajectories } from './utils/prepare';
import type { Polygon } from './types/Polygon';
import eecData from './assets/eec.json';
import type { Trajectory } from './types/Trajectory';

const polygons: ZoomLevels<Polygon[]> = prepareEecPolygons(eecData.features[0].geometry.coordinates);

function App() {
  const [trajectories, setTrajectories] = useState<ZoomLevels<Trajectory[]>>([]);

  useEffect(() => {
    const fetchLatestTrajectory = async () => {
      try {
        const response = await fetch('http://localhost:4000/latest');
        const data = await response.json();
        const { trajectory } = data;
        const parsed = parseTrajectory(trajectory);
        const zoomed = prepareTrajectories(parsed);
        setTrajectories(zoomed);
      } catch (err) {
        console.error('Failed to fetch trajectory:', err);
      }
    };
    fetchLatestTrajectory()

  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MapWithCanvas>
        <CanvasLayer drawMethod={(info) => draw(trajectories, polygons, info)} />
      </ MapWithCanvas>
    </div>
  );
}


export default App
