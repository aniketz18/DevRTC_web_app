import { createContext, useState, useEffect } from "react";
import API from "../utils/api";
import { io } from "socket.io-client";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    // If we had a /me endpoint, we'd verify here. 
                    // For now, assume user is in localStorage or decode token if needed.
                    // But better to persist user in localStorage too or fetch from API.
                    // Let's assume we store user in localStorage for simplicity or just token.
                    // We'll decode or fetch. Let's fetch /users/me if it existed or just rely on stored user.
                    // I didn't create /me. I'll stick to localStorage user data for now.
                    const storedUser = JSON.parse(localStorage.getItem("user"));
                    if (storedUser) {
                        setUser(storedUser);
                        connectSocket(storedUser._id);
                    }
                } catch (err) {
                    console.error(err);
                    logout();
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const connectSocket = (userId) => {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
        const newSocket = io(socketUrl);
        newSocket.emit("join", userId);
        setSocket(newSocket);
    };

    const login = async (email, password) => {
        try {
            const { data } = await API.post("/auth/login", { email, password });
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            setUser(data.user);
            connectSocket(data.user._id);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Login failed" };
        }
    };

    const register = async (userData) => {
        try {
            const { data } = await API.post("/auth/register", userData);
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            setUser(data.user);
            connectSocket(data.user._id);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Registration failed" };
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        if (socket) socket.disconnect();
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, socket, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
