// @ts-ignore
import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {Client, IMessage} from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import {useAuth} from './AuthContext';
import {WS_URL} from '../constants/serverUrl';
import {WebSocketEventsRouter} from "../services/WebSocketEventsRouter";

interface WebSocketContextType {
    client: Client | null;
    connected: boolean;
    subscribe: (destination: string, callback: (body: any) => void) => void;
    send: (destination: string, payload: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
    const ctx = useContext(WebSocketContext);
    if (!ctx) throw new Error('useWebSocket must be used within a WebSocketProvider');
    return ctx;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {token, isAuthenticated} = useAuth();
    const clientRef = useRef<Client | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !token) return;
        const socket = new SockJS(`${WS_URL}?access_token=${encodeURIComponent(token)}`);
        socket.onopen = () => {
            console.log("[SockJS] Connection opened");
        };
        socket.onerror = async (error) => {
            console.error("[SockJS] Error:", error);
        }
        console.log("[SockJS] Connected");
        console.log(token);
        const stompClient = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            debug: (str) => console.log('[STOMP]', str),
            onConnect: () => {
                console.log('[STOMP] Connected');
                setConnected(true);
                subscribeAllTopics();
            },
            onDisconnect: () => {
                console.log('[STOMP] Disconnected');
                setConnected(false);
            },
            onStompError: (frame) => {
                console.error('[STOMP ERROR]', frame);
            },
            reconnectDelay: 5000,
        });

        stompClient.activate();
        clientRef.current = stompClient;

        return () => {
            stompClient.deactivate();
            setConnected(false);
        };
    }, [isAuthenticated, token]);
    const subscribeAllTopics = () => {
        if (!clientRef.current) return;

        const topics = [
            '/user/queue/presence',
            '/user/queue/offer',
            '/user/queue/answer',
            '/user/queue/ice-candidate',
            '/user/queue/end',
            '/user/queue/reject',
            '/user/queue/chat',
            '/user/queue/friend',
            '/user/queue/chat/history'
        ];

        topics.forEach(destination => {
            clientRef.current!.subscribe(destination, (message) => {
                const parsed = JSON.parse(message.body);
                WebSocketEventsRouter.handleMessage(destination, parsed);
            });
        });
    };

    const subscribe = (destination: string, callback: (body: any) => void) => {
        clientRef.current?.subscribe(destination, (message: IMessage) => {
            callback(JSON.parse(message.body));
        });
    };

    const send = (destination: string, payload: any) => {
        clientRef.current?.publish({
            destination,
            body: JSON.stringify(payload),
        });
    };

    return (
        <WebSocketContext.Provider value={{client: clientRef.current, connected, subscribe, send}}>
            {children}
        </WebSocketContext.Provider>
    );
};
