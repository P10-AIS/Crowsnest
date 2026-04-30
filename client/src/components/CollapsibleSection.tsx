import { useState, Children } from "react";

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
}

function CollapsibleSection({ title, children }: CollapsibleSectionProps) {
    const [collapsed, setCollapsed] = useState(true);
    const isEmpty = Children.count(children) === 0;

    return (
        <div className="bg-gray-100 rounded overflow-hidden">
            <button
                onClick={() => !isEmpty && setCollapsed(!collapsed)}
                className={`w-full flex items-center justify-between p-2 transition-colors focus:outline-none ${isEmpty ? 'cursor-default opacity-50' : 'hover:bg-gray-200'}`}
            >
                <span className="text-sm font-semibold text-gray-700">{title}</span>
                {isEmpty
                    ? <span className="text-xs text-gray-400 italic">unavailable</span>
                    : <svg
                        className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                }
            </button>
            {!collapsed && !isEmpty && (
                <div className="p-2 pt-0 space-y-2">
                    {children}
                </div>
            )}
        </div>
    );
}

export default CollapsibleSection;