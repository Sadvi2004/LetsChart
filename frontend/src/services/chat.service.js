import axiosInstance from "./url.service";

export const getConversations = async () => {
    const res = await axiosInstance.get("/chat/conversation");
    return res.data;
};