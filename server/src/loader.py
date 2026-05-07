import os
import pickle
import numpy as np
from src.models import Trajectory, TrajectoryStore

MAX_FILE_SIZE_GB = float(os.getenv("MAX_FILE_SIZE_GB", "1.0"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_GB * 1024 ** 3


def _bbox_from_points(points: np.ndarray) -> tuple[float, float, float, float]:
    """Compute (lat_min, lat_max, lon_min, lon_max) ignoring NaN padding."""
    lats = points[:, 0]
    lons = points[:, 1]
    valid_lats = lats[~np.isnan(lats)]
    valid_lons = lons[~np.isnan(lons)]
    if len(valid_lats) == 0:
        return (0.0, 0.0, 0.0, 0.0)
    return (
        float(valid_lats.min()),
        float(valid_lats.max()),
        float(valid_lons.min()),
        float(valid_lons.max()),
    )


def _make_trajectory(points: np.ndarray, forces: np.ndarray | None = None) -> Trajectory:
    lat_min, lat_max, lon_min, lon_max = _bbox_from_points(points)
    return Trajectory(
        points=points.astype(np.float32),
        lat_min=lat_min,
        lat_max=lat_max,
        lon_min=lon_min,
        lon_max=lon_max,
        forces=forces.astype(np.float32) if forces is not None else None,
    )


# ---------------------------------------------------------------------------
# Predictions  (N, seq_len, 3)  with NaN padding
# ---------------------------------------------------------------------------

def load_all_predictions(directory: str = "Predictions") -> dict[str, TrajectoryStore]:
    stores: dict[str, TrajectoryStore] = {}

    if not os.path.exists(directory):
        print(f"Predictions directory '{directory}' not found, skipping.")
        return stores

    for filename in os.listdir(directory):
        if not filename.endswith(".npz"):
            continue

        path = os.path.join(directory, filename)
        model_name = os.path.splitext(filename)[0]

        file_size = os.path.getsize(path)
        if file_size > MAX_FILE_SIZE_BYTES:
            print(
                f"  Skipping {filename}: {file_size / 1024**3:.2f} GB exceeds limit of {MAX_FILE_SIZE_GB} GB")
            continue

        try:
            with np.load(path, allow_pickle=True) as data:
                lats = data.get("lats")
                lons = data.get("lons")
                timestamps = data.get("timestamps")

                if "num_historic_tokens" in data:
                    raw = data["num_historic_tokens"]
                    try:
                        num_historic_tokens = float(raw)
                    except (ValueError, TypeError):
                        num_historic_tokens = float(pickle.loads(raw.item()))
                else:
                    num_historic_tokens = None

                # Forces: (N, T, F, 2) or missing/empty
                forces_raw = data.get("forces")
                has_forces = (
                    forces_raw is not None
                    and forces_raw.ndim == 4
                    and forces_raw.size > 0
                )
                num_forces = int(forces_raw.shape[2]) if has_forces else 0

                if lats is None or lons is None or timestamps is None:
                    print(
                        f"  Skipping {filename}: missing lats/lons/timestamps")
                    continue

                stacked = np.stack((lats, lons, timestamps), axis=2)
                n_traj = stacked.shape[0]

                store = TrajectoryStore(
                    name=model_name,
                    num_historic_tokens=num_historic_tokens,
                    num_forces=num_forces,
                )

                for i in range(n_traj):
                    # (T, F, 2)
                    traj_forces = forces_raw[i] if has_forces else None
                    store.trajectories.append(
                        _make_trajectory(stacked[i], traj_forces))

                stores[model_name] = store
                print(
                    f"  Loaded predictions '{model_name}': {n_traj} trajectories, {num_forces} force components")

        except Exception as e:
            print(f"  Error loading {filename}: {e}")

    return stores


# ---------------------------------------------------------------------------
# Labels  (flat array + index offsets)
# ---------------------------------------------------------------------------

def load_all_labels(data_dir: str = "Data/DatasetTraj") -> dict[str, TrajectoryStore]:
    stores: dict[str, TrajectoryStore] = {}

    if not os.path.exists(data_dir):
        print(f"Labels directory '{data_dir}' not found, skipping.")
        return stores

    for filename in os.listdir(data_dir):
        if not (filename.startswith("combined") and filename.endswith(".npz")):
            continue

        path = os.path.join(data_dir, filename)
        dataset_name = os.path.splitext(filename)[0]

        file_size = os.path.getsize(path)
        if file_size > MAX_FILE_SIZE_BYTES:
            print(
                f"  Skipping {filename}: {file_size / 1024**3:.2f} GB exceeds limit of {MAX_FILE_SIZE_GB} GB")
            continue

        try:
            with np.load(path, allow_pickle=True) as data:
                flat = data["trajectories"]
                trajectory_idxes: list[int] = pickle.loads(
                    data["trajectory_idxes"].item())

            store = TrajectoryStore(name=dataset_name)
            split_indices = trajectory_idxes[1:]
            segments = np.split(flat, split_indices)

            for seg in segments:
                if len(seg) == 0:
                    continue
                points = seg[:, [1, 2, 0]].astype(np.float32)
                store.trajectories.append(_make_trajectory(points))

            stores[dataset_name] = store
            print(
                f"  Loaded labels '{dataset_name}': {len(store.trajectories)} trajectories")

        except Exception as e:
            print(f"  Error loading {filename}: {e}")

    return stores
