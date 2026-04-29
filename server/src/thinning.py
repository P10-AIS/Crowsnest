import numpy as np

# At zoom level MIN_ZOOM, keep every MAX_STRIDE-th point.
# At zoom level MAX_ZOOM, keep every point (stride=1).
# Stride scales linearly between these bounds.
MIN_ZOOM = 1
MAX_ZOOM = 18
MAX_STRIDE = 64  # tune this to taste


def zoom_to_stride(zoom: int) -> int:
    """
    Maps a zoom level to a point-thinning stride.
    zoom=1  -> stride=64 (very thinned)
    zoom=18 -> stride=1  (all points)
    """
    zoom = max(MIN_ZOOM, min(MAX_ZOOM, zoom))
    # Linear interpolation from MAX_STRIDE down to 1
    t = (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)
    stride = MAX_STRIDE - round(t * (MAX_STRIDE - 1))
    return max(1, int(stride))


def thin_trajectory(points: np.ndarray, zoom: int) -> list[list]:
    """
    Thins a (seq_len, 3) trajectory array by zoom-based stride,
    strips NaN-padded rows, and returns a plain list for JSON serialisation.
    """
    stride = zoom_to_stride(zoom)

    # Drop NaN-padded rows (any NaN in the row = padding)
    valid_mask = ~np.isnan(points).any(axis=1)
    valid_points = points[valid_mask]

    if len(valid_points) == 0:
        return []

    thinned = valid_points[::stride]
    return thinned.tolist()
