// useUserActivity.ts
import {useEffect, useRef} from 'react';

export function useUserActivity(onAway: () => void, onBack: () => void, timeoutMs = 10000) {
    const lastStatus = useRef<'ONLINE' | 'AWAY'>('ONLINE');

    useEffect(() => {
        if (!window.electron?.ipcRenderer) return;

        window.electron.ipcRenderer.on('user-idle-time', (seconds: number) => {
            if (seconds >= timeoutMs / 1000 && lastStatus.current !== 'AWAY') {
                onAway();
                lastStatus.current = 'AWAY';
            } else if (seconds < timeoutMs / 1000 && lastStatus.current !== 'ONLINE') {
                onBack();
                lastStatus.current = 'ONLINE';
            }
        });
    }, []);
}
