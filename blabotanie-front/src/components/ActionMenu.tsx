// @ts-ignore
import React, {useState, useEffect, useRef} from "react";
import {useTranslation} from "react-i18next";

export default function ActionMenu({user, handleFriendRequest}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const {t} = useTranslation();

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

    const toggleMenu = (e) => {
        e.stopPropagation();
        setOpen((prev) => !prev);
    };

    const handleAction = (e, action: string) => {
        e.stopPropagation();
        handleFriendRequest?.(user, action);
        setOpen(false);
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
                    {user.online &&
                        <button type="button" onClick={(e) => handleAction(e, "call")}>
                            {t("friendsPage.call")}
                        </button>
                    }
                    <button type="button" onClick={(e) => handleAction(e, "delete")}>
                        {t("friendsPage.delete")}
                    </button>
                </div>
            )}
        </div>
    );
}
