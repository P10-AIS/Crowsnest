import { createContext, useContext, useState } from "react";

type InViewContextType = {
    modelPredictionsInView: Record<string, Set<number>>;
    setModelPredictionsInView: React.Dispatch<
        React.SetStateAction<Record<string, Set<number>>>
    >;
};

const InViewContext = createContext<InViewContextType | undefined>(undefined);

export const InViewProvider = ({ children }: { children: React.ReactNode }) => {
    const [modelPredictionsInView, setModelPredictionsInView] =
        useState<Record<string, Set<number>>>({});

    return (
        <InViewContext.Provider
            value={{ modelPredictionsInView: modelPredictionsInView, setModelPredictionsInView: setModelPredictionsInView }}
        >
            {children}
        </InViewContext.Provider>
    );
};

export const useInViewContext = () => {
    const ctx = useContext(InViewContext);
    if (!ctx) {
        throw new Error("useInViewContext must be used within InViewProvider");
    }
    return ctx;
};
