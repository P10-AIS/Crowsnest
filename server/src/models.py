from dataclasses import dataclass, field
import numpy as np


@dataclass
class Trajectory:
    """A single trajectory with its spatial bounding box for fast filtering."""
    points: np.ndarray          # shape (seq_len, 3): [lat, lon, timestamp], may contain NaN padding
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float
    # shape (seq_len, F, 2): per-point force vectors, or None
    forces: np.ndarray | None = None


@dataclass
class TrajectoryStore:
    """All trajectories for one model or label dataset."""
    name: str
    trajectories: list[Trajectory] = field(default_factory=list)
    num_historic_tokens: int | None = None
    num_forces: int = 0  # 0 means no forces available
