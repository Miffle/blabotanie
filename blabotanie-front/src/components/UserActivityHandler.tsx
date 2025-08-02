// components/UserActivityHandler.tsx
import {useUserActivity} from '../hooks/useUserActivity';
import {useWebSocket} from '../context/WebSocketContext';
import {UserStatus} from "../types/UserStatus";

export default function UserActivityHandler() {
    const {send} = useWebSocket();

    useUserActivity(
        () => send("/app/presence/change", {
            username: localStorage.getItem('username') || '',
            status: UserStatus.AWAY
        }),
        () => send("/app/presence/change", {
            username: localStorage.getItem('username') || '',
            status: UserStatus.ONLINE
        }),
        5 * 60 * 1000
    );

    return null; // компонент ничего не рендерит
}
