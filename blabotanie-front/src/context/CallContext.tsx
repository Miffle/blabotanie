// @ts-ignore
import React, {createContext, useContext, useState} from 'react';
import {Answer, Offer} from '../dto/CallDTO';

interface CallContextType {

    incomingCall: Offer | null;
    setIncomingCall: (call: Offer | null) => void;

    activeCall: Offer | null;
    setActiveCall: (call: Offer | null) => void;

    minimized: boolean;
    micEnabled: boolean;
    audioEnabled: boolean;
    setMinimized: (min: boolean) => void;

    // Методы
    startCall: (offer: Offer) => void;
    acceptCall: (answer: Answer) => void;
    setMicEnabled: (enabled: any) => void;
    setAudioEnabled: (enabled: any) => void;
    endCall: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
    const ctx = useContext(CallContext);
    if (!ctx) throw new Error('useCall must be used inside CallProvider');
    return ctx;
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [incomingCall, setIncomingCall] = useState<Offer | null>(null);
    const [activeCall, setActiveCall] = useState<Offer | null>(null);
    const [minimized, setMinimized] = useState(false);
    const [micEnabled, setMicEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);

    // Пока простая реализация
    const startCall = (offer: Offer) => {
        setActiveCall(offer);
        setIncomingCall(null);
        setMinimized(false);
        // сюда позже добавим CallHandler.startCall(offer)
    };

    const acceptCall = (answer: Answer) => {
        // CallHandler.acceptCall(answer); — будет
        // Здесь ничего не делаем, т.к. activeCall уже должен быть установлен в handleAccept
    };

    const endCall = () => {
        setActiveCall(null);
        setMinimized(false);
        setIncomingCall(null)
        // CallHandler.endCall(); — будет
    };

    return (
        <CallContext.Provider value={{
            incomingCall,
            setIncomingCall,
            activeCall,
            setActiveCall,
            minimized,
            setMinimized,
            startCall,
            acceptCall,
            endCall,
            micEnabled,
            setMicEnabled,
            audioEnabled,
            setAudioEnabled
        }}>
            {children}
        </CallContext.Provider>
    );
};
