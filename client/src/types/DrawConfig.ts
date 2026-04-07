export type DrawConfig = {
    colors: {
        label: string;
        prediction: string;
        polygonStroke: string;
        start: string;
        end: string;
    };
    dotsZoom: number;
    radiusScale: number;
    lineWidthScale: number;
    dashPattern: number[];
}