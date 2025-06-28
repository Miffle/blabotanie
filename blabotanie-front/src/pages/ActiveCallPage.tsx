// @ts-ignore
import React from 'react';
import {useCall} from '../context/CallContext';
import {useNavigate} from 'react-router-dom';
import {useWebSocket} from '../context/WebSocketContext';
import {EndCall} from "../dto/CallDTO";
import {useTranslation} from "react-i18next";

export default function ActiveCallPage() {
    const {
        activeCall, setActiveCall, setMinimized, setMicEnabled, micEnabled,
        setAudioEnabled,
        audioEnabled
    } = useCall();
    const navigate = useNavigate();
    const {send} = useWebSocket();
    const {t} = useTranslation();

    if (!activeCall) {
        return <div>Нет активного звонка</div>;
    }

    const handleEndCall = () => {
        if (!activeCall) return;
        let recipientUuid: string;
        let recipientUsername: string;
        if (activeCall.calledUsername === localStorage.getItem("username")) {
            recipientUuid = activeCall.initiatorUuid;
            recipientUsername = activeCall.initiatorUsername;
        } else {
            recipientUuid = activeCall.calledUuid;
            recipientUsername = activeCall.calledUsername;
        }
        const payload: EndCall = {
            recipientUuid,
            recipientUsername
        };
        send('/app/call/end', payload);
        setActiveCall(null);
        navigate('/');
    };

    const handleMinimize = () => {
        setMinimized(true);
        navigate('/');
    };

    return (
        <div className="active-call-page">
            <h2>Звонок с {activeCall.calledUsername || activeCall.initiatorUsername}</h2>
            <div className="avatar-circle">
                {(activeCall.calledUsername || activeCall.initiatorUsername)[0]?.toUpperCase()}
            </div>

            <div className="call-status">{t("call.callContinues")}</div>
            <div className="call-buttons">
                <button onClick={() => setMicEnabled(prev => !prev)}>
                    {micEnabled ? t("call.micOn") : t("call.micOff")}
                </button>
                <button onClick={() => setAudioEnabled(prev => !prev)}>
                    {audioEnabled ? t("call.audioOn") : t("call.audioOff")}
                </button>
                <button onClick={handleMinimize}>{t("call.minimize")}</button>
                <button onClick={handleEndCall}>{t("call.HangUp")}</button>
            </div>
        </div>

    );
}
