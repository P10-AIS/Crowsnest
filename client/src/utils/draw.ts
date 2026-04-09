import type { DrawInfo } from "../components/CanvasLayer";
import type { Bound } from "../types/Bound";
import type { DrawConfig } from "../types/DrawConfig";
import type { GeoImage } from "../types/GeoImage";
import type { Polygon } from "../types/Polygon";
import type { Trajectory } from "../types/Prediction";

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

export const drawTrajectories = (
  trajectories: Trajectory[],
  density: number,
  fullTrajectoryFidelity: boolean,
  showDots: boolean,
  info: DrawInfo,
  config: DrawConfig,
) => {
  const { map, canvas } = info;
  // alpha: true (default) ensures the background stays transparent
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
  const markerSize = config.radiusScale * 1.5;

  trajectories
    .slice(0, Math.ceil(trajectories.length * density))
    .forEach((t) => {
      if (!t.enabled || t.level[trajZoom].points.length === 0) return;
      if (!isBoundingBoxInView(t.level[trajZoom].boundingBox, viewBox)) return;

      const pts = t.level[trajZoom].points.map((p) => {
        if (p.lat === null || p.lng === null || p.lat === undefined) return null;
        const pt = map.latLngToContainerPoint([p.lat, p.lng]);
        return { x: pt.x, y: pt.y };
      });

      ctx.beginPath();
      ctx.strokeStyle = config.colors.label;
      ctx.lineWidth = config.lineWidthScale;
      ctx.lineCap = "round"; 

    // --- Draw trajectory points (Dots) ---
      if (zoom >= config.dotsZoom && showDots) {
        ctx.fillStyle = config.colors.label;
        for (const pt of pts) {
          if (!pt) continue;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, config.radiusScale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      let isFirst = true;
      for (const pt of pts) {
        if (!pt) {
          isFirst = true;
          continue;
        }
        if (isFirst) {
          ctx.moveTo(pt.x, pt.y);
          isFirst = false;
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.stroke();

      const firstPt = pts.find(p => p !== null);
      const lastPt = [...pts].reverse().find(p => p !== null);

      if (firstPt) {
        ctx.fillStyle = config.colors.start;
        ctx.fillRect(
          firstPt.x - (config.radiusScale * 0.75), 
          firstPt.y - (config.radiusScale * 0.75), 
          markerSize, 
          markerSize
        );
      }

      if (lastPt) {
        ctx.fillStyle = config.colors.end;
        ctx.fillRect(
          lastPt.x - (config.radiusScale * 0.75), 
          lastPt.y - (config.radiusScale * 0.75), 
          markerSize, 
          markerSize
        );
      }
    });
};

export function drawPredictions(
  predictions: Trajectory[],
  density: number,
  fullFidelity: boolean,
  showDots: boolean,
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

  predictions.slice(0, Math.ceil(predictions.length * density)).forEach((p) => {
    if (p.level[trajZoom].points.length === 0) return;
    if (!isBoundingBoxInView(p.level[trajZoom].boundingBox, viewBox)) return;

    idsInView.add(p.trajectoryId);

    if (!p.enabled) return;

    const predPts = p.level[trajZoom].points.map((pt) => {
      // Check if coordinates are valid numbers before passing to the map
      if (pt.lat === null || pt.lng === null || pt.lat === undefined) {
        return null; 
      }
      const containerPt = map.latLngToContainerPoint([pt.lat, pt.lng]);
      return { x: containerPt.x, y: containerPt.y };
    });

    if (zoom >= config.dotsZoom && showDots) {
      ctx.fillStyle = config.colors.prediction;
      
      for (let i = 0; i < predPts.length; i++) {
        const pt = predPts[i];
        if (p.level[trajZoom].padding[i] || pt === null) {
          continue;
        }
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, config.radiusScale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ---- draw predicted lines ----
    for (let i = 1; i < predPts.length; i++) {
      const start = predPts[i - 1];
      const end = predPts[i];

      // Skip if this segment involves a null point OR is explicitly marked as padding
      if (!start || !end || p.level[trajZoom].padding[i]) continue;

      ctx.strokeStyle = config.colors.prediction;
      ctx.lineWidth = config.lineWidthScale;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
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

  ctx.globalAlpha = geoImage.opacity;
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
