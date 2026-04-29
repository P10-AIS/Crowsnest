import { MapContainer, ZoomControl } from "react-leaflet";
import type { JSX } from "react";
import MapController from "./MapController";

function Map3857({ children }: { children: JSX.Element }) {
    return (
        <MapContainer
            center={[56.15674, 10.21076]}
            zoom={13}
            minZoom={1}
            style={{ width: "100%", height: "100%" }}
            zoomControl={false}
        >
            <MapController />
            <ZoomControl position="bottomright" />
            {children}
        </MapContainer>
    );
}

export default Map3857;
