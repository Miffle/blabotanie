import FriendItem from './FriendItem';

export default function FriendList({ friends, mode, handleFriendRequest }) {
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
            online: user.online,
            raw: user,
        };
    };
    const sortedFriends = [...friends].sort((a, b) => Number(b.online) - Number(a.online));

    return (
        <div className="friend-list">
            {sortedFriends.map((user: any) => {
                const normalized = normalizeUser(user);
                return (
                    <FriendItem
                        key={normalized.uuid}
                        user={normalized}
                        mode={mode}
                        handleFriendRequest={handleFriendRequest}
                    />
                );
            })}
        </div>
    );
}
