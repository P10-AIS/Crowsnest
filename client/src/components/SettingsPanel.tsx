import { useState } from "react";
import { useAppContext } from "../contexts/AppContext";
import { IoMdCog, IoMdClose, IoMdTrash } from "react-icons/io";

function SettingsPanel() {
    const ctx = useAppContext();
    const [hidden, setHidden] = useState(true);

    async function handleDeletePrediction(modelName: string) {
        if (!window.confirm(`Are you sure you want to delete prediction for ${modelName}?`)) {
            return;
        }

        ctx.setModelPredictions(prev => {
            const copy = { ...prev };
            delete copy[modelName];
            return copy;
        });

        ctx.setShowModelPredictions(prev => {
            const copy = { ...prev };
            delete copy[modelName];
            return copy;
        });

        try {
            const res = await fetch(
                `/api/predictions/${modelName}/reset`,
                { method: "POST" }
            );

            if (!res.ok) {
                throw new Error(`Failed to delete prediction for ${modelName}`);
            }
        } catch (err) {
            console.error(err);
        }
    }
    return (
        <div className="absolute top-5 left-5 bg-white rounded p-4 shadow-lg z-2000 overflow-auto text-slate-600 text-sm">
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

                        {/* Enable Cursor Ship toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Enable Ship Size Guide</div>
                            <input
                                type="checkbox"
                                checked={ctx.enableShipSizeGuide}
                                onChange={(e) => ctx.setEnableShipSizeGuide(e.target.checked)}
                            />
                        </div>

                        {/* draw config dot radius slider */}
                        <div className="flex flex-col">
                            <div className="flex flex-row justify-between">
                                <div>Dot Radius: </div>
                                <div>{ctx.drawConfig.radiusScale}</div>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={10}
                                step={1}
                                value={ctx.drawConfig.radiusScale}
                                onChange={(e) => ctx.setDrawConfig({ ...ctx.drawConfig, radiusScale: Number(e.target.value) })}
                            />
                        </div>

                        {/* draw config line width slider */}
                        <div className="flex flex-col">
                            <div className="flex flex-row justify-between">
                                <div>Line Width: </div>
                                <div>{ctx.drawConfig.lineWidthScale}</div>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={10}
                                step={1}
                                value={ctx.drawConfig.lineWidthScale}
                                onChange={(e) => ctx.setDrawConfig({ ...ctx.drawConfig, lineWidthScale: Number(e.target.value) })}
                            />
                        </div>

                        <hr className="border-slate-300"></hr>

                        {/* eez toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show EEZ</div>
                            <input
                                type="checkbox"
                                checked={ctx.eezOutlineVisible}
                                onChange={(e) => ctx.setEezOutlineVisible(e.target.checked)}
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

                        <hr className="border-slate-300"></hr>

                        {/* trajectory toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show Trajectories</div>
                            <input
                                type="checkbox"
                                checked={ctx.trajectoriesVisible}
                                onChange={(e) => ctx.setTrajectoriesVisible(e.target.checked)}
                            />
                        </div>

                        {/* Toggle trajectory dots */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show Trajectory Dots</div>
                            <input
                                type="checkbox"
                                checked={ctx.showTrajectoryDots}
                                onChange={(e) => ctx.setShowTrajectoryDots(e.target.checked)}
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
                                max={ctx.trajectories.length}
                                value={ctx.numTrajectoriesVisible}
                                onChange={(e) => ctx.setNumTrajectoriesVisible(parseInt(e.target.value))}
                            />
                        </div>

                        <hr className="border-slate-300"></hr>

                        {/* Toggle prediction dots */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show Prediction Dots</div>
                            <input
                                type="checkbox"
                                checked={ctx.showPredictionDots}
                                onChange={(e) => ctx.setShowPredictionDots(e.target.checked)}
                            />
                        </div>

                        {/* Toggle prediction correction lines */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show Prediction Correction Lines</div>
                            <input
                                type="checkbox"
                                checked={ctx.showPredictionCorrectionLines}
                                onChange={(e) => ctx.setShowPredictionCorrectionLines(e.target.checked)}
                            />
                        </div>

                        {/* Toggle ground truth lines */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show Ground Truth Lines</div>
                            <input
                                type="checkbox"
                                checked={ctx.showGroundTruth}
                                onChange={(e) => ctx.setShowGroundTruth(e.target.checked)}
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

                        {/* show prediction toggles */}
                        <div>Toggle Model Predictions:</div>
                        <div className="p-2 bg-gray-200 rounded">
                            {Object.keys(ctx.modelPredictions).map((modelName) => (
                                <div key={modelName} className="flex flex-row items-center space-x-3">
                                    <button onClick={() => handleDeletePrediction(modelName)} className="hover:cursor-pointer hover:text-red-600"><IoMdTrash size={16} /></button>
                                    <div className="truncate">{modelName}</div>
                                    <input
                                        type="checkbox"
                                        className="ml-auto"
                                        checked={ctx.showModelPredictions[modelName] || false}
                                        onChange={(e) => ctx.setShowModelPredictions({
                                            ...ctx.showModelPredictions,
                                            [modelName]: e.target.checked
                                        })}
                                    />
                                </div>
                            ))}
                        </div>

                        <hr className="border-slate-300"></hr>

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

                        {/* show bw depth image toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show B&W Depth Image</div>
                            <input
                                type="checkbox"
                                checked={ctx.showBWDepthImage}
                                onChange={(e) => ctx.setShowBWDepthImage(e.target.checked)}
                            />
                        </div>

                        {/* bw depth image opacity slider */}
                        <div className="flex flex-col">
                            <div className="flex flex-row justify-between">
                                <div>B&W Depth Image Opacity: </div>
                                <div>{ctx.bwDepthImageOpacity}</div>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={ctx.bwDepthImageOpacity}
                                onChange={(e) => ctx.setBWDepthImageOpacity(parseFloat(e.target.value))}
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