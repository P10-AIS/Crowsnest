import Map3034 from './components/Map3034';
import { drawGeoImage, drawPolygons, drawPredictions, drawTrajectories, drawShipCursor } from './utils/draw';
import CanvasLayer from './components/CanvasLayer';
import SettingsPanel from './components/SettingsPanel';
import { useAppContext } from './contexts/AppContext';
import DataLoader from './components/DataLoader';
import TileLayer3034 from './components/TileLayer3034';
import Map3857 from './components/Map3857';
import Map32617 from './components/Map32617';
import TileLayer3857 from './components/TileLayer3857';
import TileLayer32617 from './components/TileLayer32617';
import { Projection } from './types/projection';
import ViewPanel from './components/ViewPanel';

function App() {
  const appCtx = useAppContext();

  const [MapComponent, TileLayerComponent] = (() => {
    switch (appCtx.projection) {
      case Projection.EPSG3034: return [Map3034, TileLayer3034];
      case Projection.EPSG3857: return [Map3857, TileLayer3857];
      case Projection.EPSG32617: return [Map32617, TileLayer32617];
      default: return [Map3857, TileLayer3857];
    }
  })();

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <SettingsPanel />
      <ViewPanel />
      <DataLoader>
        <MapComponent>
          <>
            {appCtx.showMapTiles && <TileLayerComponent />}

            {Object.entries(appCtx.imageOverlays).map(([name, image]) => (
              appCtx.showImageOverlay[name] &&
              appCtx.imageOverlays[name]?.projection === appCtx.projection &&
              <CanvasLayer key={name} zIndex={1} drawMethod={(info) =>
                drawGeoImage(image, appCtx.imageOpacities[name] ?? 1, info)
              } />
            ))}

            {appCtx.eezDKOutlineVisible &&
              <CanvasLayer zIndex={3} drawMethod={(info) =>
                drawPolygons(appCtx.polygonsDK, appCtx.fullFidelity, info, appCtx.drawConfig)
              } />
            }
            {appCtx.eezUSOutlineVisible &&
              <CanvasLayer zIndex={3} drawMethod={(info) =>
                drawPolygons(appCtx.polygonsUS, appCtx.fullFidelity, info, appCtx.drawConfig)
              } />
            }

            {Object.entries(appCtx.labels).map(([labelName, trajectories]) => (
              appCtx.showLabels[labelName] &&
              <CanvasLayer key={labelName} zIndex={4} drawMethod={(info) =>
                drawTrajectories(
                  trajectories,
                  appCtx.disabledTrajectories[labelName] ?? new Set(),
                  appCtx.showTrajectoryDots,
                  info,
                  appCtx.drawConfig,
                )
              } />
            ))}

            {Object.entries(appCtx.modelPredictions).map(([modelName, predictions]) => (
              appCtx.showModelPredictions[modelName] &&
              <CanvasLayer key={modelName} zIndex={5} drawMethod={(info) =>
                drawPredictions(
                  predictions,
                  appCtx.modelForces[modelName] ?? new Map(),
                  appCtx.disabledTrajectories[modelName] ?? new Set<number>(),
                  appCtx.showTrajectoryDots,
                  appCtx.numHistoricTokens[modelName] ?? null,
                  appCtx.forceConfig[modelName]?.enabled ?? [],
                  appCtx.forceScale,
                  info,
                  appCtx.drawConfig,
                )
              } />
            ))}

            {appCtx.enableShipSizeGuide &&
              <CanvasLayer zIndex={6} drawMethod={(info) =>
                drawShipCursor(info, appCtx.shipSizeGuideImage)
              } />
            }
          </>
        </MapComponent>
      </DataLoader>
    </div>
  );
}

export default App;