// @ts-ignore
import React, {useState, useEffect, useRef} from "react";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {useCall} from '../context/CallContext';
import {useAudioDevices} from '../context/AudioDeviceContext';

export default function ActionMenu({user, handleFriendRequest}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const {t} = useTranslation();
    const {activeCall, setActiveCall} = useCall();
    const navigate = useNavigate();
    const {
        selectedInputId
    } = useAudioDevices();
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    const openChat = (e) => {
        e.stopPropagation();
        navigate(`/chat/${user.uuid}`);
    };
    const toggleMenu = (e) => {
        e.stopPropagation();
        setOpen((prev) => !prev);
    };

    const handleAction = async (e, action: string) => {
        e.stopPropagation();
        setOpen(false);

        if (action === "call") {
            try {
                // Важный момент: запрашиваем в контексте пользовательского клика
                await navigator.mediaDevices.getUserMedia({audio: selectedInputId ? {deviceId: {exact: selectedInputId}} : true});

                const myUuid = localStorage.getItem("uuid");

                const offer = {
                    initiatorUuid: myUuid,
                    initiatorUsername: localStorage.getItem("username") || "",
                    calledUuid: user.uuid,
                    calledUsername: user.username,
                    sdp: "", // WebRTC позже сгенерирует
                    startTime: new Date().toISOString(),
                };

                setActiveCall(offer);
                navigate(`/call/active/${user.uuid}`);
            } catch (err) {
                console.error("Микрофон не доступен:", err);
                alert("Не удалось получить доступ к микрофону. Проверьте разрешения.");
            }
            return;
        }

        handleFriendRequest?.(user, action);
    };


    return (
        <div className="action-menu" ref={ref}>
            <button
                type="button"
                className="menu-toggle-btn"
                onClick={toggleMenu}
                aria-label="Действия"
            >
                ⋯
            </button>
            {open && (
                <div className="action-dropdown">
                    {user.raw.status === "ONLINE" && !activeCall &&
                        <button type="button" onClick={(e) => handleAction(e, "call")}>
                            {t("friendsPage.call")}
                        </button>
                    }
                    <button type="button" onClick={(e) => openChat(e)}>
                        {t("friendsPage.chat")}
                    </button>
                    <button type="button" onClick={(e) => handleAction(e, "delete")}>
                        {t("friendsPage.delete")}
                    </button>
                </div>
            )}
        </div>
    );
}
