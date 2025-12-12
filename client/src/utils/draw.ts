import type { DrawInfo } from "../components/CanvasLayer";
import type { Bound } from "../types/Bound";
import type { GeoImage } from "../types/GeoImage";
import type { Polygon } from "../types/Polygon";
import type { PredictionStep } from "../types/Prediction";
import type { Trajectory } from "../types/Trajectory";
import type { ZoomLevels } from "../types/ZoomLevels";

export const drawTrajectories = (
  trajectories: ZoomLevels<Trajectory[]>,
  maxTrajectories: number,
  fullTrajectoryFidelity: boolean,
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

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = "rgba(0,100,255,0.8)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "rgba(0,100,255,0.8)";
    for (let i = 0; i < pts.length; i++) {
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, 2, 0, Math.PI * 2);
      ctx.fill();
    }


    const radius = 2;

    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "green";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pts[pts.length - 1].x, pts[pts.length - 1].y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
  });
}

export function drawPredictions(
  predictionStep: ZoomLevels<PredictionStep> | undefined,
  fullFidelity: boolean,
  info: DrawInfo
) {
  if (!predictionStep) return;

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

  const trajectories = predictionStep[trajZoom].predictions;

  trajectories.forEach((t) => {
    if (t.predictedPoints.length === 0) return;

    if (!isBoundingBoxInView(t.boundingBoxPredicted, viewBox)) return;
    if (!isBoundingBoxInView(t.boundingBoxTrue, viewBox)) return;

    // Draw predicted points in solid line
    const predPts = t.predictedPoints.map((p) => {
      const pt = map.latLngToContainerPoint([p.lat, p.lng]);
      return { x: pt.x, y: pt.y };
    });
    ctx.beginPath();
    ctx.moveTo(predPts[0].x, predPts[0].y);
    for (let i = 1; i < predPts.length; i++) {
      ctx.lineTo(predPts[i].x, predPts[i].y);
    }
    ctx.strokeStyle = "rgba(255,0,0,0.8)";
    ctx.lineWidth = 1;
    ctx.stroke();


    // Draw true points in dashed line
    const truePts = t.truePoints.map((p) => {
      const pt = map.latLngToContainerPoint([p.lat, p.lng]);
      return { x: pt.x, y: pt.y };
    });

    // ctx.beginPath();
    // ctx.moveTo(truePts[0].x, truePts[0].y);
    // for (let i = 1; i < truePts.length; i++) {
    //   ctx.lineTo(truePts[i].x, truePts[i].y);
    // }
    // ctx.strokeStyle = "rgba(0,100,255,0.8)";
    // ctx.lineWidth = 1;
    // ctx.stroke();

    ctx.fillStyle = "rgba(0,100,255,0.8)"; // Use fillStyle for solid points

    for (let i = 0; i < truePts.length; i++) {
      ctx.beginPath();
      // arc(x, y, radius, startAngle, endAngle)
      ctx.arc(truePts[i].x, truePts[i].y, 2, 0, Math.PI * 2);
      ctx.fill();
    }


    // Draw line between corresponding true & predicted points
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 0.7;
    ctx.setLineDash([4, 4]); // dashed

    for (let i = 0; i < Math.min(truePts.length, predPts.length); i++) {
      ctx.beginPath();
      ctx.moveTo(truePts[i].x, truePts[i].y);
      ctx.lineTo(predPts[i].x, predPts[i].y);
      ctx.stroke();
    }

    ctx.setLineDash([]); // reset


    // Draw start and end points
    const radius = 2;

    ctx.beginPath();
    ctx.arc(truePts[0].x, truePts[0].y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "green";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(truePts[truePts.length - 1].x, truePts[truePts.length - 1].y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
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
      ctx.fillStyle = "rgba(255, 165, 0, 0.1)";
      // ctx.fill();
      ctx.strokeStyle = "orange";
      ctx.lineWidth = 1;
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
        ctx.fillStyle = "rgba(255,255,255,1)";
        // ctx.fill();
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  });
}

function isBoundingBoxInView(bbox: Bound, view: Bound): boolean {
  return !(
    bbox.maxLat < view.minLat ||
    bbox.minLat > view.maxLat ||
    bbox.maxLng < view.minLng ||
    bbox.minLng > view.maxLng
  );
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


  const topRight = map.latLngToContainerPoint([
    area.topRight.lat,
    area.topRight.lng
  ]);

  const bottomLeft = map.latLngToContainerPoint([
    area.bottomLeft.lat,
    area.bottomLeft.lng
  ]);

  const width = topRight.x - bottomLeft.x;
  const height = bottomLeft.y - topRight.y;

  // low opacity for better visibility of other layers
  ctx.globalAlpha = opacity;
  ctx.drawImage(
    img,
    bottomLeft.x,
    topRight.y,
    width,
    height
  );
};


export function drawShipCursor(info: DrawInfo, shipImage: HTMLImageElement | null) {
  if (!shipImage) return;

  const { map, canvas } = info;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const center = map.getCenter();
  const centerPoint = map.latLngToContainerPoint(center);

  const pixelLength = metersToPixels(map, 20);

  // Maintain aspect ratio
  const aspect = shipImage.width / shipImage.height;
  const width = pixelLength;
  const height = pixelLength / aspect;

  // Draw centered
  ctx.save();

  ctx.translate(centerPoint.x, centerPoint.y);


  ctx.drawImage(
    shipImage,
    -width / 2,
    -height / 2,
    width,
    height
  );

  ctx.restore();
}


function metersToPixels(map: L.Map, meters: number): number {
  const center = map.getCenter();

  // Move the center by X meters north
  const earthRadius = 6378137;
  const dLat = (meters / earthRadius) * (180 / Math.PI);

  const pointA = map.latLngToContainerPoint(center);
  const pointB = map.latLngToContainerPoint({
    lat: center.lat + dLat,
    lng: center.lng,
  });

  return Math.abs(pointA.y - pointB.y);
}
