import React, { useState, useMemo } from "react";
import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { FaPlus, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";

const ChatList = ({ contacts }) => {
    const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
    const selectedContact = useLayoutStore((state) => state.selectedContact);
    const { theme } = useThemeStore();
    const { user } = useUserStore();
    const [searchTerm, setSearchTerm] = useState("");

    // Filter contacts
    const filteredContacts = useMemo(() => {
        return contacts.filter((contact) =>
            contact?.username?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [contacts, searchTerm]);

    return (
        <div
            className={`w-full border-r h-screen ${theme === "dark"
                ? "bg-[rgb(17,27,33)] border-gray-600"
                : "bg-white border-gray-200"
                }`}
        >
            {/* Header */}
            <div
                className={`p-4 flex justify-between ${theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
            >
                <h2 className="text-xl font-semibold">Chats</h2>
                <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600">
                    <FaPlus />
                </button>
            </div>

            {/* Search */}
            <div className="p-2 relative">
                <FaSearch
                    className={`absolute left-5 top-1/2 -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-800"
                        }`}
                />
                <input
                    type="text"
                    placeholder="Search Chats"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${theme === "dark"
                        ? "bg-gray-800 text-white border-gray-700 placeholder-gray-500"
                        : "bg-gray-100 text-black border-gray-200 placeholder-gray-400"
                        }`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Chat List */}
            <div className="overflow-y-auto h-[calc(100vh-120px)]">
                {filteredContacts.map((contact) => (
                    <motion.div
                        key={contact._id}
                        onClick={() => setSelectedContact(contact)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`p-3 flex items-center cursor-pointer rounded-lg m-2 ${selectedContact?._id === contact._id
                            ? theme === "dark"
                                ? "bg-gray-700"
                                : "bg-gray-300"
                            : theme === "dark"
                                ? "hover:bg-gray-800"
                                : "hover:bg-gray-100"
                            }`}
                    >
                        <img
                            src={contact?.profilePicture}
                            alt={contact?.username}
                            className="w-12 h-12 rounded-full"
                        />

                        <div className="ml-3 flex-1">
                            {/* Username & Time */}
                            <div className="flex justify-between items-center">
                                <h2
                                    className={`font-semibold ${theme === "dark" ? "text-white" : "text-black"
                                        }`}
                                >
                                    {contact?.username}
                                </h2>

                                {contact?.conversation?.lastMessage?.createdAt && (
                                    <span
                                        className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                            }`}
                                    >
                                        {formatTimestamp(
                                            contact.conversation.lastMessage.createdAt
                                        )}
                                    </span>
                                )}
                            </div>

                            {/* Last message & unread count */}
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-sm truncate text-gray-500">
                                    {contact.conversation
                                        ? contact.conversation.lastMessage?.content
                                        : "Start a conversation"}
                                </p>

                                {contact.conversation?.unreadCount > 0 && (
                                    <span className="w-6 h-6 text-xs font-bold flex items-center justify-center bg-green-500 text-white rounded-full">
                                        {contact.conversation.unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ChatList;