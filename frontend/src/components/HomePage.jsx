import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import ChatList from "../pages/chatSection/ChatList";
import { getConversations } from "../services/chat.service";
import { getAllUsers } from "../services/user.service";
import useUserStore from "../store/useUserStore";

const HomePage = () => {
    const { user } = useUserStore();
    const [contacts, setContacts] = useState([]);

    useEffect(() => {
        if (!user?._id) return;

        const loadChats = async () => {
            const [convRes, usersRes] = await Promise.all([
                getConversations(),
                getAllUsers()
            ]);

            const conversationMap = new Map();

            convRes.data.forEach((conv) => {
                const otherUser = conv.participants.find(
                    (p) => p._id !== user._id
                );

                conversationMap.set(otherUser._id, {
                    _id: otherUser._id,
                    username: otherUser.username,
                    profilePicture: otherUser.profilePicture,
                    conversation: conv,
                });
            });

            const merged = usersRes.data
                .filter((u) => u._id !== user._id)
                .map((u) =>
                    conversationMap.get(u._id) || {
                        _id: u._id,
                        username: u.username,
                        profilePicture: u.profilePicture,
                        conversation: null, // ❗ no chat yet
                    }
                );

            setContacts(merged);
        };

        loadChats();
    }, [user]);

    return (
        <Layout>
            <ChatList contacts={contacts} />
        </Layout>
    );
};

export default HomePage;