// @ts-ignore
import React, {JSX} from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {AuthProvider, useAuth} from './context/AuthContext';
import LoginPage from './pages/LoginPage';
// @ts-ignore
import HomePage from './pages/HomePage';
import RegisterPage from "./pages/RegisterPage";
import MainLayout from "./layouts/MainLayout"
import CallHistory from "./pages/CallsPage";
import ProfilePage from "./pages/ProfilePage";
import {WebSocketProvider} from "./context/WebSocketContext";
import FriendsPage from "./pages/FriendsPage";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";

const ProtectedRoute = ({children}: { children: JSX.Element }) => {
    const {isAuthenticated, initialized} = useAuth();
    if (!initialized) return <div>Загрузка...</div>;
    return isAuthenticated ? children : <Navigate to="/login"/>;
};


export default function App() {
    return (
        <AuthProvider>
            <WebSocketProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage/>}/>
                        <Route path="/register" element={<RegisterPage/>}/>

                        <Route
                            path="/"
                            element={
                                <ProtectedRoute children={null}>
                                    <MainLayout/>
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<HomePage/>}/>
                            <Route path="friends" element={<FriendsPage/>}/>
                            <Route path="calls" element={<CallHistory/>}/>
                            <Route path="profile" element={<ProfilePage/>}/>
                            <Route path="settings" element={<SettingsPage/>}/>
                            <Route path="chat/:id" element={<ChatPage/>}/>
                            {/* Добавь другие страницы сюда */}
                        </Route>

                        <Route path="*" element={<Navigate to="/"/>}/>
                    </Routes>
                </BrowserRouter>
            </WebSocketProvider>
        </AuthProvider>
    );
}

