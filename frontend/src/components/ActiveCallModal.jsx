import React, { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";

// ICE сервера как раньше
const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

export default function ActiveCallModal({
  open,
  friendUsername,     // username собеседника (кому звоним или кто нам звонит)
  incoming,           // true если входящий звонок (offer уже пришёл)
  incomingOffer,      // sdp оффера если входящий звонок
  startTime,          // startTime если входящий звонок
  onClose
}) {
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
    resetCallState,
    stopOutgoingCall,
    playOutgoingCall
  } = useWebSocket();

  // Аналоги глобальных переменных
  const [status, setStatus] = useState(incoming ? "Звонок активен" : "Ожидание ответа...");
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
    if (!open || !friendUsername) return;
    let isMounted = true;

    const start = async () => {
      const myUsername = localStorage.getItem("username");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) return;
        setLocalStream(stream);
        if (localAudioRef.current) localAudioRef.current.srcObject = stream;

        const pc = new RTCPeerConnection(iceServers);
        peerConnectionRef.current = pc;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

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
          setRemoteStream(prev => {
            if (!prev) {
              const newStream = new MediaStream();
              newStream.addTrack(event.track);
              if (remoteAudioRef.current) remoteAudioRef.current.srcObject = newStream;
              return newStream;
            } else {
              prev.addTrack(event.track);
              if (remoteAudioRef.current) remoteAudioRef.current.srcObject = prev;
              return prev;
            }
          });
        };

        if (incoming) {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: incomingOffer }));
          for (const candidate of pendingCandidatesRef.current) {
            try { await pc.addIceCandidate(candidate); } catch (err) { console.error("Ошибка ICE (offer):", err); }
          }
          pendingCandidatesRef.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendCallAnswer(friendUsername, myUsername, answer.sdp);
          setStatus("Звонок активен");
          callStartTime.current = startTime ? new Date(startTime) : new Date();
          startTimer();
        } else {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          const startTime = new Date().toISOString();
          sendCallOffer(myUsername, friendUsername, offer.sdp, startTime);
          setStatus("Ожидание ответа...");
          callStartTime.current = new Date(startTime);
          startTimer();
          playOutgoingCall();
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
  }, [open, friendUsername, incoming, incomingOffer, startTime]);

  // Получение answer (только для исходящего звонка)
  useEffect(() => {
    if (!open || !callAnswer) return;
    const myUsername = localStorage.getItem("username");
    if (!incoming && callAnswer.initiator === myUsername && callAnswer.called === friendUsername) {
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
  }, [callAnswer, open, incoming, friendUsername]);

  // ICE кандидаты (для обоих сторон)
  useEffect(() => {
    if (!open || !iceCandidate) return;
    const myUsername = localStorage.getItem("username");
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
  }, [iceCandidate, open, friendUsername]);

  // Завершение звонка (end/reject)
  useEffect(() => {
    if ((callEnd && open) || (callReject && open)) {
      cleanup();
      setStatus("Звонок завершён");
      resetCallState();
      onClose();
    }
    // eslint-disable-next-line
  }, [callEnd, callReject, open]);

  function cleanup() {
    if (!incoming) {
      stopOutgoingCall();
    }
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
    stopOutgoingCall()
    const myUsername = localStorage.getItem("username");
    sendCallEnd(friendUsername, myUsername);
    cleanup();
    setStatus("Звонок завершён");
    resetCallState();
    onClose();
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

  if (!open) return null;

  return (
    <div className="call-modal">
      <div className="call-modal-content">
        <div className="call-modal-title">
          Разговор с {friendUsername}
        </div>
        <div className="call-status">{status}</div>
        <div className="call-timer">{formatTime(callDuration)}</div>
        <audio ref={localAudioRef} autoPlay muted />
        <audio ref={remoteAudioRef} autoPlay />
        <div className="call-controls">
          <button
            className={`call-control-btn ${isMicMuted ? "muted" : ""}`}
            onClick={toggleMic}
            title={isMicMuted ? "Включить микрофон" : "Выключить микрофон"}
          >
            {isMicMuted ? "🎤 ❌" : "🎤 ✅"}
          </button>
          <button
            className={`call-control-btn ${isRemoteMuted ? "muted" : ""}`}
            onClick={toggleRemoteAudio}
            title={isRemoteMuted ? "Включить звук" : "Выключить звук"}
          >
            {isRemoteMuted ? "🔊 ❌" : "🔊 ✅"}
          </button>
          <button
            className="call-control-btn end-call"
            onClick={handleEndCall}
            title="Завершить звонок"
          >
            <i className="fas fa-phone-slash" />
          </button>
        </div>
      </div>
    </div>
  );
}
