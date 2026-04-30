import { useState, useEffect } from "react";
import { IoIosBookmark, IoMdClose, IoIosSave, IoIosTrash, IoIosRefresh, IoIosWarning, IoIosCheckmarkCircle } from "react-icons/io";
import { useSnapshotManager, type Snapshot } from "../hooks/SceneHook";

interface RestoreFeedback {
    success: boolean;
    missingKeys: string[];
}

export default function SceneManager() {
    const [hidden, setHidden] = useState(true);
    const [snapshotName, setSnapshotName] = useState("");
    const [restoreStatus, setRestoreStatus] = useState<RestoreFeedback | null>(null);
    const { snapshots, takeSnapshot, restoreSnapshot, deleteSnapshot, missingApplicableKeys } = useSnapshotManager();
    useEffect(() => {
        if (restoreStatus) {
            const timer = setTimeout(() => setRestoreStatus(null), 10000);
            return () => clearTimeout(timer);
        }
    }, [restoreStatus]);

    const handleSave = () => {
        if (!snapshotName.trim()) return;
        takeSnapshot(snapshotName);
        setSnapshotName("");
    };

    const handleRestore = (snapshot: Snapshot) => {
        const result = restoreSnapshot(snapshot);
        setRestoreStatus(result);
    };

    return (
        <div className="bg-white rounded p-4 shadow-lg overflow-auto text-slate-600 text-sm max-w-sm relative">
            {hidden && (
                <div className="flex">
                    <button onClick={() => setHidden(false)} title="Open Scene Manager">
                        <IoIosBookmark size={24} className="hover:scale-110 transition-transform" />
                    </button>
                </div>
            )}

            {!hidden && (
                <div className="flex flex-col space-y-2">
                    {/* Header */}
                    <div className="flex flex-row items-center justify-between sticky top-0 bg-white pb-1">
                        <div className="font-bold">Scene Manager</div>
                        <button
                            className="hover:rotate-90 hover:scale-110 transition-transform hover:cursor-pointer hover:text-red-600"
                            onClick={() => setHidden(true)}
                        >
                            <IoMdClose size={24} />
                        </button>
                    </div>

                    <hr className="border-slate-300" />

                    {/* Wrap the entire block in a null check */}
                    {restoreStatus && (
                        <div className={`p-3 rounded border flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${restoreStatus.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                            }`}>
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-bold">
                                    {restoreStatus.success ? <IoIosCheckmarkCircle /> : <IoIosWarning />}
                                    {restoreStatus.success ? "Scene Restored" : "Partial Restore"}
                                </div>
                                <button onClick={() => setRestoreStatus(null)} className="hover:opacity-70">
                                    <IoMdClose size={16} />
                                </button>
                            </div>

                            {/* Detailed Error List: Only render if not successful and status exists */}
                            {!restoreStatus.success && (
                                <div className="flex flex-col gap-2 border-t border-amber-200 pt-2 text-[11px] leading-tight">
                                    {restoreStatus.missingKeys.length > 0 && (
                                        <div>
                                            <span className="font-bold uppercase tracking-wider text-[9px] block mb-1 opacity-70">
                                                Missing Properties:
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                                {restoreStatus.missingKeys.map((key) => (
                                                    <span key={key} className="bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 font-mono">
                                                        {key}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Snapshot Creation */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Scene name..."
                            className="border rounded px-2 py-1 grow outline-none focus:ring-1 focus:ring-blue-400"
                            value={snapshotName}
                            onChange={(e) => setSnapshotName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                            disabled={!snapshotName.trim()}
                        >
                            <IoIosSave size={18} />
                        </button>
                    </div>

                    {/* Snapshot List */}
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                        {snapshots.length === 0 && (
                            <div className="text-slate-400 italic text-center py-2">No saved scenes.</div>
                        )}
                        {snapshots.map((snapshot) => {
                            const missing = missingApplicableKeys(snapshot.appData);
                            const isIncomplete = missing.length > 0;

                            return (
                                <div
                                    key={snapshot.id}
                                    className="flex items-center justify-between p-2 bg-slate-50 rounded hover:bg-slate-100 group"
                                >
                                    <div className="flex flex-col overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-medium truncate ${isIncomplete ? 'text-slate-400' : ''}`}>
                                                {snapshot.name}
                                            </span>
                                            {isIncomplete && (
                                                <IoIosWarning
                                                    className="text-amber-500 flex-shrink-0"
                                                    title={`Data mismatch: missing ${missing.join(", ")}`}
                                                />
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(snapshot.timestamp).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleRestore(snapshot)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-200 rounded"
                                            title={isIncomplete ? "Restore (Partial data only)" : "Restore Scene"}
                                        >
                                            <IoIosRefresh size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteSnapshot(snapshot.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-200 rounded"
                                            title="Delete"
                                        >
                                            <IoIosTrash size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}