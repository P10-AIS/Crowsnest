import type { DrawConfig } from "../types/DrawConfig";
import type { GeoImage } from "../types/GeoImage";
import type { Polygon } from "../types/Polygon";
import type { Bound } from "../types/Bound";
import type { DrawInfo } from "../components/CanvasLayer";

// [lat, lon, timestamp] — exactly what the backend streams
export type RawPoint = [number, number, number];
// A single trajectory is an array of points
export type RawTrajectory = RawPoint[];
// Forces per point: (thinned_len, F, 2) — null if no forces
export type RawForces = number[][][]; // [point_idx][force_idx][vx, vy]

// Colors for up to 8 force components
const FORCE_COLORS = [
  "rgba(255, 200, 0, 1)",    // yellow
  "rgba(0, 220, 255, 1)",    // cyan
  "rgba(255, 80, 200, 1)",   // magenta
  "rgba(80, 255, 120, 1)",   // green
  "rgba(255, 140, 0, 1)",    // orange
  "rgba(180, 80, 255, 1)",   // purple
  "rgba(255, 255, 255, 1)",  // white
  "rgba(255, 80, 80, 1)",    // red
];

export function forceColor(forceIdx: number): string {
  return FORCE_COLORS[forceIdx % FORCE_COLORS.length];
}

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

function viewBox(map: L.Map): Bound {
  const b = map.getBounds();
  return { minLat: b.getSouth(), maxLat: b.getNorth(), minLng: b.getWest(), maxLng: b.getEast() };
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  vx: number, vy: number,
  scale: number,
  color: string,
  config: DrawConfig,
) {
  const dx = vx * scale;
  const dy = -vy * scale; // flip y — canvas y increases downward
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return;

  const headLen = Math.max(4, 3 + 10 * config.lineWidthScale / 3); // length of arrow head
  const angle = Math.atan2(dy, dx);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = config.lineWidthScale;


  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();

  const arrowTipX = x + dx + Math.cos(angle) * headLen * Math.tan(Math.PI / 6);
  const arrowTipY = y + dy + Math.sin(angle) * headLen * Math.tan(Math.PI / 6);

  ctx.beginPath();
  ctx.moveTo(arrowTipX, arrowTipY);
  ctx.lineTo(arrowTipX - headLen * Math.cos(angle - Math.PI / 6), arrowTipY - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(arrowTipX - headLen * Math.cos(angle + Math.PI / 6), arrowTipY - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Draw trajectories (labels)
// ---------------------------------------------------------------------------

export function drawTrajectories(
  trajectories: Map<number, RawTrajectory>,
  disabled: Set<number>,
  showDots: boolean,
  info: DrawInfo,
  config: DrawConfig,
) {
  const { map, canvas } = info;
  if (!canvas) return;

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const zoom = map.getZoom();
  const markerSize = config.radiusScale * 1.5;
  const offset = config.radiusScale * 0.75;

  for (const [idx, traj] of trajectories.entries()) {
    if (disabled.has(idx)) continue;
    if (!traj || traj.length === 0) continue;

    const pts = traj.map(([lat, lon]) => {
      const p = map.latLngToContainerPoint([lat, lon]);
      return { x: p.x, y: p.y };
    });

    ctx.beginPath();
    ctx.strokeStyle = config.colors.label;
    ctx.lineWidth = config.lineWidthScale;
    ctx.lineCap = "round";
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();

    if (zoom >= config.dotsZoom && showDots) {
      const s = config.radiusScale * 2;
      ctx.fillStyle = config.colors.label;
      for (const pt of pts) ctx.fillRect(pt.x - s / 2, pt.y - s / 2, s, s);
    }

    ctx.fillStyle = config.colors.start;
    ctx.fillRect(pts[0].x - offset, pts[0].y - offset, markerSize, markerSize);
    ctx.fillStyle = config.colors.end;
    ctx.fillRect(pts[pts.length - 1].x - offset, pts[pts.length - 1].y - offset, markerSize, markerSize);
  }
}

// ---------------------------------------------------------------------------
// Draw predictions
// ---------------------------------------------------------------------------

export function drawPredictions(
  predictions: Map<number, RawTrajectory>,
  forces: Map<number, RawForces | null>,
  disabled: Set<number>,
  showDots: boolean,
  num_historic_tokens: number | null,
  enabledForces: boolean[],
  forceScale: number,
  info: DrawInfo,
  config: DrawConfig,
) {
  if (!predictions) return;

  const { map, canvas } = info;
  if (!canvas) return;

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const zoom = map.getZoom();
  const markerSize = config.radiusScale * 1.5;
  const offset = config.radiusScale * 0.75;
  const showForces = forceScale > 0 && enabledForces.some(Boolean);

  // print force and point of traj 10 point 150 for debugging

  for (const [idx, traj] of predictions.entries()) {
    if (disabled.has(idx)) continue;
    if (!traj || traj.length === 0) continue;

    const pts = traj.map(([lat, lon, ts]) => {
      const p = map.latLngToContainerPoint([lat, lon]);
      return { x: p.x, y: p.y, ts };
    });

    const baseTs = pts[0]?.ts;
    const cutoff = baseTs !== undefined && num_historic_tokens !== null
      ? num_historic_tokens
      : null;

    // Segments
    ctx.lineWidth = config.lineWidthScale;
    for (let i = 1; i < pts.length; i++) {
      const start = pts[i - 1];
      const end = pts[i];
      ctx.strokeStyle = cutoff !== null && i <= cutoff
        ? config.colors.label
        : config.colors.prediction;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    // Dots
    if (zoom >= config.dotsZoom && showDots) {
      const s = config.radiusScale * 2;
      // let i = 0;
      for (let i = 0; i < pts.length; i++) {
        ctx.fillStyle = cutoff !== null && i <= cutoff
          ? config.colors.label
          : config.colors.prediction;

        // if (idx === 10 && i++ === 150) {
        //   ctx.fillStyle = "rgb(0, 0, 0)";
        // }
        ctx.fillRect(pts[i].x - s / 2, pts[i].y - s / 2, s, s);
      }
    }

    // Start / end markers
    ctx.fillStyle = config.colors.start;
    ctx.fillRect(pts[0].x - offset, pts[0].y - offset, markerSize, markerSize);
    ctx.fillStyle = config.colors.end;
    ctx.fillRect(pts[pts.length - 1].x - offset, pts[pts.length - 1].y - offset, markerSize, markerSize);

    // Force arrows
    if (showForces) {
      const trajForces = forces.get(idx);
      if (trajForces) {
        for (let pi = 0; pi < pts.length; pi++) {
          const ptForces = trajForces[pi];
          if (!ptForces) continue;

          // if (idx === 10 && pi === 150) {
          //   console.log(`=== Traj ${idx} Point ${pi} ===`);
          //   console.log(`lat/lon: ${traj[pi][0]}, ${traj[pi][1]}`);
          //   console.log(`canvas xy: ${pts[pi].x}, ${pts[pi].y}`);
          //   ptForces.forEach((f, fi) => {
          //     console.log(`Force ${fi} (${forceColor(fi)}): vx=${f[0].toFixed(4)}, vy=${f[1].toFixed(4)}`);
          //   });
          // }


          for (let fi = 0; fi < ptForces.length; fi++) {
            if (!enabledForces[fi]) continue;
            const [vx, vy] = ptForces[fi];
            drawArrow(ctx, pts[pi].x, pts[pi].y, vx, vy, forceScale, forceColor(fi), config);
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Draw polygons (EEZ outlines)
// ---------------------------------------------------------------------------

export function drawPolygons(
  polygons: Polygon[],
  fullFidelity: boolean,
  info: DrawInfo,
  config: DrawConfig,
) {
  const { map, canvas } = info;
  if (!canvas) return;

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
      const start = map.latLngToContainerPoint([level.outline.points[0].lat, level.outline.points[0].lng]);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < level.outline.points.length; i++) {
        const pt = map.latLngToContainerPoint([level.outline.points[i].lat, level.outline.points[i].lng]);
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
  if (!canvas) return;
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
  if (!canvas) return;
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