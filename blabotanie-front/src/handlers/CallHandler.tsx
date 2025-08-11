// @ts-ignore
import React, {useEffect, useRef} from 'react';
import {useCall} from '../context/CallContext';
import {useWebSocket} from '../context/WebSocketContext';
import {Answer, EndCall, IceCandidate, MuteAudio, Offer} from '../dto/CallDTO';
import {WebSocketEventsRouter} from '../services/WebSocketEventsRouter';
import {useNavigate} from "react-router-dom";
import {useAudioDevices} from '../context/AudioDeviceContext';

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
    const {
        activeCall,
        endCall,
        micEnabled,
        audioEnabled,
        playOutgoingCallSound,
        stopOutgoingCallSound,
        stopIncomingCallSound,
        setPeerMicEnabled,
        setPeerHeadEnabled,
    } = useCall();
    const {
        selectedInputId,
        selectedOutputId,
    } = useAudioDevices();
    const {send} = useWebSocket();
    const navigate = useNavigate();
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const uuid = localStorage.getItem('uuid')!;
    const peerUuid = activeCall?.calledUuid === uuid ? activeCall.initiatorUuid : activeCall?.calledUuid;
    const peerUsername = activeCall?.calledUuid === uuid ? activeCall.initiatorUsername : activeCall?.calledUsername;
    const isIncoming = activeCall?.initiatorUuid !== uuid;

    useEffect(() => {
        localStreamRef.current?.getAudioTracks().forEach(track => {
            track.enabled = micEnabled;
            send("/app/call/muteMic", {
                senderUuid: uuid,
                senderUsername: localStorage.getItem("username"),
                recipientUuid: peerUuid,
                recipientUsername: peerUsername,
                device: "MICROPHONE",
                isMuted: !micEnabled,
            } as MuteAudio);
        });
    }, [micEnabled]);
    useEffect(() => {
        if (remoteAudioRef.current) {
            remoteAudioRef.current.muted = !audioEnabled;
            send("/app/call/muteHeadphones", {
                senderUuid: uuid,
                senderUsername: localStorage.getItem("username"),
                recipientUuid: peerUuid,
                recipientUsername: peerUsername,
                device: "HEADPHONES",
                isMuted: !audioEnabled,
            } as MuteAudio);

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

        const stream = await navigator.mediaDevices.getUserMedia({audio: selectedInputId ? {deviceId: {exact: selectedInputId}} : true});
        localStreamRef.current = stream;
        if (remoteAudioRef.current && 'setSinkId' in remoteAudioRef.current && selectedOutputId) {
            (remoteAudioRef.current as any).setSinkId(selectedOutputId).catch(err => {
                console.warn("Не удалось установить sinkId:", err);
            });
        }
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
            stopIncomingCallSound();
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
            playOutgoingCallSound();
            const payload: Offer = {
                ...activeCall,
                sdp: offer.sdp,
                startTime: new Date().toISOString(),
            };
            send('/app/call/offer', payload);
        }
    };
    useEffect(() => {
        if (!pcRef.current || !selectedInputId) return;

        const updateInputDevice = async () => {
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: {deviceId: {exact: selectedInputId}}
            });

            // @ts-ignore
            const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'audio');
            if (sender) {
                const [newTrack] = newStream.getAudioTracks();
                sender.replaceTrack(newTrack);
            }

            // Остановим старые треки
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            localStreamRef.current = newStream;
        };

        updateInputDevice().catch(console.error);
    }, [selectedInputId]);
    useEffect(() => {
        if (remoteAudioRef.current && 'setSinkId' in remoteAudioRef.current && selectedOutputId) {
            (remoteAudioRef.current as any).setSinkId(selectedOutputId).catch(err => {
                console.warn("Не удалось установить sinkId:", err);
            });
        }
    }, [selectedOutputId]);

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
            stopOutgoingCallSound();
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
        WebSocketEventsRouter.setMuteHandler((mute: MuteAudio) => {
            const isPeer = mute.senderUuid !== uuid; // если это не мы
            if (isPeer) {
                switch (mute.device) {
                    case "MICROPHONE": {
                        setPeerMicEnabled(!mute.isMuted); // обновляем состояние
                        break;
                    }
                    case "HEADPHONES": {
                        setPeerHeadEnabled(!mute.isMuted);
                        break;
                    }

                }
            }
        });
    }, []);

    const cleanup = () => {
        stopOutgoingCallSound();
        stopIncomingCallSound()
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
    return <audio ref={remoteAudioRef} autoPlay/>;
}
