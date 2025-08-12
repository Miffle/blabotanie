// @ts-ignore
import React, {useEffect, useRef} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import ChatPanel, {ChatPanelHandles} from '../components/ChatPanel';
import {WebSocketEventsRouter} from "../services/WebSocketEventsRouter";
import "../styles/chat-page.css"
import {useTranslation} from "react-i18next";

export default function ChatPage() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {id} = useParams();
    const chatRef = useRef<ChatPanelHandles>(null);
    const currentUser = localStorage.getItem('uuid') || 'anon';

    useEffect(() => {
        WebSocketEventsRouter.setChatHandler((msg) => {
            chatRef.current?.addMessage(msg);
        });
        WebSocketEventsRouter.setChatHistoryHandler((response) => {
            if (response.withUserUuid === id) {
                chatRef.current?.setHistory(response.messages);
            }
        });
    }, [id]);

    return (
        <div style={{padding: '16px'}}>
            <button className={"back-button"} onClick={() => navigate(-1)} style={{marginBottom: '12px'}}>
                {t("chat.back")}
            </button>
            <ChatPanel ref={chatRef} chatId={id!} currentUser={currentUser}/>
        </div>
    );
}
