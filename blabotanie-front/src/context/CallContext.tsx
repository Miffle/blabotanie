// @ts-ignore
import React, {createContext, useContext, useRef, useState} from 'react';
import {Answer, Offer} from '../dto/CallDTO';
import {incomingCallSound, outgoingCallSound} from '../callAudio';

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

    isPlayingOutgoingCall: boolean;
    isPlayingIncomingCall: boolean;
    playIncomingCallSound: () => void;
    stopIncomingCallSound: () => void;
    playOutgoingCallSound: () => void;
    stopOutgoingCallSound: () => void;
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
    const [isPlayingOutgoingCall, setIsPlayingOutgoingCall] = useState(false);
    const [isPlayingIncomingCall, setIsPlayingIncomingCall] = useState(false);

    const playOutgoingCallSound = () => {
        const sound = outgoingCallSound;
        if (!isPlayingOutgoingCall) {
            sound.loop = true;
            sound.play();
            setIsPlayingOutgoingCall(true);
        }
    };

    const stopOutgoingCallSound = () => {
        const sound = outgoingCallSound;
        sound.pause();
        sound.currentTime = 0;
        setIsPlayingOutgoingCall(false);
    };

    const playIncomingCallSound = () => {
        const sound = incomingCallSound;
        if (!isPlayingIncomingCall) {
            sound.loop = true;
            sound.play();
            setIsPlayingIncomingCall(true);
        }
    };

    const stopIncomingCallSound = () => {
        const sound = incomingCallSound;
        sound.pause();
        sound.currentTime = 0;
        setIsPlayingIncomingCall(false);
    };

    // Пока простая реализация
    const startCall = (offer: Offer) => {
        playOutgoingCallSound()
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
        stopIncomingCallSound(); // 🔒 Гарантия
        stopOutgoingCallSound(); // 🔒 Гарантия
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
            setAudioEnabled,
            isPlayingOutgoingCall,
            isPlayingIncomingCall,
            playIncomingCallSound,
            stopIncomingCallSound,
            playOutgoingCallSound,
            stopOutgoingCallSound,
        }}>
            {children}
        </CallContext.Provider>
    );
};
