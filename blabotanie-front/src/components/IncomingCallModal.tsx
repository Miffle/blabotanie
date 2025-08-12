// @ts-ignore
import React, {useEffect, useRef} from 'react';
import {useCall} from '../context/CallContext';
import {useNavigate} from 'react-router-dom';
import {WebSocketEventsRouter} from '../services/WebSocketEventsRouter';
import {EndCall} from "../dto/CallDTO";
import {useWebSocket} from '../context/WebSocketContext';
import {useTranslation} from "react-i18next";

export default function IncomingCallModal() {
    const {incomingCall, setIncomingCall, setActiveCall, playIncomingCallSound, stopIncomingCallSound} = useCall();
    const navigate = useNavigate();
    const {send} = useWebSocket();
    const {t} = useTranslation();

    useEffect(() => {
        WebSocketEventsRouter.setIncomingCallHandler((offer) => {
            console.log('[IncomingCallModal] входящий звонок', offer);
            setIncomingCall(offer);
            playIncomingCallSound();
        });
    }, [setIncomingCall]);

    if (!incomingCall) return null;

    const handleAccept = () => {
        stopIncomingCallSound();
        setActiveCall(incomingCall);
        setIncomingCall(null);
        navigate(`/call/active/${incomingCall.initiatorUuid}`);
    };

    const handleDecline = () => {
        stopIncomingCallSound();
        const payload: EndCall = {
            recipientUuid: incomingCall.initiatorUuid,
            recipientUsername: incomingCall.initiatorUsername,
        };
        send('/app/call/reject', payload);
        setIncomingCall(null);
    };
    return (
        <div className="incoming-call-modal">
            <div className="modal-box">
                <p><b>{incomingCall.initiatorUsername}</b> {t("call.callingYou")}</p>
                <div className="modal-buttons">
                    <button className="accept" onClick={handleAccept}>{t("call.accept")}</button>
                    <button className="decline" onClick={handleDecline}>{t("call.decline")}</button>
                </div>
            </div>
        </div>
    );
}
