import { useEffect } from "react";
import { useMapEvents } from "react-leaflet";
import { useAppContext } from "../contexts/AppContext";

export default function MapController() {
  const { zoom, setZoom, center, setCenter } = useAppContext();
  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    },
    moveend: () => {
      const newCenter = map.getCenter();
      setCenter([newCenter.lat, newCenter.lng]);
    },
  });

  useEffect(() => {
    if (zoom !== undefined && zoom !== map.getZoom()) {
      map.setZoom(zoom);
    }
  }, [zoom, map]);

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