import { useNavigate } from 'react-router-dom';
import ActionMenu from './ActionMenu';
import {useTranslation} from "react-i18next";

export default function FriendItem({ user, mode, handleFriendRequest }) {
    const {t} = useTranslation();
    const navigate = useNavigate();

    const onClick = () => {
        if (mode === 'friend') {
            navigate(`/chat/${user.uuid}`);
        }
    };

    return (
        <div className="friend-item" onClick={onClick}>
            <div className="info">
                <span className="username">{user.username}</span>
                {mode === 'friend' && (
                    <span className={`status-dot ${user.online ? 'online' : 'offline'}`} />
                )}
            </div>

            {mode === 'friend' && (
                <ActionMenu user={user} handleFriendRequest={handleFriendRequest} />
            )}

            {mode === 'incoming' && (
                <div className="actions">
                    <button onClick={(e) => { e.stopPropagation(); handleFriendRequest?.(user.raw, "accept"); }}>
                        {t("friendsPage.accept")}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleFriendRequest?.(user.raw, "decline"); }}>
                        {t("friendsPage.decline")}
                    </button>
                </div>
            )}

            {mode === 'outgoing' && (
                <div className="actions">
                    <button onClick={(e) => { e.stopPropagation(); handleFriendRequest?.(user.raw, "cancel"); }}>
                        {t("friendsPage.cancel")}
                    </button>
                </div>
            )}
        </div>
    );
}
