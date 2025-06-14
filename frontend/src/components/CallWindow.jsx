import React, { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";

const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:193.233.113.180:3579",
      username: "blabotanie",
      credential: "blabotanieClient"
    }
  ]
};

export default function CallWindow({ activeCall, onEnd, mini = false }) {
  const {
    sendCallOffer,
    sendCallAnswer,
    sendCallEnd,
    sendIceCandidate,
    callAnswer,
    iceCandidate,
    callEnd,
    callReject,
    setCallAnswer,
    setIceCandidate,
    resetCallState
  } = useWebSocket();

  const myUsername = localStorage.getItem("username");
  const isIncoming = activeCall.initiator !== myUsername;
  const friendUsername = isIncoming ? activeCall.initiator : activeCall.called;

  const [status, setStatus] = useState(isIncoming ? "Звонок активен" : "Ожидание ответа...");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnectionRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const callStartTime = useRef(null);
  const timerInterval = useRef(null);

  // Запуск звонка или принятие
  useEffect(() => {
    let isMounted = true;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Получен localStream:', stream);
console.log('Треки:', stream.getAudioTracks());
        if (!isMounted) return;
        setLocalStream(stream);
        if (localAudioRef.current) localAudioRef.current.srcObject = stream;

        const pc = new RTCPeerConnection(iceServers);
        peerConnectionRef.current = pc;
        stream.getTracks().forEach(track => {
          console.log('Добавляю трек в peerConnection:', track);
          pc.addTrack(track, stream);
        });

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendIceCandidate(
              myUsername,
              friendUsername,
              {
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
                candidate: event.candidate.candidate
              }
            );
          }
        };

        pc.ontrack = (event) => {
          const [stream] = event.streams;
          if (stream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream;
            remoteAudioRef.current.muted = false;
            setRemoteStream(stream);
          }
        };

        if (isIncoming) {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: activeCall.offer?.sdp || activeCall.offer }));
          for (const candidate of pendingCandidatesRef.current) {
            try { await pc.addIceCandidate(candidate); } catch (err) { console.error("Ошибка ICE (offer):", err); }
          }
          pendingCandidatesRef.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendCallAnswer(friendUsername, myUsername, answer.sdp);
          setStatus("Звонок активен");
          callStartTime.current = activeCall.startTime ? new Date(activeCall.startTime) : new Date();
          startTimer();
        } else {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          const startTime = new Date().toISOString();
          sendCallOffer(myUsername, friendUsername, offer.sdp, startTime);
          setStatus("Ожидание ответа...");
          callStartTime.current = new Date(startTime);
          startTimer();
        }
      } catch (err) {
        console.error("Ошибка доступа к микрофону:", err);
        setStatus("Ошибка доступа к микрофону");
        cleanup();
      }
    };
    start();
    return () => {
      isMounted = false;
      cleanup();
    };
    // eslint-disable-next-line
  }, [activeCall]);

  // Получение answer (только для исходящего звонка)
  useEffect(() => {
    if (!callAnswer) return;
    if (!isIncoming && callAnswer.initiator === myUsername && callAnswer.called === friendUsername) {
      (async () => {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription({ type: "answer", sdp: callAnswer.sdp })
        );
        for (const candidate of pendingCandidatesRef.current) {
          try { await peerConnectionRef.current.addIceCandidate(candidate); } catch (err) { console.error("Ошибка ICE (answer):", err); }
        }
        pendingCandidatesRef.current = [];
        setStatus("Звонок активен");
      })();
      setCallAnswer(null);
    }
    // eslint-disable-next-line
  }, [callAnswer, isIncoming, myUsername, friendUsername]);

  // ICE кандидаты (для обоих сторон)
  useEffect(() => {
    if (!iceCandidate) return;
    if (
      (iceCandidate.initiator === friendUsername && iceCandidate.called === myUsername) ||
      (iceCandidate.initiator === myUsername && iceCandidate.called === friendUsername)
    ) {
      const candidate = new RTCIceCandidate({
        sdpMid: iceCandidate.sdpMid,
        sdpMLineIndex: iceCandidate.sdpMLineIndex,
        candidate: iceCandidate.sdp
      });
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        peerConnectionRef.current.addIceCandidate(candidate);
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    }
    setIceCandidate(null);
    // eslint-disable-next-line
  }, [iceCandidate, myUsername, friendUsername]);

  // Завершение звонка (end/reject)
  useEffect(() => {
    if (callEnd || callReject) {
      cleanup();
      setStatus("Звонок завершён");
      resetCallState();
      if (onEnd) onEnd();
    }
    // eslint-disable-next-line
  }, [callEnd, callReject]);

  function cleanup() {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    callStartTime.current = null;
    pendingCandidatesRef.current = [];
  }

  function handleEndCall() {
    sendCallEnd(friendUsername, myUsername);
    cleanup();
    setStatus("Звонок завершён");
    resetCallState();
    if (onEnd) onEnd();
  }

  function toggleMic() {
    setIsMicMuted(prev => {
      if (!localStream) return prev;
      const newVal = !prev;
      localStream.getAudioTracks().forEach(track => track.enabled = !newVal);
      return newVal;
    });
  }

  function toggleRemoteAudio() {
    setIsRemoteMuted(prev => {
      if (remoteAudioRef.current) remoteAudioRef.current.muted = !prev;
      return !prev;
    });
  }

  function startTimer() {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    timerInterval.current = setInterval(() => {
      if (callStartTime.current) {
        const now = new Date();
        const totalSeconds = Math.floor((now - callStartTime.current) / 1000);
        setCallDuration(totalSeconds);
      }
    }, 1000);
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  // Явно обновляю srcObject для аудио при изменении remoteStream
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.muted = false;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (localStream) {
      window._debugLocalStream = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream) {
      window._debugRemoteStream = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className={mini ? "mini-call-main-block" : "call-main-block"}>
      <div className="call-users-block">
        <div className="call-user-card self">
          <div className="call-user-name">{myUsername}</div>
        </div>
        <div className="call-user-card other">
          <div className="call-user-name">{friendUsername}</div>
        </div>
      </div>
      <div className="call-status">{status}</div>
      <div className="call-timer">{formatTime(callDuration)}</div>
      <audio ref={localAudioRef} autoPlay muted />
      <audio ref={remoteAudioRef} autoPlay />
      <div className="call-controls-block">
        <button className={`call-control-btn ${isMicMuted ? "muted" : ""}`} onClick={toggleMic} title={isMicMuted ? "Включить микрофон" : "Выключить микрофон"}>
          <i className={`fas ${isMicMuted ? "fa-microphone-slash" : "fa-microphone"}`} />
        </button>
        {!mini && (
          <button className={`call-control-btn ${isRemoteMuted ? "muted" : ""}`} onClick={toggleRemoteAudio} title={isRemoteMuted ? "Включить звук" : "Выключить звук"}>
            <i className={`fas ${isRemoteMuted ? "fa-volume-mute" : "fa-volume-up"}`} />
          </button>
        )}
        <button className="call-control-btn end-call" onClick={handleEndCall} title="Завершить звонок">
          <i className="fas fa-phone-slash" />
        </button>
        {mini && (
          <button className="call-control-btn" onClick={() => window.location.hash = "#/call"} title="Развернуть звонок">
            <i className="fas fa-up-right-and-down-left-from-center" />
          </button>
        )}
      </div>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
    </div>
  );
} 

