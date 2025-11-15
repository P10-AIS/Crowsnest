import { useState } from "react";
import { useAppContext } from "../contexts/AppContext";
import { IoMdCog, IoMdClose } from "react-icons/io";

function SettingsPanel() {
    const ctx = useAppContext();
    const [hidden, setHidden] = useState(true);

    return (
        <div className="absolute m-5 bg-white rounded p-4 shadow-lg z-2000 overflow-auto text-slate-600 text-sm">
            {hidden && (
                <div className="flex ">
                    <button className="hover:rotate-90 hover:scale-110 transition-transform hover:cursor-pointer" onClick={() => setHidden(false)}>
                        <IoMdCog size={24} />
                    </button>
                </div>
            )
            }
            {
                !hidden && (
                    <div className="w-64 flex flex-col space-y-2" >
                        <div className="flex flex-row items-center justify-between">
                            <div className="font-bold"> Settings Panel</div>

                            <button
                                className="hover:rotate-90 hover:scale-110 transition-transform hover:cursor-pointer hover:text-red-600"
                                onClick={() => setHidden(true)}>
                                <IoMdClose size={24} />
                            </button>

                        </div>
                        <hr className="border-slate-300"></hr>

                        {/* show map tiles toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show Map Tiles</div>
                            <input
                                type="checkbox"
                                checked={ctx.showMapTiles}
                                onChange={(e) => ctx.setShowMapTiles(e.target.checked)}
                            />
                        </div>

                        {/* eec toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show EEC</div>
                            <input
                                type="checkbox"
                                checked={ctx.eecOutlineVisible}
                                onChange={(e) => ctx.setEecOutlineVisible(e.target.checked)}
                            />
                        </div>

                        {/* trajectory toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show Trajectories</div>
                            <input
                                type="checkbox"
                                checked={ctx.trajectoriesVisible}
                                onChange={(e) => ctx.setTrajectoriesVisible(e.target.checked)}
                            />
                        </div>

                        {/* full trajectory fidelity toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Full Trajectory Fidelity</div>
                            <input
                                type="checkbox"
                                checked={ctx.fullTrajectoryFidelity}
                                onChange={(e) => ctx.setFullTrajectoryFidelity(e.target.checked)}
                            />
                        </div>

                        {/* num trajectories slider */}
                        <div className="flex flex-col">
                            <div className="flex flex-row justify-between">
                                <div>Number of Trajectories: </div>
                                <div>{ctx.numTrajectoriesVisible}</div>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={ctx.trajectories[1] ? ctx.trajectories[1].length : 0}
                                value={ctx.numTrajectoriesVisible}
                                onChange={(e) => ctx.setNumTrajectoriesVisible(parseInt(e.target.value))}
                            />
                        </div>

                        {/* show depth image toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show Depth Image</div>
                            <input
                                type="checkbox"
                                checked={ctx.showDepthImage}
                                onChange={(e) => ctx.setShowDepthImage(e.target.checked)}
                            />
                        </div>

                        {/* depth image opacity slider */}
                        <div className="flex flex-col">
                            <div className="flex flex-row justify-between">
                                <div>Depth Image Opacity: </div>
                                <div>{ctx.depthImageOpacity}</div>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={ctx.depthImageOpacity}
                                onChange={(e) => ctx.setDepthImageOpacity(parseFloat(e.target.value))}
                            />
                        </div>

                    </div>
                )
            }
        </div >
    )
}

export default SettingsPanel;