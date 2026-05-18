// import React, { useEffect, useState } from "react";
// import Layout from "./Layout";
// import ChatList from "../pages/chatSection/ChatList";
// import { getConversations } from "../services/chat.service";
// import { getAllUsers } from "../services/user.service";
// import useUserStore from "../store/useUserStore";

// const HomePage = () => {
//     const { user } = useUserStore();
//     const [contacts, setContacts] = useState([]);

//     useEffect(() => {
//         if (!user?._id) return;

//         const loadChats = async () => {
//             const [convRes, usersRes] = await Promise.all([
//                 getConversations(),
//                 getAllUsers()
//             ]);

//             const conversationMap = new Map();

//             convRes.data.forEach((conv) => {
//                 const otherUser = conv.participants.find(
//                     (p) => p._id !== user._id
//                 );

//                 conversationMap.set(otherUser._id, {
//                     _id: otherUser._id,
//                     username: otherUser.username,
//                     profilePicture: otherUser.profilePicture,
//                     conversation: conv,
//                 });
//             });

//             const merged = usersRes.data
//                 .filter((u) => u._id !== user._id)
//                 .map((u) =>
//                     conversationMap.get(u._id) || {
//                         _id: u._id,
//                         username: u.username,
//                         profilePicture: u.profilePicture,
//                         conversation: null, // ❗ no chat yet
//                     }
//                 );

//             setContacts(merged);
//         };

//         loadChats();
//     }, [user]);

//     return (
//         <Layout>
//             <ChatList contacts={contacts} />
//         </Layout>
//     );
// };

// export default HomePage;

import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import ChatList from "../pages/chatSection/ChatList";
import { getConversations } from "../services/chat.service";
import { getAllUsers } from "../services/user.service";
import useUserStore from "../store/useUserStore";
import useThemeStore from "../store/themeStore";

const HomePage = () => {

    const { user } = useUserStore();
    const { theme } = useThemeStore();

    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        if (!user?._id) return;

        const loadChats = async () => {

            try {

                setLoading(true);

                const [convRes, usersRes] = await Promise.all([
                    getConversations(),
                    getAllUsers(),
                ]);

                const conversationMap = new Map();

                // conversations
                convRes?.data?.forEach((conv) => {

                    const otherUser = conv.participants.find(
                        (p) => p._id !== user._id
                    );

                    if (!otherUser) return;

                    conversationMap.set(otherUser._id, {
                        _id: otherUser._id,
                        username: otherUser.username,
                        profilePicture: otherUser.profilePicture,
                        about: otherUser.about,
                        isOnline: otherUser.isOnline,
                        lastSeen: otherUser.lastSeen,
                        conversation: conv,
                    });

                });

                // show only users having conversations
                const mergedContacts = usersRes?.data
                    ?.filter(
                        (u) =>
                            u._id !== user._id &&
                            conversationMap.has(u._id)
                    )
                    ?.map((u) => conversationMap.get(u._id));

                // sort latest message first
                mergedContacts.sort((a, b) => {

                    const aTime = a?.conversation?.lastMessage?.createdAt
                        ? new Date(a.conversation.lastMessage.createdAt)
                        : 0;

                    const bTime = b?.conversation?.lastMessage?.createdAt
                        ? new Date(b.conversation.lastMessage.createdAt)
                        : 0;

                    return bTime - aTime;
                });

                setContacts(mergedContacts);

            } catch (error) {

                console.error("Error loading chats:", error);

            } finally {

                setLoading(false);
            }
        };

        loadChats();

    }, [user]);

    // Loading Skeleton UI
    if (loading) {

        return (

            <div
                className={`
                    h-screen flex overflow-hidden
                    ${theme === "dark"
                        ? "bg-[#111b21]"
                        : "bg-[#f0f2f5]"
                    }
                `}
            >

                {/* Sidebar Skeleton */}
                <div
                    className={`
                        hidden md:flex flex-col items-center py-5 gap-5 w-[70px]
                        ${theme === "dark"
                            ? "bg-[#202c33]"
                            : "bg-white"
                        }
                    `}
                >

                    {[1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                            className="w-12 h-12 rounded-full bg-gray-300 animate-pulse"
                        />
                    ))}

                </div>

                {/* Chat List Skeleton */}
                <div
                    className={`
                        w-full md:w-[400px] border-r h-screen p-4
                        ${theme === "dark"
                            ? "bg-[#111b21] border-gray-700"
                            : "bg-white border-gray-300"
                        }
                    `}
                >

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">

                        <div className="w-32 h-8 rounded bg-gray-300 animate-pulse"></div>

                        <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse"></div>

                    </div>

                    {/* Search */}
                    <div className="w-full h-12 rounded-lg bg-gray-300 animate-pulse mb-6"></div>

                    {/* Chats */}
                    {[1, 2, 3, 4, 5, 6].map((item) => (

                        <div
                            key={item}
                            className={`
                                flex items-center gap-3 p-3 rounded-xl mb-4
                                ${theme === "dark"
                                    ? "bg-[#202c33]"
                                    : "bg-gray-100"
                                }
                            `}
                        >

                            <div className="w-14 h-14 rounded-full bg-gray-300 animate-pulse"></div>

                            <div className="flex-1">

                                <div className="w-32 h-4 rounded bg-gray-300 animate-pulse mb-3"></div>

                                <div className="w-52 h-3 rounded bg-gray-300 animate-pulse"></div>

                            </div>

                        </div>

                    ))}

                </div>

                {/* Welcome Skeleton */}
                <div
                    className={`
                        hidden md:flex flex-1 flex-col justify-center items-center
                        ${theme === "dark"
                            ? "bg-[#0b141a]"
                            : "bg-[#f8f9fa]"
                        }
                    `}
                >

                    <div className="w-40 h-40 rounded-full bg-gray-300 animate-pulse mb-5"></div>

                    <div className="w-64 h-6 rounded bg-gray-300 animate-pulse mb-3"></div>

                    <div className="w-80 h-4 rounded bg-gray-300 animate-pulse"></div>

                </div>

            </div>
        );
    }

    return (
        <Layout>
            <ChatList contacts={contacts} />
        </Layout>
    );
};

export default HomePage;