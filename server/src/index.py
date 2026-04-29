from src.models import Trajectory, TrajectoryStore


def trajectories_in_viewport(
    store: TrajectoryStore,
    lat_min: float,
    lat_max: float,
    lon_min: float,
    lon_max: float,
) -> list[Trajectory]:
    """
    Returns all trajectories whose bounding box overlaps the given viewport.
    Uses simple AABB intersection — O(N) but extremely fast in practice
    since it's just four float comparisons per trajectory.

    For datasets in the tens of thousands an R-tree (rtree / shapely STRtree)
    would be faster, but at 12k trajectories this is plenty fast enough.
    """
    result = []
    for traj in store.trajectories:
        # AABB overlap: NOT (traj is entirely outside viewport on any axis)
        if (
            traj.lat_max >= lat_min
            and traj.lat_min <= lat_max
            and traj.lon_max >= lon_min
            and traj.lon_min <= lon_max
        ):
            result.append(traj)
    return result
