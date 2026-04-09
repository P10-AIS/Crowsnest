import { useEffect, useState } from "react";
import { useAppContext } from "../contexts/AppContext";
import { IoMdCog, IoMdClose } from "react-icons/io";
import { useInViewContext } from "../contexts/InViewContext";
import { Projection } from "../types/projection";

function SettingsPanel() {
    const ctx = useAppContext();
    const inViewCtx = useInViewContext();
    const [hidden, setHidden] = useState(true);
    const [updatingPredictions, setUpdatingPredictions] = useState(false);
    const [updatingLabels, setUpdatingLabels] = useState(false);
    const [imageOverlayCollapsed, setImageOverlayCollapsed] = useState(true);

    function handleTogglePrediction(checked: boolean, modelName: string) {
        ctx.setShowModelPredictions({
            ...ctx.showModelPredictions,
            [modelName]: checked
        })
        inViewCtx.setModelPredictionsInView(prev => {
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
    }

    useEffect(() => {
        const newShowImageOverlay: Record<string, boolean> = {};
        for (const name of Object.keys(ctx.imageOverlays)) {
            if (name.includes(`PROJ_${ctx.projection.replace(':', '.')}`)) {
                newShowImageOverlay[name] = ctx.showImageOverlay[name] || false;
            }
        }
        ctx.setShowImageOverlay(newShowImageOverlay);
    }, [ctx.projection])

    async function handleUpdateBackendPredictions() {
        setUpdatingPredictions(true);
        try {
            const res = await fetch("/api/update_predictions", { method: "POST" });
            if (!res.ok) {
                throw new Error("Failed to update backend predictions");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUpdatingPredictions(false);
            window.location.reload();
        }
    }

    async function handleUpdateBackendLabels() {
        setUpdatingLabels(true);
        try {
            const res = await fetch("/api/update_labels", { method: "POST" }); 
            if (!res.ok) {
                throw new Error("Failed to update backend labels");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUpdatingLabels(false);
            window.location.reload();
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

                        <hr className="border-slate-300"></hr>

                        {/* eez toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Show EEZ DK</div>
                            <input
                                type="checkbox"
                                checked={ctx.eezDKOutlineVisible}
                                onChange={(e) => ctx.setEezDKOutlineVisible(e.target.checked)}
                            />
                        </div>
                        <div className="flex flex-row items-center justify-between">
                            <div>Show EEZ US</div>
                            <input
                                type="checkbox"
                                checked={ctx.eezUSOutlineVisible}
                                onChange={(e) => ctx.setEezUSOutlineVisible(e.target.checked)}
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

                        {/* full trajectory fidelity toggle */}
                        <div className="flex flex-row items-center justify-between">
                            <div>Full Trajectory Fidelity</div>
                            <input
                                type="checkbox"
                                checked={ctx.fullTrajectoryFidelity}
                                onChange={(e) => ctx.setFullTrajectoryFidelity(e.target.checked)}
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

                        <div>Toggle Labels:</div>
                        <div className="p-2 bg-gray-200 rounded">
                            {Object.keys(ctx.labels).map((labelName) => (
                                <div key={labelName} className="flex flex-row items-center space-x-3">
                                    <div className="truncate">{labelName}</div>
                                    <input
                                        type="checkbox"
                                        className="ml-auto"
                                        checked={ctx.showLabels[labelName] || false}
                                        onChange={(e) => handleToggleLabel(e.target.checked, labelName)}
                                    />
                                </div>
                            ))}
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
                                    <div className="truncate">{modelName}</div>
                                    <input
                                        type="checkbox"
                                        className="ml-auto"
                                        checked={ctx.showModelPredictions[modelName] || false}
                                        onChange={(e) => handleTogglePrediction(e.target.checked, modelName)}
                                    />
                                </div>
                            ))}
                        </div>

                        <hr className="border-slate-300"></hr>
                        {/* Image overlays */}
                        <div className="bg-gray-100 rounded overflow-hidden">
                            <button 
                                onClick={() => setImageOverlayCollapsed(!imageOverlayCollapsed)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-200 transition-colors focus:outline-none"
                            >
                                <span className="text-sm font-semibold text-gray-700">
                                    Image Overlays
                                </span>
                                <svg 
                                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${imageOverlayCollapsed ? '' : 'rotate-180'}`} 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Collapsible Content */}
                            {!imageOverlayCollapsed && (
                                <div className="p-4 pt-0 space-y-4">
                                    {Object.keys(ctx.imageOverlays).map((name) => {
                                        // Regex to extract the base name and the PROJ value
                                        const formattedName = name.replace(/^(.*)\{.*PROJ_(.*?)\}/, (match, base, proj) => {
                                            return `${base}_${proj.replace('.', ':')}`;
                                        });

                                        if (!name.includes(`PROJ_${ctx.projection.replace(':', '.')}`)) {
                                            return null; // Skip overlays that don't match the current projection
                                        }

                                        return (
                                            <div key={name} className="flex flex-col p-2 bg-white rounded border border-gray-200 shadow-sm transition-all hover:border-blue-400">
                                                {/* Top Row: Name and Checkbox */}
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

                                                {/* Bottom Row: Full-width Slider */}
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs text-gray-400">Opacity</span>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={1}
                                                        step={0.01}
                                                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                        value={ctx.imageOverlays[name]?.opacity || 1}
                                                        onChange={(e) => ctx.setImageOverlays({
                                                            ...ctx.imageOverlays,
                                                            [name]: {
                                                                ...ctx.imageOverlays[name],
                                                                opacity: parseFloat(e.target.value)
                                                            }
                                                        })}
                                                    />
                                                    <span className="text-xs font-mono text-gray-500 w-8">
                                                        {Math.round((ctx.imageOverlays[name]?.opacity || 1) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <hr className="border-slate-300"></hr>
                        <button onClick={handleUpdateBackendPredictions} className="rounded bg-blue-600 text-white py-2 px-4 hover:bg-blue-700 transition-colors" disabled={updatingPredictions}>
                            {updatingPredictions ? "Updating..." : "Update BE Predictions"}
                        </button>
                        <button onClick={handleUpdateBackendLabels} className="rounded bg-blue-600 text-white py-2 px-4 hover:bg-blue-700 transition-colors" disabled={updatingLabels}>
                            {updatingLabels ? "Updating..." : "Update BE Labels"}
                        </button>
                    </div>
                )
            }
        </div >
    )
}

export default SettingsPanel;