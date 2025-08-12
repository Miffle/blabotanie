// src/context/DockSettingsContext.tsx
import React, {createContext, useContext, useEffect, useState} from 'react';

type DockSettingsContextType = {
    autoHideDock: boolean;
    toggleDockBehavior: (value: boolean) => void;
};

const DockSettingsContext = createContext<DockSettingsContextType | null>(null);

export const useDockSettings = () => {
    const ctx = useContext(DockSettingsContext);
    if (!ctx) throw new Error("useDockSettings must be used within DockSettingsProvider");
    return ctx;
};

export const DockSettingsProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [autoHideDock, setAutoHideDock] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("autoHideDock");
        setAutoHideDock(stored === "true");
    }, []);

    const toggleDockBehavior = (value: boolean) => {
        setAutoHideDock(value);
        localStorage.setItem("autoHideDock", String(value));
    };

    return (
        <DockSettingsContext.Provider value={{autoHideDock, toggleDockBehavior}}>
            {children}
        </DockSettingsContext.Provider>
    );
};
