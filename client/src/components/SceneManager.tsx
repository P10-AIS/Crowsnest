import { useState } from "react";
import { IoIosBookmark, IoMdClose, IoIosSave, IoIosTrash, IoIosRefresh, IoIosWarning } from "react-icons/io";
import { useSnapshotManager } from "../hooks/SceneHook";
import { useAppContext } from "../contexts/AppContext";

export default function SceneManager() {
    const [hidden, setHidden] = useState(true);
    const [snapshotName, setSnapshotName] = useState("");
    const { snapshots, takeSnapshot, restoreSnapshot, deleteSnapshot, missingApplicableKeys } = useSnapshotManager();
    const curCtx = useAppContext();

    const handleSave = () => {
        if (!snapshotName.trim()) return;
        takeSnapshot(snapshotName);
        setSnapshotName(""); 
    };

    return (
        <div className="bg-white rounded p-4 shadow-lg overflow-auto text-slate-600 text-sm max-w-sm">
            {hidden && (
                <div className="flex">
                    <button onClick={() => setHidden(false)} title="Open Scene Manager">
                        <IoIosBookmark size={24} className="text-blue-600 hover:scale-110 transition-transform" />
                    </button>
                </div>
            )}

            {!hidden && (
                <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex flex-row items-center justify-between border-b pb-2">
                        <div className="font-bold flex items-center gap-2">
                            <IoIosBookmark /> Scene Manager
                        </div>
                        <button
                            className="hover:rotate-90 hover:scale-110 transition-transform hover:cursor-pointer hover:text-red-600"
                            onClick={() => setHidden(true)}
                        >
                            <IoMdClose size={24} />
                        </button>
                    </div>

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
                            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
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
                            const missing = missingApplicableKeys(curCtx, snapshot.appData);
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
                                            onClick={() => restoreSnapshot(snapshot)}
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