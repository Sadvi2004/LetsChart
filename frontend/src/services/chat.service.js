import useUserStore from "../store/useUserStore";
import axiosInstance from "./url.service";
import { io } from "socket.io-client";

export const getConversations = async () => {
    const res = await axiosInstance.get("/chat/conversation");
    return res.data;
};

let socket = null;

export const initializeSocket = () => {
    if (socket) return socket;

    const user = useUserStore.getState().user;
    if (!user?._id) return null;

    const BACKEND_URL = import.meta.env.VITE_API_URL;

    socket = io(BACKEND_URL, {
        withCredentials: true,
        transports: ["websocket"], // keep only websocket
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
        socket.emit("user_connected", user._id);
    });

    socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
        console.error("Socket error:", error.message);
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log("🧹 Socket fully disconnected");
    }
};