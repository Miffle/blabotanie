// @ts-ignore
import React, {createContext, useContext, useEffect, useState} from 'react';
import {AuthService} from '../services/AuthService';

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    refreshToken: string | null;
    uuid: string | null;
    username: string | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
    logout: () => void;
    updateAuth: any,
    initialized: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [token, setToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [uuid, setUuid] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);

    const isAuthenticated = !!token;
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        const t = localStorage.getItem('token');
        const r = localStorage.getItem('refreshToken');
        const u = localStorage.getItem('uuid');
        const n = localStorage.getItem('username');
        if (t && r && u && n) {
            setToken(t);
            setRefreshToken(r);
            setUuid(u);
            setUsername(n);
        }
        setInitialized(true);
        refresh()

    }, []);

    const login = async (username: string, password: string) => {
        const response = await AuthService.login({username, password});
        setToken(response.token);
        setRefreshToken(response.refreshToken);
        setUuid(response.uuid);
        setUsername(response.username);
    };
    const register = async (username: string, password: string) => {
        const response = await AuthService.register({username, password});
        setToken(response.token);
        setRefreshToken(response.refreshToken);
        setUuid(response.uuid);
        setUsername(response.username);
    };
    const updateAuth = (data: { token: string, refreshToken: string, uuid: string, username: string }) => {
        setToken(data.token);
        setRefreshToken(data.refreshToken);
        setUuid(data.uuid);
        setUsername(data.username);
    };

    const refresh = async () => {
        const r = localStorage.getItem('refreshToken');
        if (!r) return;

        try {
            const response = await AuthService.refreshToken({refreshToken: r});
            setToken(response.token);
            setRefreshToken(response.refreshToken);
            setUuid(response.uuid);
            setUsername(response.username);
        } catch (e) {
            logout(); // refresh не сработал
        }
    };

    const logout = () => {
        const lang = localStorage.getItem("lang")
        localStorage.clear();
        localStorage.setItem("lang", lang);
        setToken(null);
        setRefreshToken(null);
        setUuid(null);
        setUsername(null);
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            token,
            refreshToken,
            uuid,
            username,
            login,
            register,
            logout,
            updateAuth,
            initialized
        }}>
            {children}
        </AuthContext.Provider>
    );
};
