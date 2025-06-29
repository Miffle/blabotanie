// @ts-ignore
import React, {useEffect, useState} from "react";
import "../styles/profile.css"; // стили отдельно
import {ProfileService} from "../services/ProfileService";
import {useTranslation} from "react-i18next";
import {useParams} from "react-router-dom";
interface UserProfile {
    username: string;
}

export default function ProfilePage( ) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [editing, setEditing] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [loading, setLoading] = useState(true);
    const {t} = useTranslation();
    const uuid = useParams().id;
    const localUuid = localStorage.getItem("uuid");
    const isMyProfile = uuid === localUuid;

    useEffect(() => {
        if (!uuid) return;
        ProfileService.getProfile(uuid)
            .then((data) => {
                setProfile(data);
                setNewUsername(data.username);
            })
            .finally(() => setLoading(false));
    }, [uuid]);

    const handleSave = async () => {
        if (newUsername && newUsername !== profile?.username) {
            await ProfileService.updateUsername(newUsername);
            setProfile({username: newUsername});
        }
        setEditing(false);
    };

    if (loading) { // @ts-ignore
        return <div className="profile-loading">Загрузка...</div>;
    }

    return (
        <div className="profile-page">
            <div className="profile-avatar">
                {profile?.username?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="profile-username">
                {editing ? (
                    <input
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="profile-input"
                    />
                ) : (
                    <h2>{profile?.username}</h2>
                )}
            </div>
            {isMyProfile && (
                <div className="profile-actions">
                    {editing ? (
                        <>
                            <button onClick={handleSave}>{t("profile.save")}</button>
                            <button onClick={() => {
                                setNewUsername(profile?.username || "");
                                setEditing(false);
                            }}>
                                {t("profile.cancel")}
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setEditing(true)}>
                            {t("profile.editUsername")}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
