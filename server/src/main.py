import rasterio
import json
import os
import re
import io
from contextlib import asynccontextmanager
from PIL import Image as PILImage
from fastapi.responses import Response
from pyproj import Transformer
import numpy as np

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv

from src.loader import load_all_predictions, load_all_labels
from src.index import trajectories_in_viewport
from src.thinning import thin_trajectory, zoom_to_stride
from src.models import TrajectoryStore

load_dotenv()

# ---------------------------------------------------------------------------
# App state
# ---------------------------------------------------------------------------

prediction_stores: dict[str, TrajectoryStore] = {}
label_stores: dict[str, TrajectoryStore] = {}
http_client: httpx.AsyncClient

IMAGES_FOLDER = "Data/Images"

# Placeholder force names until stored in dataset
FORCE_NAMES = ["Traffic", "Depth", "Current", "Force 4",
               "Force 5", "Force 6", "Force 7", "Force 8"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client, prediction_stores, label_stores

    print("Loading predictions...")
    prediction_stores = load_all_predictions()

    print("Loading labels...")
    label_stores = load_all_labels()

    print("All data loaded.")

    http_client = httpx.AsyncClient()
    yield

    prediction_stores.clear()
    label_stores.clear()
    await http_client.aclose()


app = FastAPI(lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _stream_trajectories(store: TrajectoryStore, lat_min, lat_max, lon_min, lon_max, zoom, limit=None):
    matching = trajectories_in_viewport(
        store, lat_min, lat_max, lon_min, lon_max, limit)

    yield json.dumps({"type": "header", "source": store.name, "total": len(matching)}) + "\n"

    stride = zoom_to_stride(zoom)

    for traj, store_idx in matching:
        pts = thin_trajectory(traj.points, zoom)
        if not pts:
            continue

        msg: dict = {"type": "traj", "i": store_idx, "pts": pts}

        # Include forces thinned to same indices as points
        if traj.forces is not None and traj.forces.size > 0:
            min_len = min(len(traj.points), len(traj.forces))
            valid_mask = ~np.isnan(traj.points[:min_len]).any(axis=1)
            valid_forces = traj.forces[:min_len][valid_mask][::stride]
            msg["forces"] = valid_forces.tolist()

        yield json.dumps(msg) + "\n"

    yield json.dumps({"type": "done"}) + "\n"


# ---------------------------------------------------------------------------
# Trajectory endpoints
# ---------------------------------------------------------------------------

@app.get("/predictions/{model_name}")
async def get_predictions(
    model_name: str,
    lat_min: float = Query(...),
    lat_max: float = Query(...),
    lon_min: float = Query(...),
    lon_max: float = Query(...),
    zoom: int = Query(..., ge=1, le=18),
    limit: int = Query(default=None, ge=1),
):
    store = prediction_stores.get(model_name)
    if store is None:
        raise HTTPException(
            status_code=404, detail=f"Model '{model_name}' not found.")

    return StreamingResponse(
        _stream_trajectories(store, lat_min, lat_max,
                             lon_min, lon_max, zoom, limit),
        media_type="application/x-ndjson",
    )


@app.get("/labels/{dataset_name}")
async def get_labels(
    dataset_name: str,
    lat_min: float = Query(...),
    lat_max: float = Query(...),
    lon_min: float = Query(...),
    lon_max: float = Query(...),
    zoom: int = Query(..., ge=1, le=18),
    limit: int = Query(default=None, ge=1),
):
    store = label_stores.get(dataset_name)
    if store is None:
        raise HTTPException(
            status_code=404, detail=f"Dataset '{dataset_name}' not found.")

    return StreamingResponse(
        _stream_trajectories(store, lat_min, lat_max,
                             lon_min, lon_max, zoom, limit),
        media_type="application/x-ndjson",
    )


@app.get("/predictions")
async def list_predictions():
    return {
        name: {
            "count": len(store.trajectories),
            "historic_horizon_m": store.historic_horizon_m,
            "num_forces": store.num_forces,
            "force_names": FORCE_NAMES[:store.num_forces],
        }
        for name, store in prediction_stores.items()
    }


@app.get("/labels")
async def list_labels():
    return {
        name: {"count": len(store.trajectories)}
        for name, store in label_stores.items()
    }


@app.get("/refresh")
async def refresh():
    global prediction_stores, label_stores
    prediction_stores = load_all_predictions()
    label_stores = load_all_labels()
    return {"status": "success", "message": "Backend data refreshed."}


# ---------------------------------------------------------------------------
# Image endpoints
# ---------------------------------------------------------------------------

@app.get("/omniscale/wms")
async def omniscale_proxy(request: Request):
    api_key = os.getenv("OMNISCALE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, detail="Missing Omniscale API key")

    try:
        response = await http_client.get(
            f"https://maps.omniscale.net/v2/{api_key}/style.default/map",
            params=request.query_params,
        )
        return StreamingResponse(
            response.aiter_bytes(),
            media_type=response.headers.get("content-type", "image/png"),
            headers={"Cache-Control": "public, max-age=86400"},
        )
    except Exception as e:
        print(f"Omniscale proxy error: {e}")
        raise HTTPException(status_code=500, detail="Proxy failed")


@app.get("/images")
def list_images():
    images = []
    if os.path.exists(IMAGES_FOLDER):
        images = [
            f for f in os.listdir(IMAGES_FOLDER)
            if os.path.isfile(os.path.join(IMAGES_FOLDER, f))
            and f.lower().endswith((".tif", ".tiff"))
        ]
    return {"images": images}


@app.get("/image/{filename}")
def get_image(filename: str):
    path = os.path.join(IMAGES_FOLDER, filename)
    if not (os.path.exists(path) and os.path.isfile(path)):
        raise HTTPException(status_code=404, detail="Image not found.")

    try:
        with rasterio.open(path) as src:
            crs_string = src.crs.to_string()
            transformer = Transformer.from_crs(
                src.crs, "EPSG:4326", always_xy=True)

            left, bottom, right, top = src.bounds
            lon_min, lat_min = transformer.transform(left, bottom)
            lon_max, lat_max = transformer.transform(right, top)

            metadata = {
                "projection": crs_string,
                "area": {
                    "top_right": {"lat": lat_max, "lon": lon_max},
                    "bottom_left": {"lat": lat_min, "lon": lon_min},
                },
            }

            data = src.read([1, 2, 3]).transpose(1, 2, 0)  # (H, W, 3)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to read GeoTIFF: {e}")

    img = PILImage.fromarray(data, mode="RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return Response(
        content=buf.read(),
        media_type="image/png",
        headers={"x-image-metadata": json.dumps(metadata)},
    )
