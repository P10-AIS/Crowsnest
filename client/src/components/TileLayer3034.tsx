import L from "leaflet";
import { CRS_3034 } from "../assets/crs3034";
import { useMap } from "react-leaflet";
import { useEffect } from "react";

function TileLayer3034() {
    const map = useMap();

    useEffect(() => {
        const wmsOptions: L.WMSOptions = {
            crs: CRS_3034,
            layers: 'SRTM30-Colored',
            format: 'image/png',
            transparent: true,
            version: '1.3.0',
        };
        const layer = L.tileLayer.wms('http://ows.mundialis.de/services/service?', wmsOptions);


        map.addLayer(layer);

        return () => {
            map.removeLayer(layer);
        };
    }, [map]);

    return null;
}


export default TileLayer3034;