// @ts-ignore
import React, {useEffect, useRef, useState} from "react";
import "../styles/profile.css";
import {ProfileService} from "../services/ProfileService";
import {useTranslation} from "react-i18next";
import {useParams} from "react-router-dom";

interface Post {
    id: number;
    content: string;
    likes: number;
    likedByMe: boolean;
    createdAt: string;
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
    const [expandedPosts, setExpandedPosts] = useState<{ [key: number]: boolean }>({});
    const usernameInputRef = useRef<HTMLInputElement>(null);
    const bioInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!uuid) return;
        Promise.all([
            ProfileService.getProfile(uuid),
            ProfileService.getPosts(uuid)
        ])
            .then(([profileData, postsData]) => {
                setProfile({
                    ...profileData,
                    posts: postsData.posts
                });
                setNewUsername(profileData.username);
                setNewBio(profileData.bio ?? "");
            })
            .finally(() => setLoading(false));
    }, [uuid]);

    const togglePostExpand = (id: number) => {
        setExpandedPosts(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };
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
    const sendNewPost = async (e: any) => {
        if (!newPostInput.trim()) return;
        if (newPostInput.length > 2000) {
            alert("Пост не может быть длиннее 2000 символов");
            return;
        }
        const data = await ProfileService.createPost(newPostInput);
        setProfile(prev => prev ? {...prev, posts: data.posts} : prev);
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
                        <textarea
                            className={"new-post-text"}
                            value={newPostInput}
                            onChange={(e) => setNewPostInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (e.shiftKey) {
                                        // Shift+Enter → перенос строки
                                        return;
                                    } else {
                                        // Просто Enter → отправка
                                        e.preventDefault(); // чтобы не добавился перенос
                                        sendNewPost(e);
                                    }
                                }
                            }}
                            rows={3}
                            placeholder="Напишите пост..."
                        />
                    </div>
                }
                {profile?.posts && profile.posts.length > 0 ? (
                    profile.posts.reverse().map((post) => {
                        const isExpanded = expandedPosts[post.id] || false;
                        const shouldTruncate = post.content.length > 200;
                        const displayText = shouldTruncate && !isExpanded
                            ? post.content.slice(0, 200) + "..."
                            : post.content;
                        return (<div key={post.id} className="profile-post">
                                <div className="profile-post-content"> {displayText}
                                    {shouldTruncate && (
                                        <span
                                            className="toggle-post"
                                            onClick={() => togglePostExpand(post.id)}
                                        ><br/>
                                            {isExpanded ? "Свернуть" : "Развернуть"}
                        </span>
                                    )}</div>
                                <div className="profile-post-likes" onClick={sendLike}>
                                    <span className={"likes-count"}>{post.likes}</span>
                                    <img className={"like"} src={"like.svg"}/>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="profile-no-posts">
                        {t("profile.noPosts") || "Нет постов."}
                    </div>
                )}
            </div>
        </div>
    );
}
