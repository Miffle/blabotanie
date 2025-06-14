import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  getAllFriends,
  getIncomingRequests,
  getOutgoingRequests,
  removeFriend,
  cancelRequest,
  acceptRequest,
  declineRequest,
  sendFriendRequest
} from "../api/friends";
import { useWebSocket } from "../context/WebSocketContext";
import FriendItem from "../components/Friends/FriendItem";
import IncomingRequestItem from "../components/Friends/IncomingRequestItem";
import OutgoingRequestItem from "../components/Friends/OutgoingRequestItem";
import FriendSection from "../components/Friends/FriendSection";
import Chat from "../components/Chat";
import "../styles/friends.css";
import "../styles/chat.css";

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [tab, setTab] = useState("friends");
  const [search, setSearch] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const { presence, friendEvent, setActiveCall, activeCall, callOffer } = useWebSocket();
  const [selectedFriend, setSelectedFriend] = useState(null);
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const setIncomingRequestsCount = outletContext?.setIncomingRequestsCount;
  const setOutgoingRequestsCount = outletContext?.setOutgoingRequestsCount;

  const refresh = () => {
    if (tab === "friends") {
      getAllFriends().then(setFriends);
    } else if (tab === "requests") {
      getIncomingRequests().then(setIncoming);
      getOutgoingRequests().then(setOutgoing);
    }
  };

  useEffect(() => {
    refresh();
  }, [tab]);

  // Обновляем индикаторы в Header при изменении заявок
  useEffect(() => {
    if (setIncomingRequestsCount) setIncomingRequestsCount(incoming.length);
  }, [incoming, setIncomingRequestsCount]);
  useEffect(() => {
    if (setOutgoingRequestsCount) setOutgoingRequestsCount(outgoing.length);
  }, [outgoing, setOutgoingRequestsCount]);

  // Реакция на обновление presence
  useEffect(() => {
    if (presence && presence.username) {
      setFriends(friends => friends.map(f =>
        f.friendUsername === presence.username ? { ...f, online: presence.online } : f
      ));
    }
  }, [presence]);

  // Реакция на изменения по друзьям через WebSocket
  useEffect(() => {
    if (!friendEvent.type) return;
    if (friendEvent.type === 'friendList') {
      if (tab === "friends") {
        getAllFriends().then(data => setFriends([...data]));
      }
    } else if (friendEvent.type === 'incomingRequests') {
      if (tab === "requests") {
        getIncomingRequests().then(data => setIncoming([...data]));
      }
    } else if (friendEvent.type === 'outgoingRequests') {
      if (tab === "requests") {
        getOutgoingRequests().then(data => setOutgoing([...data]));
      }
    } else {
      refresh();
    }
  }, [friendEvent, tab]);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    const ok = await sendFriendRequest(search.trim());
    setInviteStatus(ok ? "Заявка отправлена" : "Ошибка при отправке");
    setSearch("");
    refresh();
    setTimeout(() => setInviteStatus(""), 3000);
  };

  // Для надёжности: после удаления друга и отмены заявки вручную триггерим friendEvent
  const handleRemove = async (id) => {
    await removeFriend(id);
    refresh();
  };
  const handleCancel = async (id) => {
    await cancelRequest(id);
    refresh();
  };

  return (
    <div className="friends-page">
      <div className="friends-sidebar">
        <form className="invite-form" onSubmit={handleSendInvite}>
          <input
            type="text"
            placeholder="Имя пользователя..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={32}
          />
          <button type="submit">Добавить</button>
          {inviteStatus && <span className="status-text">{inviteStatus}</span>}
        </form>

        <div className="tab-buttons">
          <button className={tab === "friends" ? "active" : ""} onClick={() => setTab("friends")}>Все друзья</button>
          <button className={tab === "requests" ? "active" : ""} onClick={() => setTab("requests")}>Заявки в друзья</button>
        </div>

        <div className="friends-list">
          {tab === "friends" && (
            <FriendSection
              items={friends}
              emptyMessage="Нет друзей"
              renderItem={(f) => (
                <FriendItem
                  key={f.friendId}
                  friend={f}
                  onRemove={() => handleRemove(f.friendId)}
                  onSelect={() => setSelectedFriend(f)}
                  selected={selectedFriend && selectedFriend.friendId === f.friendId}
                  onCall={() => {
                    if (!activeCall && !callOffer) {
                      setActiveCall({
                        initiator: localStorage.getItem("username"),
                        called: f.friendUsername,
                        startTime: new Date().toISOString()
                      });
                      navigate("/call");
                    }
                  }}
                />
              )}
            />
          )}

          {tab === "requests" && (
            <>
              <FriendSection
                title="Входящие"
                items={incoming}
                emptyMessage="Нет входящих заявок"
                renderItem={(r) => (
                  <IncomingRequestItem
                    key={r.id}
                    request={r}
                    onAccept={(id) => acceptRequest(id).then(refresh)}
                    onDecline={(id) => declineRequest(id).then(refresh)}
                  />
                )}
              />
              <div className="divider" />
              <FriendSection
                title="Исходящие"
                items={outgoing}
                emptyMessage="Нет исходящих заявок"
                renderItem={(r) => (
                  <OutgoingRequestItem
                    key={r.id}
                    request={r}
                    onCancel={handleCancel}
                  />
                )}
              />
            </>
          )}
        </div>
      </div>

      <div className="friends-main">
        <Chat friend={selectedFriend} />
      </div>
    </div>
  );
}
