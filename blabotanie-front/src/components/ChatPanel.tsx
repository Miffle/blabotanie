// @ts-ignore
import React, {
    useEffect,
    useRef,
    useState,
    useImperativeHandle,
    forwardRef,
    ForwardedRef
} from 'react';
import '../styles/chat-panel.css';
import { useWebSocket } from '../context/WebSocketContext';
import {useTranslation} from "react-i18next";

export interface ChatPanelHandles {
    addMessage: (msg: any) => void;
    setHistory: (msgs: any[]) => void;
}

interface ChatPanelProps {
    chatId: string;
    currentUser: string;
    type?: string;
}

const ChatPanel = forwardRef<ChatPanelHandles, ChatPanelProps>(
    ({ chatId, type = 'private', currentUser }, ref: ForwardedRef<ChatPanelHandles>) => {
        const {t} = useTranslation();
        const [messages, setMessages] = useState<any[]>([]);
        const [input, setInput] = useState('');
        const messagesEndRef = useRef<HTMLDivElement | null>(null);
        const { send, subscribe, connected } = useWebSocket();

        useImperativeHandle(ref, () => ({
            addMessage: (msg) => {
                if (msg.fromUserUuid === chatId || msg.toUserUuid === chatId) {
                    setMessages((prev) => [...prev, msg]);
                }
            },
            setHistory: (msgs) => {
                setMessages(msgs.reverse());
            }
        }));

        useEffect(() => {
            if (!connected) return;
            send('/app/chat/history', {
                withUserUuid: chatId,
                withUserUsername: '',
                page: 0,
                pageSize: 50,
            });
        }, [chatId, connected]);

        useEffect(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, [messages]);

        const handleSend = () => {
            if (!input.trim()) return;
            const newMsg = {
                fromUserUuid: currentUser,
                toUserUuid: chatId,
                message: input.trim(),
            };
            send('/app/chat/message', newMsg);
            setInput('');
        };

        return (
            <div className="chat-panel">
                <div className="chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.fromUserUuid === currentUser ? 'own' : ''}`}>
                            <div className="chat-author">{msg.fromUserUsername}</div>
                            <div className="chat-content">{msg.message}</div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="chat-input">
                    <input
                        type="text"
                        value={input}
                        placeholder={t("chat.placeholder")}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    {/*<button onClick={handleSend}>Отправить</button>*/}
                </div>
            </div>
        );
    }
);

export default ChatPanel;
