// @ts-ignore
import React from 'react';
import { useCall } from '../context/CallContext';
import { useWebSocket } from '../context/WebSocketContext';
import { EndCall } from '../dto/CallDTO';
import { useNavigate } from 'react-router-dom';
import {useTranslation} from "react-i18next";

export default function MinimizedCallWindow() {
    const { activeCall, setMinimized, endCall } = useCall();
    const { send } = useWebSocket();
    const navigate = useNavigate();

    const {t} = useTranslation();
    if (!activeCall || location.pathname.startsWith('/call/active')) return null;

    const handleRestore = () => {
        setMinimized(false);
        navigate(`/call/active/${activeCall.initiatorUuid}`);
    };

    const handleHangUp = () => {
        const payload: EndCall = {
            recipientUuid: activeCall.calledUuid === localStorage.getItem('uuid')
                ? activeCall.initiatorUuid
                : activeCall.calledUuid,
            recipientUsername: activeCall.calledUsername === localStorage.getItem('username')
                ? activeCall.initiatorUsername
                : activeCall.calledUsername,
        };
        send('/app/call/end', payload);
        endCall();
    };

    return (
        <div className="minimized-call-window">
            <div className="info">
                <strong>{activeCall.calledUsername || activeCall.initiatorUsername}</strong><br />
                <span>{t("call.callContinues")}</span>
            </div>
            <button className="restore" onClick={handleRestore}>{t("call.restore")}</button>
            <button className="end" onClick={handleHangUp}>{t("call.HangUp")}</button>
        </div>

    );
}
