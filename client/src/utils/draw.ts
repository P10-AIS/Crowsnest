import type { DrawConfig } from "../types/DrawConfig";
import type { GeoImage } from "../types/GeoImage";
import type { Polygon } from "../types/Polygon";
import type { Bound } from "../types/Bound";
import type { DrawInfo } from "../components/CanvasLayer";

// [lat, lon, timestamp] — exactly what the backend streams
export type RawPoint = [number, number, number];
// A single trajectory is an array of points
export type RawTrajectory = RawPoint[];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function isBoundingBoxInView(bbox: Bound, view: Bound): boolean {
  return !(
    bbox.maxLat < view.minLat ||
    bbox.minLat > view.maxLat ||
    bbox.maxLng < view.minLng ||
    bbox.minLng > view.maxLng
  );
}

function metersToPixels(map: L.Map, meters: number): number {
  const center = map.getCenter();
  const earthRadius = 6378137;
  const dLat = (meters / earthRadius) * (180 / Math.PI);
  const pointA = map.latLngToContainerPoint(center);
  const pointB = map.latLngToContainerPoint({ lat: center.lat + dLat, lng: center.lng });
  return Math.abs(pointA.y - pointB.y);
}

function trajectoryBbox(pts: RawPoint[]): Bound {
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  for (const [lat, lon] of pts) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLng) minLng = lon;
    if (lon > maxLng) maxLng = lon;
  }
  return { minLat, maxLat, minLng, maxLng };
}

function viewBox(map: L.Map): Bound {
  const b = map.getBounds();
  return { minLat: b.getSouth(), maxLat: b.getNorth(), minLng: b.getWest(), maxLng: b.getEast() };
}

// ---------------------------------------------------------------------------
// Draw trajectories (labels)
// ---------------------------------------------------------------------------

export function drawTrajectories(
  trajectories: RawTrajectory[],
  showDots: boolean,
  info: DrawInfo,
  config: DrawConfig,
) {
  const { map, canvas } = info;
  if (!canvas) return;

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const view = viewBox(map);
  const zoom = map.getZoom();
  const markerSize = config.radiusScale * 1.5;

  for (const traj of trajectories) {
    if (!traj || traj.length === 0) continue;

    const bbox = trajectoryBbox(traj);
    if (!isBoundingBoxInView(bbox, view)) continue;

    // Project all points to canvas pixels
    const pts = traj.map(([lat, lon]) => {
      const p = map.latLngToContainerPoint([lat, lon]);
      return { x: p.x, y: p.y };
    });

    // Draw dots
    if (zoom >= config.dotsZoom && showDots) {
      ctx.fillStyle = config.colors.label;
      for (const pt of pts) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, config.radiusScale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = config.colors.label;
    ctx.lineWidth = config.lineWidthScale;
    ctx.lineCap = "round";
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // Start / end markers
    const first = pts[0];
    const last = pts[pts.length - 1];
    const offset = config.radiusScale * 0.75;

    ctx.fillStyle = config.colors.start;
    ctx.fillRect(first.x - offset, first.y - offset, markerSize, markerSize);

    ctx.fillStyle = config.colors.end;
    ctx.fillRect(last.x - offset, last.y - offset, markerSize, markerSize);
  }
}

// ---------------------------------------------------------------------------
// Draw predictions
// ---------------------------------------------------------------------------

export function drawPredictions(
  predictions: RawTrajectory[],
  showDots: boolean,
  historicHorizonMinutes: number | null,
  idsInViewCallback: (idsInView: Set<number>) => void,
  info: DrawInfo,
  config: DrawConfig,
) {
  if (!predictions) return;

  const { map, canvas } = info;
  if (!canvas) return;

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const view = viewBox(map);
  const zoom = map.getZoom();
  const idsInView = new Set<number>();

  predictions.forEach((traj, idx) => {
    if (!traj || traj.length === 0) return;

    const bbox = trajectoryBbox(traj);
    if (!isBoundingBoxInView(bbox, view)) return;

    idsInView.add(idx);

    // Project points
    const pts = traj.map(([lat, lon, ts]) => {
      const p = map.latLngToContainerPoint([lat, lon]);
      return { x: p.x, y: p.y, ts };
    });

    // Determine historic/prediction boundary timestamp
    const baseTs = pts[0]?.ts;
    const cutoffTs = baseTs !== undefined && historicHorizonMinutes !== null
      ? baseTs + historicHorizonMinutes * 60
      : null;

    // Draw dots
    if (zoom >= config.dotsZoom && showDots) {
      ctx.fillStyle = config.colors.prediction;
      for (const pt of pts) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, config.radiusScale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw segments, colouring historic vs predicted portions differently
    ctx.lineWidth = config.lineWidthScale;
    for (let i = 1; i < pts.length; i++) {
      const start = pts[i - 1];
      const end = pts[i];

      ctx.strokeStyle = cutoffTs !== null && end.ts <= cutoffTs
        ? config.colors.label       // historic portion
        : config.colors.prediction; // predicted portion

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  });

  idsInViewCallback(idsInView);
}

// ---------------------------------------------------------------------------
// Draw polygons (EEZ outlines) — unchanged in structure
// ---------------------------------------------------------------------------

export function drawPolygons(
  polygons: Polygon[],
  fullFidelity: boolean,
  info: DrawInfo,
  config: DrawConfig,
) {
  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const view = viewBox(map);
  const zoom = map.getZoom();
  const trajZoom = fullFidelity ? 17 : zoom;

  polygons.forEach((polygon) => {
    const level = polygon.level[trajZoom];
    if (!level) return;
    if (!isBoundingBoxInView(level.outline.boundingBox, view)) return;

    if (level.outline.points.length > 0) {
      ctx.beginPath();
      const start = map.latLngToContainerPoint([
        level.outline.points[0].lat,
        level.outline.points[0].lng,
      ]);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < level.outline.points.length; i++) {
        const pt = map.latLngToContainerPoint([
          level.outline.points[i].lat,
          level.outline.points[i].lng,
        ]);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.strokeStyle = config.colors.polygonStroke;
      ctx.lineWidth = config.lineWidthScale;
      ctx.stroke();
    }

    if (level.holes) {
      for (const hole of level.holes) {
        if (!isBoundingBoxInView(hole.boundingBox, view)) continue;
        if (hole.points.length === 0) continue;

        ctx.beginPath();
        const start = map.latLngToContainerPoint([hole.points[0].lat, hole.points[0].lng]);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < hole.points.length; i++) {
          const pt = map.latLngToContainerPoint([hole.points[i].lat, hole.points[i].lng]);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.strokeStyle = config.colors.polygonStroke;
        ctx.lineWidth = config.lineWidthScale;
        ctx.stroke();
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Draw geo image overlay
// ---------------------------------------------------------------------------

export function drawGeoImage(
  geoImage: GeoImage | null,
  opacity: number,
  info: DrawInfo,
) {
  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!geoImage) return;

  const { img, area } = geoImage;
  const topRight = map.latLngToContainerPoint([area.topRight.lat, area.topRight.lng]);
  const bottomLeft = map.latLngToContainerPoint([area.bottomLeft.lat, area.bottomLeft.lng]);

  ctx.globalAlpha = opacity;
  ctx.drawImage(img, bottomLeft.x, topRight.y, topRight.x - bottomLeft.x, bottomLeft.y - topRight.y);
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Draw ship size guide cursor
// ---------------------------------------------------------------------------

export function drawShipCursor(info: DrawInfo, shipImage: HTMLImageElement | null) {
  if (!shipImage) return;

  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const center = map.getCenter();
  const centerPoint = map.latLngToContainerPoint(center);
  const pixelLength = metersToPixels(map, 20);
  const width = pixelLength;
  const height = pixelLength / (shipImage.width / shipImage.height);

  ctx.save();
  ctx.translate(centerPoint.x, centerPoint.y);
  ctx.drawImage(shipImage, -width / 2, -height / 2, width, height);
  ctx.restore();
}