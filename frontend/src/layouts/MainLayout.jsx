import { useWebSocket } from "../context/WebSocketContext";
import CallModalController from "../controllers/CallModalController";
import ActiveCallModal from "../components/ActiveCallModal";
import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from '../components/Header';

export default function MainLayout() {
  const { callOffer, setCallOffer, activeCall } = useWebSocket();
  const [incomingCallOpen, setIncomingCallOpen] = useState(false);
  const [outgoingCall, setOutgoingCall] = useState(null);
  const location = useLocation();

  // Новые состояния для индикаторов заявок
  const [incomingRequestsCount, setIncomingRequestsCount] = useState(0);
  const [outgoingRequestsCount, setOutgoingRequestsCount] = useState(0);

  useEffect(() => {
    if (callOffer) setIncomingCallOpen(true);
  }, [callOffer]);

  const handleCloseCallModal = () => {
    setIncomingCallOpen(false);
    setCallOffer(null);
  };

  const handleCallFriend = (friend) => {
    setOutgoingCall({ friendUsername: friend.friendUsername });
  };

  const handleCloseOutgoingCall = () => {
    setOutgoingCall(null);
  };

  return (
    <>
      <Header incomingRequestsCount={incomingRequestsCount} outgoingRequestsCount={outgoingRequestsCount} />
      <main>
        {callOffer && !activeCall && location.pathname !== "/call" && (
          <CallModalController
            open={incomingCallOpen}
            offer={callOffer.sdp}
            caller={callOffer.initiator}
            startTime={callOffer.startTime}
            onClose={handleCloseCallModal}
          />
        )}
        {outgoingCall && !activeCall && location.pathname !== "/call" && (
          <ActiveCallModal
            open={!!outgoingCall}
            friendUsername={outgoingCall.friendUsername}
            incoming={false}
            onClose={handleCloseOutgoingCall}
          />
        )}
        <Outlet context={{ handleCallFriend, setIncomingRequestsCount, setOutgoingRequestsCount }} />
      </main>
    </>
  );
}
