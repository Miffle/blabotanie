import { Outlet } from "react-router-dom";
import Header from '../components/Header.js';
import "../styles/index.css"
import {useState} from "react";
export default function MainLayout() {
    const [hovered, setHovered] = useState(false);

    return (
        <>
            <main>
                <Outlet />
            </main>
            <div className="nav-hint-line" />

            <Header />
        </>
    );
}
