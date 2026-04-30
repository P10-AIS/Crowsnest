import { useCallback, useEffect, useRef } from "react";
import { useMapEvents } from "react-leaflet";
import { useAppContext } from "../contexts/AppContext";
import { useLoadTrajectories } from "../hooks/LoadTrajectoriesHook";
import type { RawPoint, RawTrajectory } from "../utils/draw";

const DEBOUNCE_MS = 150;

// Simple bbox intersection — no padding, exact viewport
function trajectoryIntersectsView(
  traj: RawTrajectory,
  latMin: number, latMax: number,
  lonMin: number, lonMax: number,
): boolean {
  for (const [lat, lon] of traj as RawPoint[]) {
    if (lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax) {
      return true;
    }
  }
  return false;
}

export default function MapController() {
  const {
    zoom, setZoom,
    center, setCenter,
    modelPredictions,
    labels,
    setModelPredictionsInView,
    setLabelsInView,
  } = useAppContext();

  const loadTrajectories = useLoadTrajectories();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTrajectoriesRef = useRef(loadTrajectories);

  useEffect(() => {
    loadTrajectoriesRef.current = loadTrajectories;
  }, [loadTrajectories]);

  const map = useMapEvents({
    zoomend: () => { setZoom(map.getZoom()); triggerLoad(); },
    moveend: () => {
      setCenter([map.getCenter().lat, map.getCenter().lng]);
      triggerLoad();
    },
  });

  const triggerLoad = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const bounds = map.getBounds();
      const latPad = (bounds.getNorth() - bounds.getSouth()) * 0.5;
      const lonPad = (bounds.getEast() - bounds.getWest()) * 0.5;
      loadTrajectoriesRef.current({
        latMin: bounds.getSouth() - latPad,
        latMax: bounds.getNorth() + latPad,
        lonMin: bounds.getWest() - lonPad,
        lonMax: bounds.getEast() + lonPad,
        zoom: map.getZoom(),
      });
    }, DEBOUNCE_MS);
  }, [map]);

  // Update which trajectories are in the exact (unpadded) viewport
  const updateInView = useCallback(() => {
    const bounds = map.getBounds();
    const latMin = bounds.getSouth();
    const latMax = bounds.getNorth();
    const lonMin = bounds.getWest();
    const lonMax = bounds.getEast();

    const predInView: Record<string, Set<number>> = {};
    for (const [modelName, trajs] of Object.entries(modelPredictions)) {
      predInView[modelName] = new Set();
      for (const [idx, traj] of trajs.entries()) {
        if (trajectoryIntersectsView(traj, latMin, latMax, lonMin, lonMax)) {
          predInView[modelName].add(idx);
        }
      }
    }
    setModelPredictionsInView(predInView);

    const labelsInView: Record<string, Set<number>> = {};
    for (const [datasetName, trajs] of Object.entries(labels)) {
      labelsInView[datasetName] = new Set();
      for (const [idx, traj] of trajs.entries()) {
        if (trajectoryIntersectsView(traj, latMin, latMax, lonMin, lonMax)) {
          labelsInView[datasetName].add(idx);
        }
      }
    }
    setLabelsInView(labelsInView);
  }, [map, modelPredictions, labels, setModelPredictionsInView, setLabelsInView]);

  // Re-run inView whenever data or viewport changes
  useEffect(() => {
    updateInView();
  }, [updateInView]);

  // Reload when density/fidelity changes
  useEffect(() => {
    loadTrajectoriesRef.current = loadTrajectories;
    triggerLoad();
  }, [loadTrajectories]);

  // Mount
  useEffect(() => {
    triggerLoad();
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Sync external zoom
  useEffect(() => {
    if (zoom !== undefined && zoom !== map.getZoom()) map.setZoom(zoom);
  }, [zoom, map]);

  // Sync external center
  useEffect(() => {
    if (center) {
      const c = map.getCenter();
      if (c.lat !== center[0] || c.lng !== center[1]) {
        map.setView(center, zoom, { animate: true });
      }
    }
  }, [center, map]);

  return null;
}