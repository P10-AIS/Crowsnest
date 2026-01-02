import type { DrawInfo } from "../components/CanvasLayer";
import type { Bound } from "../types/Bound";
import type { DrawConfig } from "../types/DrawConfig";
import type { GeoImage } from "../types/GeoImage";
import type { Polygon } from "../types/Polygon";
import type { Prediction } from "../types/Prediction";
import type { Trajectory } from "../types/Trajectory";

// ------------------- Utility Functions -------------------
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
  const pointB = map.latLngToContainerPoint({
    lat: center.lat + dLat,
    lng: center.lng,
  });

  return Math.abs(pointA.y - pointB.y);
}

// ------------------- Drawing Functions -------------------
export const drawTrajectories = (
  trajectories: Trajectory[],
  maxTrajectories: number,
  fullTrajectoryFidelity: boolean,
  showDots: boolean,
  info: DrawInfo,
  config: DrawConfig,
) => {
  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bounds = map.getBounds();
  const viewBox: Bound = {
    minLat: bounds.getSouth(),
    minLng: bounds.getWest(),
    maxLat: bounds.getNorth(),
    maxLng: bounds.getEast(),
  };

  const zoom = map.getZoom();
  const trajZoom = fullTrajectoryFidelity ? 17 : zoom;

  trajectories.slice(0, maxTrajectories).forEach((t) => {
    if (t.level[trajZoom].messages.length === 0) return;
    if (!isBoundingBoxInView(t.level[trajZoom].boundingBox, viewBox)) return;

    const pts = t.level[trajZoom].messages.map((p) => {
      const pt = map.latLngToContainerPoint([p.point.lat, p.point.lng]);
      return { x: pt.x, y: pt.y };
    });

    // Draw trajectory line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = config.colors.true;
    ctx.lineWidth = config.lineWidthScale;
    ctx.stroke();

    // Draw trajectory points
    if (zoom >= config.dotsZoom && showDots) {
      ctx.fillStyle = config.colors.true;
      for (let i = 0; i < pts.length; i++) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, config.radiusScale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw start and end points
    const radius = config.radiusScale;
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = config.colors.start;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pts[pts.length - 1].x, pts[pts.length - 1].y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = config.colors.end;
    ctx.fill();
  });
};

export function drawPredictions(
  predictions: Prediction[],
  fullFidelity: boolean,
  showDots: boolean,
  showCorrectionLines: boolean,
  showGroundTruth: boolean,
  idsInViewCallback: (idsInView: Set<number>) => void,
  info: DrawInfo,
  config: DrawConfig
) {
  if (!predictions) return;

  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bounds = map.getBounds();
  const viewBox: Bound = {
    minLat: bounds.getSouth(),
    minLng: bounds.getWest(),
    maxLat: bounds.getNorth(),
    maxLng: bounds.getEast(),
  };

  const zoom = map.getZoom();
  const trajZoom = fullFidelity ? 17 : zoom;
  const idsInView = new Set<number>();

  predictions.forEach((p) => {
    if (p.level[trajZoom].predictedPoints.length === 0) return;
    if (!isBoundingBoxInView(p.level[trajZoom].boundingBoxPredicted, viewBox)) return;
    if (!isBoundingBoxInView(p.level[trajZoom].boundingBoxTrue, viewBox)) return;

    idsInView.add(p.trajectoryId);

    if (!p.enabled) return;

    const predPts = p.level[trajZoom].predictedPoints.map((p) => {
      const pt = map.latLngToContainerPoint([p.lat, p.lng]);
      return { x: pt.x, y: pt.y };
    });

    const truePts = p.level[trajZoom].truePoints.map((p) => {
      const pt = map.latLngToContainerPoint([p.lat, p.lng]);
      return { x: pt.x, y: pt.y };
    });

    // ---------------- Dashed Lines Between True & Predicted ----------------
    if (showCorrectionLines) {
      ctx.strokeStyle = config.colors.truePredictedLine;
      ctx.lineWidth = config.lineWidthScale * 0.7;
      ctx.setLineDash(config.dashPattern);

      for (let i = 0; i < Math.min(truePts.length, predPts.length); i++) {
        if (p.level[trajZoom].masks[i]) continue;
        ctx.beginPath();
        ctx.moveTo(truePts[i].x, truePts[i].y);
        ctx.lineTo(predPts[i].x, predPts[i].y);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }

    // ---- draw predicted lines ----
    for (let i = 1; i < predPts.length; i++) {
      const strokeStyle = !p.level[trajZoom].masks[i] || !p.level[trajZoom].masks[i - 1]
        ? config.colors.masked
        : config.colors.true;
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = config.lineWidthScale;

      ctx.beginPath();
      ctx.moveTo(predPts[i - 1].x, predPts[i - 1].y);
      ctx.lineTo(predPts[i].x, predPts[i].y);
      ctx.stroke();
    }

    // Draw masked points
    if (zoom >= config.dotsZoom && showDots) {
      ctx.fillStyle = config.colors.masked;
      for (let i = 0; i < predPts.length; i++) {
        if (p.level[trajZoom].masks[i]) continue;
        ctx.beginPath();
        ctx.arc(predPts[i].x, predPts[i].y, config.radiusScale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ---- draw true lines ----
    if (showGroundTruth) {
      ctx.strokeStyle = config.colors.truePoints;
      ctx.lineWidth = config.lineWidthScale;
      ctx.beginPath();
      ctx.moveTo(truePts[0].x, truePts[0].y);
      for (let i = 1; i < truePts.length; i++) {
        ctx.lineTo(truePts[i].x, truePts[i].y);
      }
      ctx.stroke();
    }

    // ---- draw true points ----
    if (zoom >= config.dotsZoom && showDots) {
      ctx.fillStyle = config.colors.truePoints;
      for (let i = 0; i < truePts.length; i++) {
        if (!showGroundTruth && !p.level[trajZoom].masks[i]) continue;
        ctx.beginPath();
        ctx.arc(
          truePts[i].x,
          truePts[i].y,
          config.radiusScale,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // ---------------- Start/End Points ----------------
    const radius = config.radiusScale;
    ctx.beginPath();
    ctx.arc(truePts[0].x, truePts[0].y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = config.colors.start;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(truePts[truePts.length - 1].x, truePts[truePts.length - 1].y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = config.colors.end;
    ctx.fill();
  });

  idsInViewCallback(idsInView);
}

export function drawPolygons(
  polygons: Polygon[],
  fullFidelity: boolean,
  info: DrawInfo,
  config: DrawConfig,
) {
  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bounds = map.getBounds();
  const viewBox: Bound = {
    minLat: bounds.getSouth(),
    minLng: bounds.getWest(),
    maxLat: bounds.getNorth(),
    maxLng: bounds.getEast(),
  };

  const zoom = map.getZoom();
  const trajZoom = fullFidelity ? 17 : zoom;

  polygons.forEach((polygon) => {
    if (!isBoundingBoxInView(polygon.level[trajZoom].outline.boundingBox, viewBox)) return;

    if (polygon.level[trajZoom].outline.points.length > 0) {
      ctx.beginPath();
      const start = map.latLngToContainerPoint([polygon.level[trajZoom].outline.points[0].lat, polygon.level[trajZoom].outline.points[0].lng]);
      ctx.moveTo(start.x, start.y);

      for (let i = 1; i < polygon.level[trajZoom].outline.points.length; i++) {
        const pt = map.latLngToContainerPoint([polygon.level[trajZoom].outline.points[i].lat, polygon.level[trajZoom].outline.points[i].lng]);
        ctx.lineTo(pt.x, pt.y);
      }

      ctx.closePath();
      ctx.strokeStyle = config.colors.polygonStroke;
      ctx.lineWidth = config.lineWidthScale;
      ctx.stroke();
    }

    if (polygon.level[trajZoom].holes) {
      polygon.level[trajZoom].holes.forEach((hole) => {
        if (!isBoundingBoxInView(hole.boundingBox, viewBox)) return;
        if (hole.points.length === 0) return;

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
      });
    }
  });
}

export const drawGeoImage = (
  geoImage: GeoImage | null,
  opacity: number,
  info: DrawInfo
) => {
  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!geoImage) return;

  const { img, area } = geoImage;
  const topRight = map.latLngToContainerPoint([area.topRight.lat, area.topRight.lng]);
  const bottomLeft = map.latLngToContainerPoint([area.bottomLeft.lat, area.bottomLeft.lng]);
  const width = topRight.x - bottomLeft.x;
  const height = bottomLeft.y - topRight.y;

  ctx.globalAlpha = opacity;
  ctx.drawImage(img, bottomLeft.x, topRight.y, width, height);
};

export function drawShipCursor(info: DrawInfo, shipImage: HTMLImageElement | null) {
  if (!shipImage) return;

  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const center = map.getCenter();
  const centerPoint = map.latLngToContainerPoint(center);
  const pixelLength = metersToPixels(map, 20);
  const aspect = shipImage.width / shipImage.height;
  const width = pixelLength;
  const height = pixelLength / aspect;

  ctx.save();
  ctx.translate(centerPoint.x, centerPoint.y);
  ctx.drawImage(shipImage, -width / 2, -height / 2, width, height);
  ctx.restore();
}
