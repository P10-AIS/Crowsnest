import { useState } from "react";
import { useAppContext } from "../contexts/AppContext";
import { IoMdCog, IoMdClose } from "react-icons/io";
import { Projection } from "../types/projection";
import CollapsibleSection from "./CollapsibleSection";

function SettingsPanel() {
    const ctx = useAppContext();
    const [hidden, setHidden] = useState(true);
    const [refreshingBackend, setRefreshingBackend] = useState(false);

    function handleTogglePrediction(checked: boolean, modelName: string) {
        ctx.setShowModelPredictions({
            ...ctx.showModelPredictions,
            [modelName]: checked
        })
        ctx.setModelPredictionsInView(prev => {
            if (!checked) {
                const newPrev = { ...prev };
                delete newPrev[modelName];
                return newPrev;
            }
            return prev;
        });
    }
    function handleToggleLabel(checked: boolean, labelName: string) {
        ctx.setShowLabels({
            ...ctx.showLabels,
            [labelName]: checked
        })
        ctx.setLabelsInView(prev => {
            if (!checked) {
                const newPrev = { ...prev };
                delete newPrev[labelName];
                return newPrev;
            }
            return prev;
        });
    }

    async function handleRefreshBackend() {
        setRefreshingBackend(true);
        try {
            const res = await fetch("/api/refresh");
            if (!res.ok) {
                throw new Error("Failed to refresh backend");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setRefreshingBackend(false);
            window.location.reload();
        }
    }

    return (
        <div className="absolute top-5 left-5 bg-white rounded p-4 shadow-lg z-2000 overflow-auto text-slate-600 text-sm max-h-[95vh]">
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
                        {Object.keys(Projection).map((projKey) => {
                            const projValue = Projection[projKey as keyof typeof Projection];
                            return (
                                <div className="flex flex-row items-center justify-between" key={projValue}>
                                    <div>{projValue}</div>
                                    <input
                                        type="radio"
                                        name="projection"
                                        checked={ctx.projection === projValue}
                                        onChange={() => ctx.setProjection(projValue)}
                                    />
                                </div>
                            );
                        })}
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

                        {/* Density slider*/}
                        <div className="flex flex-col">
                            <div className="flex flex-row justify-between">
                                <div>Trajcetory Density </div>
                                <div>{ctx.trajectoryDensity}</div>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={ctx.trajectoryDensity}
                                onChange={(e) => ctx.setTrajectoryDensity(parseFloat(e.target.value))}
                            />
                        </div>

                        {/* full trajectory fidelity toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Full Fidelity</div>
                            <input
                                type="checkbox"
                                checked={ctx.fullFidelity}
                                onChange={(e) => ctx.setFullFidelity(e.target.checked)}
                            />
                        </div>

                        {/* Toggle Trajectory dots */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show Trajectory Dots</div>
                            <input
                                type="checkbox"
                                checked={ctx.showTrajectoryDots}
                                onChange={(e) => ctx.setShowTrajectoryDots(e.target.checked)}
                            />
                        </div>

                        <hr className="border-slate-300"></hr>

                        <CollapsibleSection title="EEZ Outlines">
                            <div className="flex flex-row items-center justify-between">
                                <div>DK</div>
                                <input
                                    type="checkbox"
                                    checked={ctx.eezDKOutlineVisible}
                                    onChange={(e) => ctx.setEezDKOutlineVisible(e.target.checked)}
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between">
                                <div>US</div>
                                <input
                                    type="checkbox"
                                    checked={ctx.eezUSOutlineVisible}
                                    onChange={(e) => ctx.setEezUSOutlineVisible(e.target.checked)}
                                />
                            </div>
                        </CollapsibleSection>


                        <hr className="border-slate-300"></hr>

                        <CollapsibleSection title="Labels">
                            {Object.keys(ctx.showLabels).map(labelName => (
                                <div key={labelName} className="flex flex-row items-center space-x-3">
                                    <div className="truncate">{labelName}</div>
                                    <input type="checkbox" className="ml-auto"
                                        checked={ctx.showLabels[labelName] || false}
                                        onChange={(e) => handleToggleLabel(e.target.checked, labelName)}
                                    />
                                </div>
                            ))}
                        </CollapsibleSection>

                        <hr className="border-slate-300"></hr>

                        <CollapsibleSection title="Model Predictions">
                            {Object.keys(ctx.showModelPredictions).map(modelName => (
                                <div key={modelName} className="flex flex-row items-center space-x-3">
                                    <div className="truncate">{modelName}</div>
                                    <input type="checkbox" className="ml-auto"
                                        checked={ctx.showModelPredictions[modelName] || false}
                                        onChange={(e) => handleTogglePrediction(e.target.checked, modelName)}
                                    />
                                </div>
                            ))}
                        </CollapsibleSection>


                        <hr className="border-slate-300"></hr>


                        <CollapsibleSection title="Image Overlays">
                            {Object.keys(ctx.imageOverlays).map((name) => {
                                const formattedName = name.replace(/^(.*)\{.*PROJ_(.*?)\}/, (_, base, proj) => {
                                    return `${base}_${proj.replace('.', ':')}`;
                                });

                                if (!name.includes(`PROJ_${ctx.projection.replace(':', '.')}`)) {
                                    return null;
                                }

                                return (
                                    <div key={name} className="flex flex-col p-2 bg-white rounded border border-gray-200 shadow-sm transition-all hover:border-blue-400">
                                        <div className="flex items-center justify-between mb-2">
                                            <span
                                                className="text-sm font-medium text-gray-700 truncate cursor-help"
                                                title={name}
                                            >
                                                {formattedName}
                                            </span>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                checked={ctx.showImageOverlay[name] || false}
                                                onChange={(e) => ctx.setShowImageOverlay({
                                                    ...ctx.showImageOverlay,
                                                    [name]: e.target.checked
                                                })}
                                            />
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-400">Opacity</span>
                                            <input
                                                type="range"
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                value={ctx.imageOpacities[name] ?? 1}
                                                onChange={(e) =>
                                                    ctx.setImageOpacities((prev) => ({
                                                        ...prev,
                                                        [name]: parseFloat(e.target.value),
                                                    }))
                                                }
                                            />
                                            <span className="text-xs font-mono text-gray-500 w-8">
                                                {Math.round((ctx.imageOpacities[name] || 1) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </CollapsibleSection>

                        <hr className="border-slate-300"></hr>
                        <button onClick={handleRefreshBackend} className="rounded bg-blue-600 text-white py-2 px-4 hover:bg-blue-700 transition-colors" disabled={refreshingBackend}>
                            {refreshingBackend ? "Refreshing..." : "Refresh backend"}
                        </button>
                        <button
                            onClick={() => { localStorage.clear(); window.location.reload(); }}
                            className="rounded bg-red-600 text-white py-2 px-4 hover:bg-red-700 transition-colors"
                        >
                            Clear Local Storage
                        </button>
                    </div>
                )
            }
        </div >
    )
}

export default SettingsPanel;