import FriendItem from './FriendItem';

export default function FriendList({ friends, mode, handleFriendRequest }) {
    const statusPriority: Record<string, number> = {
        ONLINE: 1,
        IN_CALL: 2,
        AWAY: 3,
        OFFLINE: 4,
    };

    const normalizeUser = (user: any) => {
        if (mode === 'incoming') {
            return {
                username: user.senderUsername,
                uuid: user.senderUuid,
                raw: user,
            };
        }
        if (mode === 'outgoing') {
            return {
                username: user.recipientUsername,
                uuid: user.recipientUuid,
                raw: user,
            };
        }
        // обычный друг
        return {
            username: user.friendUsername,
            uuid: user.friendUuid,
            online: user.status,
            raw: user,
        };
    };
    const normalizedFriends = friends.map(normalizeUser);

    const sortedFriends = normalizedFriends.sort((a, b) => {
        const aPriority = statusPriority[a.online] ?? 999;
        const bPriority = statusPriority[b.online] ?? 999;
        return aPriority - bPriority;
    });
    return (
        <div className="friend-list">
            {sortedFriends.map((user) => (
                <FriendItem
                    key={user.uuid}
                    user={user}
                    mode={mode}
                    handleFriendRequest={handleFriendRequest}
                />
            ))}
        </div>
    );
}
