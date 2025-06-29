// @ts-ignore
import React, {useState, useEffect} from "react";
import {FriendService} from "../services/FriendService";
import FriendList from "../components/FriendList";
import "../styles/friends.css";
import {FriendContext} from '../context/FriendContext';
import {WebSocketEventsRouter} from "../services/WebSocketEventsRouter";
import {useTranslation} from "react-i18next";

export default function FriendsPage() {
    const [search, setSearch] = useState("");
    const [inviteStatus, setInviteStatus] = useState("");
    const [friends, setFriends] = useState([]);
    const [incoming, setIncoming] = useState([]);
    const [outgoing, setOutgoing] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const {t} = useTranslation();

    const refresh = async () => {
        const [friends, inReq, outReq] = await Promise.all([
            FriendService.getAllFriends(),
            FriendService.getIncomingRequests(),
            FriendService.getOutgoingRequests(),
        ]);
        setFriends(friends);
        // @ts-ignore
        setIncoming(inReq);
        // @ts-ignore
        setOutgoing(outReq);
    };

    useEffect(() => {
        refresh();
        WebSocketEventsRouter.setRefreshHandler(refresh);
        WebSocketEventsRouter.setPresenceHandler((presence) => {
            setFriends(prev =>
                prev.map(friend =>
                    friend.friendUuid === presence.username
                        ? { ...friend, status: presence.status } // status вместо online
                        : friend
                )
            );
        });
    }, []);

    const handleFriendRequest = async (user, action) => {
        try {
            switch (action) {
                case 'accept':
                    await FriendService.acceptFriendRequest(user.id);
                    break;
                case 'decline':
                    await FriendService.declineFriendRequest(user.id);
                    break;
                case 'delete':
                    await FriendService.deleteFriend(user.uuid);
                    break;
                case 'cancel':
                    await FriendService.cancelFriendRequest(user.id);
                    break;
            }
            await refresh();
        } catch (err) {
            console.error("Ошибка при обработке запроса:", err);
        }
    };

    const sendRequest = async (e) => {
        e.preventDefault();
        if (!search.trim()) return;
        try {
            await FriendService.sendFriendRequest(search.trim());
        } catch (err) {
            setInviteStatus(err.response?.data || "Ошибка");
        }
        setSearch("");
        await refresh();
    };

    const hasFriends = friends.length > 0;
    const hasRequests = incoming.length > 0 || outgoing.length > 0;

    return (
        <FriendContext.Provider value={{refresh}}>
            <div className="friends-page">
                <form onSubmit={sendRequest} className="add-friend-form">
                    <input
                        type="text"
                        autoComplete="off"
                        placeholder={t("friendsPage.placeholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        maxLength={32}
                    />
                    {inviteStatus && <span className="status-text">{inviteStatus}</span>}
                </form>

                {!hasFriends && !hasRequests && <p className="empty-state">{t("friendsPage.empty")}</p>}

                {hasRequests && (
                    <div className="requests-section">
                        <button
                            className="toggle-dropdown"
                            onClick={() => setDropdownOpen(prev => !prev)}
                        >
                            {dropdownOpen ? t("friendsPage.hideRequests") : t("friendsPage.showRequests")}
                        </button>
                        {dropdownOpen && (
                            <div className="requests-dropdown">
                                {incoming.length > 0 && (
                                    <FriendList
                                        friends={incoming}
                                        mode="outgoing"
                                        handleFriendRequest={handleFriendRequest}
                                    />
                                )}
                                {outgoing.length > 0 && (
                                    <FriendList
                                        friends={outgoing}
                                        mode="incoming"
                                        handleFriendRequest={handleFriendRequest}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}

                {hasFriends && (
                    <FriendList
                        friends={friends}
                        mode="friend"
                        handleFriendRequest={handleFriendRequest}
                    />
                )}
            </div>
        </FriendContext.Provider>
    );
}
