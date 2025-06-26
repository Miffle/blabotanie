// FriendContext.tsx
// @ts-ignore
import React, { createContext, useContext } from 'react';

interface FriendContextType {
    refresh: () => void;
}

export const FriendContext = createContext<FriendContextType | null>(null);

export const useFriendContext = () => {
    const ctx = useContext(FriendContext);
    if (!ctx) throw new Error("useFriendContext must be used inside FriendProvider");
    return ctx;
};