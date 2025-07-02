// @ts-ignore
import React, { useState, useEffect } from "react";
import { FriendService } from "../services/FriendService";
import FriendList from "../components/FriendList";
import "../styles/friends.css";
import { FriendContext } from '../context/FriendContext';
import { WebSocketEventsRouter } from "../services/WebSocketEventsRouter";
import { useTranslation } from "react-i18next";
import { UserResponse } from "../dto/UserDTO";

export default function FriendsPage() {
    const [search, setSearch] = useState("");
    const [inviteStatus, setInviteStatus] = useState("");
    const [friends, setFriends] = useState([]);
    const [incoming, setIncoming] = useState([]);
    const [outgoing, setOutgoing] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { t } = useTranslation();
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([])

    const refresh = async (body: string = "") => {
        console.log(body);
        switch (body) {
            case "friendList": {
                const [friends] = await Promise.all([
                    FriendService.getAllFriends(),
                ]);
                // @ts-ignore
                setFriends(friends);
                break;
            }
            case "outgoingRequests": {
                const [outReq] = await Promise.all([
                    FriendService.getOutgoingRequests(),
                ]);
                // @ts-ignore
                setOutgoing(outReq);
                break;
            }
            case "incomingRequests": {
                const [inReq] = await Promise.all([
                    FriendService.getIncomingRequests(),
                ]);
                // @ts-ignore
                setIncoming(inReq);
                break;
            }
            default: {
                const [friends, inReq, outReq] = await Promise.all([
                    FriendService.getAllFriends(),
                    FriendService.getIncomingRequests(),
                    FriendService.getOutgoingRequests(),
                ]);
                // @ts-ignore
                setFriends(friends);
                // @ts-ignore
                setIncoming(inReq);
                // @ts-ignore
                setOutgoing(outReq);
            }
        }
    };

    useEffect(() => {
        refresh();
        WebSocketEventsRouter.setRefreshHandler((body) => refresh(body));
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
                    await refresh("incomingRequests")
                    break;
                case 'decline':
                    await FriendService.declineFriendRequest(user.id);
                    await refresh("incomingRequests")
                    break;
                case 'delete':
                    await FriendService.deleteFriend(user.uuid);
                    break;
                case 'cancel':
                    await FriendService.cancelFriendRequest(user.id);
                    break;
            }
            // await refresh();
        } catch (err) {
            console.error("Ошибка при обработке запроса:", err);
        }
    };

    const sendRequest = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        try {
            await FriendService.sendFriendRequest(query.trim());
        } catch (err) {
            setInviteStatus(err.response?.data || "Ошибка");
        }
        setQuery("");
        setSuggestions([]);
        await refresh();
    };

    const hasFriends = friends.length > 0;
    const hasRequests = incoming.length > 0 || outgoing.length > 0;
    useEffect(() => {
        const debounceDelay = setTimeout(() => {
            if (query.length > 1) {
                FriendService.searchByQuery(query)
                    .then(setSuggestions)
                    .catch(e => console.log(e))
            } else {
                setSuggestions([])
            }
        }, 300);
        return () => clearTimeout(debounceDelay);
    }, [query])
    const handleSelect = async (username: string) => {
        setSuggestions([]);
        setQuery("");
        try {
            await FriendService.sendFriendRequest(username);
            refresh();
        } catch (err) {
            setInviteStatus(err.response?.data || "Ошибка");
        }
    };
    return (
        <FriendContext.Provider value={{ refresh }}>
            <div className="friends-page">
                <form onSubmit={sendRequest} className="add-friend-form">
                    <input
                        type="text"
                        autoComplete="off"
                        placeholder={t("friendsPage.placeholder")}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        maxLength={32}
                    />
                    {suggestions.length > 0 &&
                        <ul className="suggestions">
                            {suggestions.map((user: UserResponse) =>
                                <li key={user.uuid} onClick={() => handleSelect(user.username)}>
                                    {user.username}
                                </li>
                            )}
                        </ul>
                    }
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
                                        mode="incoming"
                                        handleFriendRequest={handleFriendRequest}
                                    />
                                )}
                                {outgoing.length > 0 && (
                                    <FriendList
                                        friends={outgoing}
                                        mode="outgoing"
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
