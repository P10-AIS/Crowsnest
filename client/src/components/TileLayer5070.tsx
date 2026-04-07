import L from "leaflet";
import { CRS_5070 } from "../assets/crs";
import { useMap } from "react-leaflet";
import { useEffect } from "react";

function TileLayer5070() {
    const map = useMap();

    useEffect(() => {
        const wmsOptions: L.WMSOptions = {
            crs: CRS_5070,
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

export default TileLayer5070;
