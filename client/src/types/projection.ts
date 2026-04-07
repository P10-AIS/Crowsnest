
export const Projection = {
    EPSG3857: "EPSG:3857",
    EPSG3034: "EPSG:3034",
} as const;

export type Projection = typeof Projection[keyof typeof Projection];