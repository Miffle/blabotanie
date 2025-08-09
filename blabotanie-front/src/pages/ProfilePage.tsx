// @ts-ignore
import React, {useEffect, useState, useRef} from "react";
import "../styles/profile.css";
import {ProfileService} from "../services/ProfileService";
import {useTranslation} from "react-i18next";
import {useParams} from "react-router-dom";

interface Post {
    id: number;
    title: string;
    content: string;
    likes: number;
}

interface UserProfile {
    username: string;
    bio?: string;
    posts?: Post[];
}


export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [editingUsername, setEditingUsername] = useState(false);
    const [editingBio, setEditingBio] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [newBio, setNewBio] = useState("");
    const [loading, setLoading] = useState(true);
    const {t} = useTranslation();
    const [newPostInput, setNewPostInput] = useState('');
    // @ts-ignore
    const uuid: string | undefined = useParams().id;
    const localUuid = localStorage.getItem("uuid");
    const isMyProfile = uuid === localUuid;

    const usernameInputRef = useRef<HTMLInputElement>(null);
    const bioInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!uuid) return;
        ProfileService.getProfile(uuid)
            .then((data) => {
                setProfile(data);
                setNewUsername(data.username);
                setNewBio(data.bio ?? "");
            })
            .finally(() => setLoading(false));
    }, [uuid]);


    const handleSave = () => {
        if (!profile) return;
        if (newUsername && newUsername !== profile.username) {
            ProfileService.updateUsername(newUsername);
        }
        if (newBio !== profile.bio) {
            ProfileService.updateBio(newBio);
        }
        setProfile({
            ...profile,
            username: newUsername,
            bio: newBio,
        });
        setEditingUsername(false);
        setEditingBio(false);
    };

    const handleCancel = () => {
        setEditingUsername(false);
        setEditingBio(false);
    };

    const handleUsernameKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    const handleBioKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    const handleClickOutside = (e: React.MouseEvent) => {
        if (
            usernameInputRef.current && !usernameInputRef.current.contains(e.target as Node) ||
            bioInputRef.current && !bioInputRef.current.contains(e.target as Node)
        ) {
            handleCancel();
        }
    };

    useEffect(() => {
        // @ts-ignore
        document.addEventListener("mousedown", en => handleClickOutside(en)); // Using mousedown to catch click before input blur
        return () => {
            // @ts-ignore
            document.removeEventListener("mousedown", en => handleClickOutside(en));
        };
    }, []);

    if (loading) {
        return (
            <div className="profile-loading">
                {t("profile.loading") || "Загрузка..."}
            </div>
        );
    }

    const sendLike = (e: any) => {
        // todo доделать логику проставления лайков
        // Handle like functionality here
    };
    const sendNewPost = (e:any) => {
        if (!newPostInput.trim()) return;
        // todo доделать отправку поста
        setNewPostInput('');

    };

    return (
        <div className="profile-page">
            <div className="profile-info">
                <div className="profile-avatar">
                    {profile?.username
                        ? profile.username.charAt(0).toUpperCase()
                        : "?"}
                </div>

                {/* Username section */}
                <div className="profile-username">
                    {editingUsername ? (
                        <input
                            ref={usernameInputRef}
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            onKeyDown={handleUsernameKeyPress}
                            className="profile-input"
                        />
                    ) : (
                        <h2 onClick={() => isMyProfile && setEditingUsername(true)}>{profile?.username}</h2>
                    )}
                </div>

                {/* Biography section */}
                <div className="profile-bio">
                    {editingBio ? (
                        <textarea
                            ref={bioInputRef}
                            value={newBio}
                            onChange={(e) => setNewBio(e.target.value)}
                            onKeyDown={handleBioKeyPress}
                            className="profile-textarea"
                            rows={3}
                        />
                    ) : (
                        <p onClick={() => isMyProfile && setEditingBio(true)}>
                            {profile?.bio || t("profile.noBio") || "Нет описания."}
                        </p>
                    )}
                </div>
            </div>
            <div className="person-posts">
                {isMyProfile &&
                    <div className={"create-post"}>
                        <input
                            className={"new-post-text"}
                            type="text"
                            value={newPostInput}
                            onChange={(e) => setNewPostInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendNewPost(e)}
                        />
                    </div>
                }
                {profile?.posts && profile.posts.length > 0 ? (
                    profile.posts.map((post) => (
                        <div key={post.id} className="profile-post">
                            <div className="profile-post-title">{post.title}</div>
                            <div className="profile-post-content">{post.content}</div>
                            <div className="profile-post-likes" onClick={sendLike}>
                                <span className={"likes-count"}>{post.likes}</span>
                                <img className={"like"} src={"like.svg"}/>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="profile-no-posts">
                        {t("profile.noPosts") || "Нет постов."}
                    </div>
                )}
            </div>
        </div>
    );
}
