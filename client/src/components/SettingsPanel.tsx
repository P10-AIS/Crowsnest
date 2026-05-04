import { useState } from "react";
import { useAppContext } from "../contexts/AppContext";
import { IoMdCog, IoMdClose } from "react-icons/io";
import { Projection } from "../types/projection";
import CollapsibleSection from "./CollapsibleSection";
import { forceColor } from "../utils/draw";

function SettingsPanel() {
    const ctx = useAppContext();
    const [hidden, setHidden] = useState(true);
    const [refreshingBackend, setRefreshingBackend] = useState(false);

    function handleTogglePrediction(checked: boolean, modelName: string) {
        ctx.setShowModelPredictions({ ...ctx.showModelPredictions, [modelName]: checked });
        ctx.setModelPredictionsInView(prev => {
            if (!checked) { const n = { ...prev }; delete n[modelName]; return n; }
            return prev;
        });
    }

    function handleToggleLabel(checked: boolean, labelName: string) {
        ctx.setShowLabels({ ...ctx.showLabels, [labelName]: checked });
        ctx.setLabelsInView(prev => {
            if (!checked) { const n = { ...prev }; delete n[labelName]; return n; }
            return prev;
        });
    }

    function handleForceToggle(modelName: string, forceIdx: number, enabled: boolean) {
        ctx.setForceConfig(prev => {
            const current = prev[modelName];
            if (!current) return prev;
            const newEnabled = [...current.enabled];
            newEnabled[forceIdx] = enabled;
            return { ...prev, [modelName]: { ...current, enabled: newEnabled } };
        });
    }

    async function handleRefreshBackend() {
        setRefreshingBackend(true);
        try {
            const res = await fetch("/api/refresh");
            if (!res.ok) throw new Error("Failed to refresh backend");
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
                <div className="flex">
                    <button className="hover:rotate-90 hover:scale-110 transition-transform hover:cursor-pointer" onClick={() => setHidden(false)}>
                        <IoMdCog size={24} />
                    </button>
                </div>
            )}
            {!hidden && (
                <div className="w-64 flex flex-col space-y-2">
                    <div className="flex flex-row items-center justify-between">
                        <div className="font-bold">Settings Panel</div>
                        <button className="hover:rotate-90 hover:scale-110 transition-transform hover:cursor-pointer hover:text-red-600" onClick={() => setHidden(true)}>
                            <IoMdClose size={24} />
                        </button>
                    </div>

                    <hr className="border-slate-300" />

                    {Object.keys(Projection).map((projKey) => {
                        const projValue = Projection[projKey as keyof typeof Projection];
                        return (
                            <div className="flex flex-row items-center justify-between" key={projValue}>
                                <div>{projValue}</div>
                                <input type="radio" name="projection" checked={ctx.projection === projValue} onChange={() => ctx.setProjection(projValue)} />
                            </div>
                        );
                    })}

                    <hr className="border-slate-300" />

                    <div className="flex flex-row items-center justify-between">
                        <div>Show Map Tiles</div>
                        <input type="checkbox" checked={ctx.showMapTiles} onChange={(e) => ctx.setShowMapTiles(e.target.checked)} />
                    </div>

                    <div className="flex flex-row items-center justify-between">
                        <div>Enable Ship Size Guide</div>
                        <input type="checkbox" checked={ctx.enableShipSizeGuide} onChange={(e) => ctx.setEnableShipSizeGuide(e.target.checked)} />
                    </div>

                    <div className="flex flex-row items-center justify-between">
                        <div>Full Fidelity</div>
                        <input type="checkbox" checked={ctx.fullFidelity} onChange={(e) => ctx.setFullFidelity(e.target.checked)} />
                    </div>

                    <div className="flex flex-row items-center justify-between">
                        <div>Show Trajectory Dots</div>
                        <input type="checkbox" checked={ctx.showTrajectoryDots} onChange={(e) => ctx.setShowTrajectoryDots(e.target.checked)} />
                    </div>

                    <hr className="border-slate-300" />

                    {/* Sliders */}
                    {(
                        [
                            { label: "Dot Radius", key: "radiusScale", min: 1, max: 10, step: 1 },
                            { label: "Line Width", key: "lineWidthScale", min: 1, max: 10, step: 1 },
                        ] as const
                    ).map(({ label, key, min, max, step }) => (
                        <div key={key} className="flex flex-col">
                            <div className="flex flex-row justify-between">
                                <div>{label}</div>
                                <div>{ctx.drawConfig[key]}</div>
                            </div>
                            <input type="range" min={min} max={max} step={step} value={ctx.drawConfig[key]}
                                onChange={(e) => ctx.setDrawConfig({ ...ctx.drawConfig, [key]: Number(e.target.value) })} />
                        </div>
                    ))}

                    {/* Global force scale */}
                    <div className="flex flex-col">
                        <div className="flex flex-row justify-between">
                            <div>Force Scale</div>
                            <div>{ctx.forceScale}</div>
                        </div>
                        <input type="range" min={0} max={100} step={1} value={ctx.forceScale}
                            onChange={(e) => ctx.setForceScale(Number(e.target.value))} />
                    </div>

                    <div className="flex flex-col">
                        <div className="flex flex-row justify-between">
                            <div>Trajectory Density</div>
                            <div>{ctx.trajectoryDensity}</div>
                        </div>
                        <input type="range" min={0} max={1} step={0.01} value={ctx.trajectoryDensity}
                            onChange={(e) => ctx.setTrajectoryDensity(parseFloat(e.target.value))} />
                    </div>

                    <hr className="border-slate-300" />

                    <CollapsibleSection title="EEZ Outlines">
                        <div className="flex flex-row items-center justify-between">
                            <div>DK</div>
                            <input type="checkbox" checked={ctx.eezDKOutlineVisible} onChange={(e) => ctx.setEezDKOutlineVisible(e.target.checked)} />
                        </div>
                        <div className="flex flex-row items-center justify-between">
                            <div>US</div>
                            <input type="checkbox" checked={ctx.eezUSOutlineVisible} onChange={(e) => ctx.setEezUSOutlineVisible(e.target.checked)} />
                        </div>
                    </CollapsibleSection>

                    <hr className="border-slate-300" />

                    <CollapsibleSection title="Labels">
                        {Object.keys(ctx.showLabels).map(labelName => (
                            <div key={labelName} className="flex flex-row items-center justify-between">
                                <div className="truncate">{labelName}</div>
                                <input type="checkbox" className="ml-2 flex-shrink-0"
                                    checked={ctx.showLabels[labelName] || false}
                                    onChange={(e) => handleToggleLabel(e.target.checked, labelName)}
                                />
                            </div>
                        ))}
                    </CollapsibleSection>

                    <hr className="border-slate-300" />

                    <CollapsibleSection title="Model Predictions">
                        {Object.keys(ctx.showModelPredictions).map(modelName => {
                            const nForces = ctx.numForces[modelName] ?? 0;
                            const cfg = ctx.forceConfig[modelName];
                            const names = ctx.forceNames[modelName] ?? [];

                            return (
                                <div key={modelName} className="flex flex-col space-y-2 pb-3 border-b border-slate-200 last:border-0 last:pb-0">
                                    {/* Model toggle */}
                                    <div className="flex flex-row items-center justify-between">
                                        <div className="truncate font-medium">{modelName}</div>
                                        <input type="checkbox" className="ml-2 flex-shrink-0"
                                            checked={ctx.showModelPredictions[modelName] || false}
                                            onChange={(e) => handleTogglePrediction(e.target.checked, modelName)}
                                        />
                                    </div>

                                    {/* Force component toggles */}
                                    {nForces > 0 && cfg && (
                                        <div className="flex flex-col space-y-1">
                                            {Array.from({ length: nForces }).map((_, fi) => (
                                                <div key={fi} className="flex flex-col p-2 bg-white rounded border border-gray-200 hover:border-blue-400 transition-all">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <div
                                                                className="w-3 h-3 rounded-sm flex-shrink-0"
                                                                style={{ backgroundColor: forceColor(fi) }}
                                                            />
                                                            <span className="text-xs font-medium text-gray-700 truncate">
                                                                {names[fi] ?? `Force ${fi}`}
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                                                            checked={cfg.enabled[fi] ?? true}
                                                            onChange={(e) => handleForceToggle(modelName, fi, e.target.checked)}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </CollapsibleSection>

                    <hr className="border-slate-300" />

                    <CollapsibleSection title="Image Overlays">
                        {Object.keys(ctx.imageOverlays).map((name) => {
                            if (ctx.imageOverlays[name]?.projection !== ctx.projection) return null;
                            return (
                                <div key={name} className="flex flex-col p-2 bg-white rounded border border-gray-200 hover:border-blue-400 transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700 truncate cursor-help" title={name}>
                                            {name}
                                        </span>
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                                            checked={ctx.showImageOverlay[name] || false}
                                            onChange={(e) => ctx.setShowImageOverlay({ ...ctx.showImageOverlay, [name]: e.target.checked })}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-400">Opacity</span>
                                        <input
                                            type="range" min={0} max={1} step={0.01}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            value={ctx.imageOpacities[name] ?? 1}
                                            onChange={(e) => ctx.setImageOpacities(prev => ({ ...prev, [name]: parseFloat(e.target.value) }))}
                                        />
                                        <span className="text-xs font-mono text-gray-500 w-8">
                                            {Math.round((ctx.imageOpacities[name] || 1) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </CollapsibleSection>

                    <hr className="border-slate-300" />

                    <button onClick={handleRefreshBackend} disabled={refreshingBackend}
                        className="rounded bg-blue-600 text-white py-2 px-4 hover:bg-blue-700 transition-colors disabled:opacity-50">
                        {refreshingBackend ? "Refreshing..." : "Refresh backend"}
                    </button>
                    <button
                        onClick={() => { localStorage.clear(); window.location.reload(); }}
                        className="rounded bg-red-600 text-white py-2 px-4 hover:bg-red-700 transition-colors">
                        Clear Local Storage
                    </button>
                </div>
            )}
        </div>
    );
}

export default SettingsPanel;