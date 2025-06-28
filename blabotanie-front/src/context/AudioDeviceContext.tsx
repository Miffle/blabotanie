// context/AudioDeviceContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AudioDeviceContextType {
    inputDevices: MediaDeviceInfo[];
    outputDevices: MediaDeviceInfo[];
    selectedInputId: string | null;
    selectedOutputId: string | null;
    setInputId: (deviceId: string) => void;
    setOutputId: (deviceId: string) => void;
}

const AudioDeviceContext = createContext<AudioDeviceContextType | null>(null);

export const useAudioDevices = () => {
    const ctx = useContext(AudioDeviceContext);
    if (!ctx) throw new Error("useAudioDevices must be used inside AudioDeviceProvider");
    return ctx;
};

export const AudioDeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
    const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedInputId, setSelectedInputId] = useState<string | null>(null);
    const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);
    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            const inputs = devices.filter(d => d.kind === 'audioinput');
            const outputs = devices.filter(d => d.kind === 'audiooutput');

            setInputDevices(inputs);
            setOutputDevices(outputs);

            // Пробуем восстановить сохранённый выбор
            const savedInput = localStorage.getItem('selectedInputId');
            const savedOutput = localStorage.getItem('selectedOutputId');

            if (savedInput && inputs.find(d => d.deviceId === savedInput)) {
                setSelectedInputId(savedInput);
            }

            if (savedOutput && outputs.find(d => d.deviceId === savedOutput)) {
                setSelectedOutputId(savedOutput);
            }
        });
    }, []);
    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            setInputDevices(devices.filter(d => d.kind === 'audioinput'));
            setOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
        });
    }, []);

    const setInputId = (id: string) => {
        localStorage.setItem('selectedInputId', id);
        setSelectedInputId(id);
    };

    const setOutputId = (id: string) => {
        localStorage.setItem('selectedOutputId', id);
        setSelectedOutputId(id);
    };

    return (
        <AudioDeviceContext.Provider value={{
            inputDevices,
            outputDevices,
            selectedInputId,
            selectedOutputId,
            setInputId,
            setOutputId,
        }}>
            {children}
        </AudioDeviceContext.Provider>
    );
};
