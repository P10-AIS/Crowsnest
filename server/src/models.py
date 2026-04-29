from dataclasses import dataclass, field
import numpy as np


@dataclass
class Trajectory:
    """A single trajectory with its spatial bounding box for fast filtering."""
    points: np.ndarray      # shape (seq_len, 3): [lat, lon, timestamp], may contain NaN padding
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float


@dataclass
class TrajectoryStore:
    """All trajectories for one model or label dataset."""
    name: str
    trajectories: list[Trajectory] = field(default_factory=list)
