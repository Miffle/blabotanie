// @ts-ignore
import React, {useEffect, useRef} from 'react';
import { useCall } from '../context/CallContext';
import { useNavigate } from 'react-router-dom';
import { WebSocketEventsRouter } from '../services/WebSocketEventsRouter';
import {EndCall} from "../dto/CallDTO";
import { useWebSocket } from '../context/WebSocketContext';
import {useTranslation} from "react-i18next";
export default function IncomingCallModal() {
    const { incomingCall, setIncomingCall, setActiveCall } = useCall();
    const navigate = useNavigate();
    const { send } = useWebSocket();
    const {t} = useTranslation();
    const incomingCallSound = useRef(new Audio('sounds/incoming-call.mp3'));

    const isPlayingIncomingCall = useRef(false);

    useEffect(() => {
        WebSocketEventsRouter.setIncomingCallHandler((offer) => {
            console.log('[IncomingCallModal] входящий звонок', offer);
            setIncomingCall(offer);
            playIncomingCall();
        });
    }, [setIncomingCall]);

    if (!incomingCall) return null;

    const handleAccept = () => {
        stopIncomingCall();
        setActiveCall(incomingCall);
        setIncomingCall(null);
        navigate(`/call/active/${incomingCall.initiatorUuid}`);
    };

    const handleDecline = () => {
        const payload: EndCall = {
            recipientUuid: incomingCall.initiatorUuid,
            recipientUsername: incomingCall.initiatorUsername,
        };
        send('/app/call/reject', payload);
        setIncomingCall(null);
    };
    const playIncomingCall = () => {
        console.log('[Audio] Attempting to play incoming call sound');
        console.log('[Audio] Sound state before play:', {
            readyState: incomingCallSound.current.readyState,
            error: incomingCallSound.current.error,
            duration: incomingCallSound.current.duration,
            volume: incomingCallSound.current.volume,
            muted: incomingCallSound.current.muted,
            src: incomingCallSound.current.src
        });

        if (!isPlayingIncomingCall.current) {
            isPlayingIncomingCall.current = true;
            incomingCallSound.current.currentTime = 0;
            incomingCallSound.current.volume = 1.0;
            incomingCallSound.current.muted = false;
            incomingCallSound.current.loop = true;
            incomingCallSound.current.play()
                .then(() => {
                    console.log('[Audio] Incoming call sound started successfully');
                    console.log('[Audio] Sound state after play:', {
                        readyState: incomingCallSound.current.readyState,
                        error: incomingCallSound.current.error,
                        duration: incomingCallSound.current.duration,
                        volume: incomingCallSound.current.volume,
                        muted: incomingCallSound.current.muted
                    });
                })
                .catch(err => {
                    console.error('[Audio] Error playing incoming call sound:', err);
                    console.log('[Audio] Sound state after error:', {
                        readyState: incomingCallSound.current.readyState,
                        error: incomingCallSound.current.error,
                        duration: incomingCallSound.current.duration,
                        volume: incomingCallSound.current.volume,
                        muted: incomingCallSound.current.muted
                    });
                    isPlayingIncomingCall.current = false;
                });
        } else {
            console.log('[Audio] Sound is already playing');
        }
    };

    const stopIncomingCall = () => {
        console.log('[Audio] Attempting to stop incoming call sound');
        if (isPlayingIncomingCall.current) {
            incomingCallSound.current.pause();
            incomingCallSound.current.currentTime = 0;
            isPlayingIncomingCall.current = false;
            console.log('[Audio] Incoming call sound stopped successfully');
        } else {
            console.log('[Audio] Sound is not playing');
        }
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
