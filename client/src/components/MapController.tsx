import { useCallback, useEffect, useRef } from "react";
import { useMapEvents } from "react-leaflet";
import { useAppContext } from "../contexts/AppContext";
import { useLoadTrajectories } from "../hooks/LoadTrajectoriesHook";

const DEBOUNCE_MS = 200;

export default function MapController() {
  const { zoom, setZoom, center, setCenter } = useAppContext();
  const loadTrajectories = useLoadTrajectories();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
      triggerLoad();
    },
    moveend: () => {
      const newCenter = map.getCenter();
      setCenter([newCenter.lat, newCenter.lng]);
      triggerLoad();
    },
  });

  const triggerLoad = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const bounds = map.getBounds();
      loadTrajectories({
        latMin: bounds.getSouth(),
        latMax: bounds.getNorth(),
        lonMin: bounds.getWest(),
        lonMax: bounds.getEast(),
        zoom: map.getZoom(),
      });
    }, DEBOUNCE_MS);
  }, [map, loadTrajectories]);

  // Initial load when the map first mounts
  useEffect(() => {
    triggerLoad();
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Sync external zoom changes (e.g. from settings panel) into the map
  useEffect(() => {
    if (zoom !== undefined && zoom !== map.getZoom()) {
      map.setZoom(zoom);
    }
  }, [zoom, map]);

  // Sync external center changes into the map
  useEffect(() => {
    if (center) {
      const currentCenter = map.getCenter();
      if (currentCenter.lat !== center[0] || currentCenter.lng !== center[1]) {
        map.setView(center, zoom, { animate: true });
      }
    }
  }, [center, map]);

  return null;
}