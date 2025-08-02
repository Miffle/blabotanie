import {useNavigate} from 'react-router-dom';
import ActionMenu from './ActionMenu';
import {useTranslation} from "react-i18next";
import {statusStringToEnum, UserStatus} from "../types/UserStatus";

export default function FriendItem({user, mode, handleFriendRequest}) {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const onClick = () => {
        if (mode === 'friend') {
            navigate(`/chat/${user.uuid}`);
        }
    };
    const openFriendProfile = (e) => {
        e.stopPropagation();
        navigate(`/profile/${user.uuid}`);
    }
    const renderStatusDot = (statusStr: UserStatus) => {
        const status: UserStatus = statusStringToEnum[statusStr] ?? UserStatus.OFFLINE;
        switch (status) {
            case UserStatus.ONLINE:
                return <span className="status online">{t("status.online")}</span>;
            case UserStatus.AWAY:
                return <span className="status away">{t("status.away")}</span>;
            case UserStatus.IN_CALL:
                return <span className="status in-call">{t("status.inCall")}</span>;
            case UserStatus.OFFLINE:
            default:
                return <span className="status offline">{t("status.offline")}</span>;
        }
    };

    return (
        <div className="friend-item" onClick={onClick}>
            <div className="info" onClick={openFriendProfile}>
                <div>
                    <span className={`username ${user.raw.status.toLowerCase()}`}>{user.username}</span>
                </div>
                {mode === 'friend' && renderStatusDot(user.raw.status)}
            </div>

            {mode === 'friend' && (
                <ActionMenu user={user} handleFriendRequest={handleFriendRequest}/>
            )}

            {mode === 'incoming' && (
                <div className="actions">
                    <button onClick={(e) => {
                        e.stopPropagation();
                        handleFriendRequest?.(user.raw, "accept");
                    }}>
                        {t("friendsPage.accept")}
                    </button>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        handleFriendRequest?.(user.raw, "decline");
                    }}>
                        {t("friendsPage.decline")}
                    </button>
                </div>
            )}

            {mode === 'outgoing' && (
                <div className="actions">
                    <button onClick={(e) => {
                        e.stopPropagation();
                        handleFriendRequest?.(user.raw, "cancel");
                    }}>
                        {t("friendsPage.cancel")}
                    </button>
                </div>
            )}
        </div>
    );
}
