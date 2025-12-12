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

                        {/* espg3034 toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Use EPSG:3034</div>
                            <input
                                type="checkbox"
                                checked={ctx.showESPG3034}
                                onChange={(e) => ctx.setShowESPG3034(e.target.checked)}
                            />
                        </div>

                        {/* show map tiles toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show Map Tiles</div>
                            <input
                                type="checkbox"
                                checked={ctx.showMapTiles}
                                onChange={(e) => ctx.setShowMapTiles(e.target.checked)}
                            />
                        </div>

                        {/* eez toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show EEZ</div>
                            <input
                                type="checkbox"
                                checked={ctx.eezOutlineVisible}
                                onChange={(e) => ctx.setEezOutlineVisible(e.target.checked)}
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

                        {/* full eez fidelity toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Full EEZ Fidelity</div>
                            <input
                                type="checkbox"
                                checked={ctx.fullEezFidelity}
                                onChange={(e) => ctx.setFullEezFidelity(e.target.checked)}
                            />
                        </div>

                        {/* Enable Cursor Ship toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Enable ship size guide</div>
                            <input
                                type="checkbox"
                                checked={ctx.enableShipSizeGuide}
                                onChange={(e) => ctx.setEnableShipSizeGuide(e.target.checked)}
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

                        {/* show prediction toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show Predictions</div>
                            <input
                                type="checkbox"
                                checked={ctx.showPredictionSteps}
                                onChange={(e) => ctx.setShowPredictionSteps(e.target.checked)}
                            />
                        </div>

                        {/* full prediction fidelity toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Full Prediction Fidelity</div>
                            <input
                                type="checkbox"
                                checked={ctx.fullPredictionFidelity}
                                onChange={(e) => ctx.setFullPredictionFidelity(e.target.checked)}
                            />
                        </div>

                        {/* current prediction step slider */}
                        <div className="flex flex-col">
                            <div className="flex flex-row justify-between">
                                <div>Current Prediction Step: </div>
                                <div>{ctx.currentPredictionStep + 1} / {ctx.predictionSteps.length}</div>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={ctx.predictionSteps.length - 1}
                                value={ctx.currentPredictionStep}
                                onChange={(e) => ctx.setCurrentPredictionStep(parseInt(e.target.value))}
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

                        {/* show traffic image toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show Traffic Image</div>
                            <input
                                type="checkbox"
                                checked={ctx.showTrafficImage}
                                onChange={(e) => ctx.setShowTrafficImage(e.target.checked)}
                            />
                        </div>

                        {/* traffic image opacity slider */}
                        <div className="flex flex-col">
                            <div className="flex flex-row justify-between">
                                <div>Traffic Image Opacity: </div>
                                <div>{ctx.trafficImageOpacity}</div>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={ctx.trafficImageOpacity}
                                onChange={(e) => ctx.setTrafficImageOpacity(parseFloat(e.target.value))}
                            />
                        </div>

                    </div>
                )
            }
        </div >
    )
}

export default SettingsPanel;