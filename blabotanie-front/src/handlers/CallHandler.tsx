// @ts-ignore
import React, {useEffect, useRef} from 'react';
import {useCall} from '../context/CallContext';
import {useWebSocket} from '../context/WebSocketContext';
import {Answer, IceCandidate, Offer, EndCall} from '../dto/CallDTO';
import {WebSocketEventsRouter} from '../services/WebSocketEventsRouter';
import {useNavigate} from "react-router-dom";

const iceServers = {
    iceServers: [
        {urls: 'stun:stun.l.google.com:19302'},
        {
            urls: 'turn:193.233.113.180:3579',
            username: 'blabotanie',
            credential: 'blabotanieClient',
        },
    ],
};

export default function CallHandler() {
    const {activeCall, setActiveCall, endCall, micEnabled, audioEnabled} = useCall();
    const {send} = useWebSocket();
    const navigate = useNavigate();
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const outgoingCallSound = useRef(new Audio('sounds/outgoing-call.mp3'));
    const isPlayingOutgoingCall = useRef(false);
    const uuid = localStorage.getItem('uuid')!;
    const isIncoming = activeCall?.initiatorUuid !== uuid;

    const friendUuid = isIncoming
        ? activeCall?.initiatorUuid
        : activeCall?.calledUuid;
    useEffect(() => {
        localStreamRef.current?.getAudioTracks().forEach(track => {
            track.enabled = micEnabled;
        });
    }, [micEnabled]);
    useEffect(() => {
        if (remoteAudioRef.current) {
            remoteAudioRef.current.muted = !audioEnabled;
        }
    }, [audioEnabled]);
    useEffect(() => {
        if (!activeCall) return;

        const timeout = setTimeout(() => {
            init(); // init peer connection
        }, 0); // минимальная задержка, чтобы дождаться рендера

        return () => {
            clearTimeout(timeout);
            cleanup();
        };
    }, [activeCall]);
    const init = async () => {
        const pc = new RTCPeerConnection(iceServers);
        pcRef.current = pc;

        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        localStreamRef.current = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                const payload: IceCandidate = {
                    initiatorUuid: activeCall.initiatorUuid,
                    initiatorUsername: activeCall.initiatorUsername,
                    calledUuid: activeCall.calledUuid,
                    calledUsername: activeCall.calledUsername,
                    sdpMid: event.candidate.sdpMid!,
                    sdpMLineIndex: event.candidate.sdpMLineIndex!,
                    sdp: event.candidate.candidate!,
                };
                send('/app/call/ice-candidate', payload);
            }
        };

        pc.ontrack = (event) => {
            const [stream] = event.streams;
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = stream;
            }
        };

        if (isIncoming) {
            console.log(isIncoming);
            await pc.setRemoteDescription(
                new RTCSessionDescription({type: 'offer', sdp: activeCall.sdp})
            );
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            const payload: Answer = {
                calledUsername: activeCall.calledUsername,
                calledUuid: activeCall.calledUuid,
                initiatorUsername: activeCall.initiatorUsername,
                initiatorUuid: activeCall.initiatorUuid,
                sdp: answer.sdp,
            };
            console.log(payload);
            send('/app/call/answer', payload);
        } else {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            playOutgoingCall();
            const payload: Offer = {
                ...activeCall,
                sdp: offer.sdp,
                startTime: new Date().toISOString(),
            };
            send('/app/call/offer', payload);
        }
    };

    useEffect(() => {
        // WebSocketEventsRouter.setIncomingCallHandler(() => {});
        WebSocketEventsRouter.setRefreshHandler(() => {
        }); // если нужно

        WebSocketEventsRouter.setPresenceHandler(() => {
        });
        WebSocketEventsRouter.setChatHandler(() => {
        });

        WebSocketEventsRouter.setChatHistoryHandler(() => {
        });

        WebSocketEventsRouter.setAnswerHandler(async (answer: Answer) => {
            if (!pcRef.current || !answer.sdp) return;
            stopOutgoingCall();
            await pcRef.current.setRemoteDescription(
                new RTCSessionDescription({type: 'answer', sdp: answer.sdp})
            );
            for (const candidate of pendingCandidatesRef.current) {
                try {
                    await pcRef.current.addIceCandidate(candidate);
                } catch (err) {
                    console.warn('ICE error:', err);
                }
            }
            pendingCandidatesRef.current = [];
        });

        WebSocketEventsRouter.setIceCandidateHandler((candidate: IceCandidate) => {
            // @ts-ignore
            const rtcCandidate = new RTCIceCandidate({
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex,
                candidate: candidate.sdp,
            });

            if (pcRef.current?.remoteDescription) {
                pcRef.current.addIceCandidate(rtcCandidate);
            } else {
                pendingCandidatesRef.current.push(rtcCandidate);
            }

        });

        WebSocketEventsRouter.setCallEndHandler((_: EndCall) => {
            cleanup();
            endCall();
            navigate("/")
        });

        WebSocketEventsRouter.setCallRejectHandler((_: EndCall) => {
            cleanup();
            endCall();
            navigate("/")
        });
    }, []);

    const cleanup = () => {
        if (pcRef.current) {
            pcRef.current.onicecandidate = null;
            pcRef.current.ontrack = null;
            pcRef.current.close();
            pcRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
    };
    const playOutgoingCall = () => {
        console.log('[Audio] Attempting to play outgoing call sound');
        console.log('[Audio] Sound state before play:', {
            readyState: outgoingCallSound.current.readyState,
            error: outgoingCallSound.current.error,
            duration: outgoingCallSound.current.duration,
            volume: outgoingCallSound.current.volume,
            muted: outgoingCallSound.current.muted,
            src: outgoingCallSound.current.src
        });

        if (!isPlayingOutgoingCall.current) {
            isPlayingOutgoingCall.current = true;
            outgoingCallSound.current.currentTime = 0;
            outgoingCallSound.current.volume = 1.0;
            outgoingCallSound.current.muted = false;
            outgoingCallSound.current.loop = true;
            outgoingCallSound.current.play()
                .then(() => {
                    console.log('[Audio] Outgoing call sound started successfully');
                    console.log('[Audio] Sound state after play:', {
                        readyState: outgoingCallSound.current.readyState,
                        error: outgoingCallSound.current.error,
                        duration: outgoingCallSound.current.duration,
                        volume: outgoingCallSound.current.volume,
                        muted: outgoingCallSound.current.muted
                    });
                })
                .catch(err => {
                    console.error('[Audio] Error playing outgoing call sound:', err);
                    console.log('[Audio] Sound state after error:', {
                        readyState: outgoingCallSound.current.readyState,
                        error: outgoingCallSound.current.error,
                        duration: outgoingCallSound.current.duration,
                        volume: outgoingCallSound.current.volume,
                        muted: outgoingCallSound.current.muted
                    });
                    isPlayingOutgoingCall.current = false;
                });
        } else {
            console.log('[Audio] Outgoing call sound is already playing');
        }
    };

    const stopOutgoingCall = () => {
        console.log('[Audio] Attempting to stop outgoing call sound');
        if (isPlayingOutgoingCall.current) {
            outgoingCallSound.current.pause();
            outgoingCallSound.current.currentTime = 0;
            isPlayingOutgoingCall.current = false;
            console.log('[Audio] Outgoing call sound stopped successfully');
        } else {
            console.log('[Audio] Outgoing call sound is not playing');
        }
    };

    return <audio ref={remoteAudioRef} autoPlay/>;
}
