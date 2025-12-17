import type { DrawInfo } from "../components/CanvasLayer";
import type { Bound } from "../types/Bound";
import type { GeoImage } from "../types/GeoImage";
import type { Polygon } from "../types/Polygon";
import type { Prediction } from "../types/Prediction";
import type { Trajectory } from "../types/Trajectory";
import type { ZoomLevels } from "../types/ZoomLevels";

// ------------------- Global Config -------------------
export const DrawConfig = {
  colors: {
    true: "rgba(0,100,255)",
    masked: "rgba(255,0,0)",
    truePoints: "rgba(0,100,255)",
    truePredictedLine: "black",
    polygonStroke: "orange",
    start: "green",
    end: "red",
  },
  dotsZoom: 13,    // Zoom level to start drawing points
  radiusScale: 3,        // Base radius for points
  lineWidthScale: 2,     // Base line width for lines
  dashPattern: [4, 4],   // For dashed lines
};

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
  trajectories: ZoomLevels<Trajectory[]>,
  maxTrajectories: number,
  fullTrajectoryFidelity: boolean,
  showDots: boolean,
  info: DrawInfo
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
  const trajZoom = fullTrajectoryFidelity ? 18 : zoom;

  trajectories[trajZoom]?.slice(0, maxTrajectories).forEach((t) => {
    if (t.messages.length === 0) return;
    if (!isBoundingBoxInView(t.boundingBox, viewBox)) return;

    const pts = t.messages.map((p) => {
      const pt = map.latLngToContainerPoint([p.point.lat, p.point.lng]);
      return { x: pt.x, y: pt.y };
    });

    // Draw trajectory line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = DrawConfig.colors.true;
    ctx.lineWidth = DrawConfig.lineWidthScale;
    ctx.stroke();

    // Draw trajectory points
    if (zoom >= DrawConfig.dotsZoom && showDots) {
      ctx.fillStyle = DrawConfig.colors.true;
      for (let i = 0; i < pts.length; i++) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, DrawConfig.radiusScale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw start and end points
    const radius = DrawConfig.radiusScale;
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = DrawConfig.colors.start;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pts[pts.length - 1].x, pts[pts.length - 1].y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = DrawConfig.colors.end;
    ctx.fill();
  });
};

export function drawPredictions(
  predictionsByZoom: ZoomLevels<Prediction[]> | undefined,
  fullFidelity: boolean,
  showDots: boolean,
  showCorrectionLines: boolean,
  info: DrawInfo
) {
  if (!predictionsByZoom) return;

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
  const trajZoom = fullFidelity ? 18 : zoom;
  const trajectories = predictionsByZoom[trajZoom];

  trajectories.forEach((t) => {
    if (t.predictedPoints.length === 0) return;
    if (!isBoundingBoxInView(t.boundingBoxPredicted, viewBox)) return;
    if (!isBoundingBoxInView(t.boundingBoxTrue, viewBox)) return;

    const predPts = t.predictedPoints.map((p) => {
      const pt = map.latLngToContainerPoint([p.lat, p.lng]);
      return { x: pt.x, y: pt.y };
    });

    const truePts = t.truePoints.map((p) => {
      const pt = map.latLngToContainerPoint([p.lat, p.lng]);
      return { x: pt.x, y: pt.y };
    });

    // ---------------- Dashed Lines Between True & Predicted ----------------
    if (showCorrectionLines) {
      ctx.strokeStyle = DrawConfig.colors.truePredictedLine;
      ctx.lineWidth = DrawConfig.lineWidthScale * 0.7;
      ctx.setLineDash(DrawConfig.dashPattern);

      for (let i = 0; i < Math.min(truePts.length, predPts.length); i++) {
        if (t.masks[i]) continue;
        ctx.beginPath();
        ctx.moveTo(truePts[i].x, truePts[i].y);
        ctx.lineTo(predPts[i].x, predPts[i].y);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }

    // ---- draw predicted lines ----
    for (let i = 1; i < predPts.length; i++) {
      const strokeStyle = !t.masks[i] || !t.masks[i - 1]
        ? DrawConfig.colors.masked
        : DrawConfig.colors.true;
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = DrawConfig.lineWidthScale;

      ctx.beginPath();
      ctx.moveTo(predPts[i - 1].x, predPts[i - 1].y);
      ctx.lineTo(predPts[i].x, predPts[i].y);
      ctx.stroke();
    }

    // Draw masked points
    if (zoom >= DrawConfig.dotsZoom && showDots) {
      ctx.fillStyle = DrawConfig.colors.masked;
      for (let i = 0; i < predPts.length; i++) {
        if (t.masks[i]) continue;
        ctx.beginPath();
        ctx.arc(predPts[i].x, predPts[i].y, DrawConfig.radiusScale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ---- draw true lines ----
    ctx.strokeStyle = DrawConfig.colors.truePoints;
    ctx.lineWidth = DrawConfig.lineWidthScale;
    ctx.beginPath();
    ctx.moveTo(truePts[0].x, truePts[0].y);
    for (let i = 1; i < truePts.length; i++) {
      ctx.lineTo(truePts[i].x, truePts[i].y);
    }
    ctx.stroke();

    // ---- draw true points ----
    if (zoom >= DrawConfig.dotsZoom && showDots) {
      ctx.fillStyle = DrawConfig.colors.truePoints;
      for (let i = 0; i < truePts.length; i++) {
        ctx.beginPath();
        ctx.arc(
          truePts[i].x,
          truePts[i].y,
          DrawConfig.radiusScale,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // ---------------- Start/End Points ----------------
    const radius = DrawConfig.radiusScale;
    ctx.beginPath();
    ctx.arc(truePts[0].x, truePts[0].y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = DrawConfig.colors.start;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(truePts[truePts.length - 1].x, truePts[truePts.length - 1].y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = DrawConfig.colors.end;
    ctx.fill();
  });
}

export function drawPolygons(
  polygons: ZoomLevels<Polygon[]>,
  fullFidelity: boolean,
  info: DrawInfo
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
  const trajZoom = fullFidelity ? 18 : zoom;

  polygons[trajZoom]?.forEach((polygon) => {
    if (!isBoundingBoxInView(polygon.outline.boundingBox, viewBox)) return;

    if (polygon.outline.points.length > 0) {
      ctx.beginPath();
      const start = map.latLngToContainerPoint([polygon.outline.points[0].lat, polygon.outline.points[0].lng]);
      ctx.moveTo(start.x, start.y);

      for (let i = 1; i < polygon.outline.points.length; i++) {
        const pt = map.latLngToContainerPoint([polygon.outline.points[i].lat, polygon.outline.points[i].lng]);
        ctx.lineTo(pt.x, pt.y);
      }

      ctx.closePath();
      ctx.strokeStyle = DrawConfig.colors.polygonStroke;
      ctx.lineWidth = DrawConfig.lineWidthScale;
      ctx.stroke();
    }

    if (polygon.holes) {
      polygon.holes.forEach((hole) => {
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
        ctx.strokeStyle = DrawConfig.colors.polygonStroke;
        ctx.lineWidth = DrawConfig.lineWidthScale;
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
