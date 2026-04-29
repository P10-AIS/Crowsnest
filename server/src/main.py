import json
import os
import re
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv

from src.loader import load_all_predictions, load_all_labels
from src.index import trajectories_in_viewport
from src.thinning import thin_trajectory
from src.models import TrajectoryStore

load_dotenv()

# ---------------------------------------------------------------------------
# App state
# ---------------------------------------------------------------------------

prediction_stores: dict[str, TrajectoryStore] = {}
label_stores: dict[str, TrajectoryStore] = {}
http_client: httpx.AsyncClient

IMAGES_FOLDER = "Data/Heatmaps"


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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _viewport_params(
    lat_min: float = Query(...),
    lat_max: float = Query(...),
    lon_min: float = Query(...),
    lon_max: float = Query(...),
    zoom: int = Query(..., ge=1, le=18),
):
    """Shared dependency for viewport query params."""
    return {
        "lat_min": lat_min,
        "lat_max": lat_max,
        "lon_min": lon_min,
        "lon_max": lon_max,
        "zoom": zoom,
    }


def _stream_trajectories(store: TrajectoryStore, lat_min, lat_max, lon_min, lon_max, zoom):
    """
    Generator that yields NDJSON lines, one trajectory per line.

    Each line is a JSON object:
      {"i": <traj_index>, "pts": [[lat, lon, ts], ...]}

    The stream opens with a header line:
      {"type": "header", "source": "<name>", "total": <n_in_viewport>}

    And closes with:
      {"type": "done"}

    This lets the frontend know upfront how many trajectories to expect,
    and detect clean stream completion vs a dropped connection.
    """
    matching = trajectories_in_viewport(
        store, lat_min, lat_max, lon_min, lon_max)

    # Header — tells the frontend total count before data starts arriving
    yield json.dumps({"type": "header", "source": store.name, "total": len(matching)}) + "\n"

    for i, traj in enumerate(matching):
        pts = thin_trajectory(traj.points, zoom)
        if not pts:
            continue
        yield json.dumps({"type": "traj", "i": i, "pts": pts}) + "\n"

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
):
    """
    Stream trajectories for one model that intersect the given viewport.
    Response is NDJSON (Content-Type: application/x-ndjson).
    """
    store = prediction_stores.get(model_name)
    if store is None:
        raise HTTPException(
            status_code=404, detail=f"Model '{model_name}' not found.")

    return StreamingResponse(
        _stream_trajectories(store, lat_min, lat_max, lon_min, lon_max, zoom),
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
):
    """
    Stream label trajectories for one dataset that intersect the given viewport.
    Response is NDJSON (Content-Type: application/x-ndjson).
    """
    store = label_stores.get(dataset_name)
    if store is None:
        raise HTTPException(
            status_code=404, detail=f"Dataset '{dataset_name}' not found.")

    return StreamingResponse(
        _stream_trajectories(store, lat_min, lat_max, lon_min, lon_max, zoom),
        media_type="application/x-ndjson",
    )


@app.get("/predictions")
async def list_predictions():
    """Lists all available prediction model names and their trajectory counts."""
    return {
        name: {"count": len(store.trajectories)}
        for name, store in prediction_stores.items()
    }


@app.get("/labels")
async def list_labels():
    """Lists all available label dataset names and their trajectory counts."""
    return {
        name: {"count": len(store.trajectories)}
        for name, store in label_stores.items()
    }


@app.post("/reload/predictions")
async def reload_predictions():
    global prediction_stores
    prediction_stores = load_all_predictions()
    return {"reloaded": list(prediction_stores.keys())}


@app.post("/reload/labels")
async def reload_labels():
    global label_stores
    label_stores = load_all_labels()
    return {"reloaded": list(label_stores.keys())}


# ---------------------------------------------------------------------------
# Image / heatmap endpoints (unchanged)
# ---------------------------------------------------------------------------

@app.get("/omniscale/wms")
async def omniscale_proxy(request: Request):
    api_key = os.getenv("OMNISCALE_API_KEY")
    print(f"Received Omniscale proxy request: {api_key}")
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


HEATMAP_PATTERN = re.compile(
    r"BL_(?P<bl_lat>[\d.-]+)_(?P<bl_lon>[\d.-]+)"
    r"_TR_(?P<tr_lat>[\d.-]+)_(?P<tr_lon>[\d.-]+)"
    r"_PROJ_(?P<proj_str>[\w.]+)"
)


@app.get("/images")
def list_images():
    images = []
    if os.path.exists(IMAGES_FOLDER):
        images = [
            f for f in os.listdir(IMAGES_FOLDER)
            if os.path.isfile(os.path.join(IMAGES_FOLDER, f))
            and HEATMAP_PATTERN.search(f)
        ]
    return {"images": images}


@app.get("/image/{filename}")
def get_heatmap(filename: str):
    path = os.path.join(IMAGES_FOLDER, filename)
    if not (os.path.exists(path) and os.path.isfile(path)):
        raise HTTPException(status_code=404, detail="Heatmap not found.")

    match = HEATMAP_PATTERN.search(filename)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid filename format.")

    c = match.groupdict()
    metadata = {
        "projection": c["proj_str"].replace(".", ":"),
        "area": {
            "top_right": {"lat": float(c["tr_lat"]), "lon": float(c["tr_lon"])},
            "bottom_left": {"lat": float(c["bl_lat"]), "lon": float(c["bl_lon"])},
        },
    }
    return FileResponse(
        path,
        media_type="image/png",
        headers={"x-image-metadata": json.dumps(metadata)},
    )
