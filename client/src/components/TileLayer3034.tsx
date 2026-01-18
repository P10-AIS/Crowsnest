import L from "leaflet";
import { CRS_3034 } from "../assets/crs3034";
import { useMap } from "react-leaflet";
import { useEffect } from "react";

function TileLayer3034() {
    const map = useMap();

    useEffect(() => {
        const wmsOptions: L.WMSOptions = {
            crs: CRS_3034,
            layers: 'world',
            format: 'image/png',
            transparent: true,
            version: '1.1.1',
            attribution: '© Omniscale',
        };

        const layer = L.tileLayer.wms("/api/omniscale/wms", wmsOptions);

        map.addLayer(layer);

        return () => {
            map.removeLayer(layer);
        };
    }, [map]);

    return null;
}

export default TileLayer3034;
