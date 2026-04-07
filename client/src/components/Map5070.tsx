import { MapContainer, ZoomControl } from "react-leaflet";
import type { JSX } from "react";
import { CRS_5070 } from "../assets/crs";

function Map5070({ children }: { children: JSX.Element }) {
  return (
    <MapContainer
      crs={CRS_5070}
      center={[28.220523, -81.240814]}
      zoom={4}
      minZoom={1}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
    >
      <ZoomControl position="bottomright" />
      {children}
    </MapContainer>
  );
}

export default Map5070;
