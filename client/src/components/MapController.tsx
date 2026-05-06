import { useCallback, useEffect, useRef, useState } from "react";
import { useMapEvents } from "react-leaflet";
import { createPortal } from "react-dom";
import { useAppContext } from "../contexts/AppContext";
import { useLoadTrajectories } from "../hooks/LoadTrajectoriesHook";
import type { RawPoint, RawTrajectory } from "../utils/draw";

const DEBOUNCE_MS = 150;

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

const fmt = (n: number) => n.toFixed(5);

export default function MapController() {
  const {
    zoom, setZoom,
    center, setCenter,
    modelPredictions,
    labels,
    setModelPredictionsInView,
    setLabelsInView,
    setDisabledTrajectories,
  } = useAppContext();

  const loadTrajectories = useLoadTrajectories();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTrajectoriesRef = useRef(loadTrajectories);

  const [mouseLatLng, setMouseLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [viewportBounds, setViewportBounds] = useState<{
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  } | null>(null);

  // Use a ref for mouse position so the keydown handler always has latest value
  const mouseLatLngRef = useRef(mouseLatLng);
  useEffect(() => { mouseLatLngRef.current = mouseLatLng; }, [mouseLatLng]);

  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
      triggerLoad();
      updateViewportBounds();
    },
    moveend: () => {
      setCenter([map.getCenter().lat, map.getCenter().lng]);
      triggerLoad();
      updateViewportBounds();
    },
    move: () => {
      updateViewportBounds();
    },
    mousemove: (e) => setMouseLatLng({ lat: e.latlng.lat, lng: e.latlng.lng }),
    mouseout: () => setMouseLatLng(null),
  });

  useEffect(() => {
    loadTrajectoriesRef.current = loadTrajectories;
  }, [loadTrajectories]);

  const updateViewportBounds = useCallback(() => {
    const b = map.getBounds();
    setViewportBounds({
      sw: { lat: b.getSouth(), lng: b.getWest() },
      ne: { lat: b.getNorth(), lng: b.getEast() },
    });
  }, [map]);

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

    // Auto-disable newly visible trajectories if any are already disabled
    setDisabledTrajectories(prev => {
      const next = { ...prev };
      let changed = false;
      for (const [key, inViewIds] of Object.entries({ ...predInView, ...labelsInView })) {
        const currentlyDisabled = prev[key];
        if (!currentlyDisabled || currentlyDisabled.size === 0) continue;
        const updatedDisabled = new Set(currentlyDisabled);
        for (const idx of inViewIds) {
          if (!currentlyDisabled.has(idx)) {
            updatedDisabled.add(idx);
            changed = true;
          }
        }
        next[key] = updatedDisabled;
      }
      return changed ? next : prev;
    });
  }, [map, modelPredictions, labels, setModelPredictionsInView, setLabelsInView, setDisabledTrajectories]);

  // Press C to log current viewport + mouse coords to console
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const b = map.getBounds();
        console.log("=== Viewport ===");
        console.log(`SW: ${fmt(b.getSouth())}, ${fmt(b.getWest())}`);
        console.log(`NE: ${fmt(b.getNorth())}, ${fmt(b.getEast())}`);
        console.log(`Zoom: ${map.getZoom()}`);
        const mouse = mouseLatLngRef.current;
        if (mouse) console.log(`Mouse: ${fmt(mouse.lat)}, ${fmt(mouse.lng)}`);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [map]);

  // Re-run inView whenever data or viewport changes
  useEffect(() => { updateInView(); }, [updateInView]);

  // Reload when density/fidelity changes
  useEffect(() => {
    loadTrajectoriesRef.current = loadTrajectories;
    triggerLoad();
  }, [loadTrajectories]);

  // Mount
  useEffect(() => {
    triggerLoad();
    updateViewportBounds();
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

  const overlay = (
    <div className="absolute bottom-8 left-4 z-[2000] bg-black/60 text-white text-xs font-mono rounded px-2 py-1.5 space-y-0.5 pointer-events-none select-none">
      {viewportBounds && (
        <>
          <div>SW {fmt(viewportBounds.sw.lat)}, {fmt(viewportBounds.sw.lng)}</div>
          <div>NE {fmt(viewportBounds.ne.lat)}, {fmt(viewportBounds.ne.lng)}</div>
        </>
      )}
      <div className="border-t border-white/20 pt-0.5 mt-0.5">
        {mouseLatLng
          ? <>🖱 {fmt(mouseLatLng.lat)}, {fmt(mouseLatLng.lng)}</>
          : <span className="opacity-40">🖱 —</span>
        }
      </div>
      <div className="opacity-30 text-[10px]">Press 'c' to log</div>
    </div>
  );

  return createPortal(overlay, document.body);
}