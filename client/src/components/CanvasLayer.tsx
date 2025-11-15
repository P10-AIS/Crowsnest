import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export interface drawInfo {
  map: L.Map;
  canvas: HTMLCanvasElement;
}

interface CanvasLayerProps {
  drawMethod: (info: drawInfo) => void;
}

function CanvasLayer({ drawMethod }: CanvasLayerProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = L.DomUtil.create("canvas", "leaflet-canvas-layer");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.zIndex = "1000";
    canvas.style.pointerEvents = "none";

    const mapContainer = map.getContainer();
    mapContainer.appendChild(canvas);
    canvasRef.current = canvas;

    const redraw = () => {
      if (!canvasRef.current) return;
      drawMethod({ map, canvas: canvasRef.current });
    };

    const resizeCanvas = () => {
      if (!canvasRef.current) return;
      const size = map.getSize();
      canvasRef.current.width = size.x;
      canvasRef.current.height = size.y;
      redraw();
    };

    map.on("move", redraw);
    map.on("resize", resizeCanvas);

    resizeCanvas();
    redraw();

    return () => {
      map.off("move", redraw);
      map.off("resize", resizeCanvas);

      if (canvasRef.current) {
        mapContainer.removeChild(canvasRef.current);
      }
    };
  }, [map, drawMethod]);

  return null;
}

export default CanvasLayer;