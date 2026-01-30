import React, { useEffect, useRef, useState } from 'react'
import axiosInstance from "../../services/url.service";
import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/useUserStore';
import { useChatStore } from '../../store/chatStore';
import { isToday, isYesterday, format } from 'date-fns';
import rightPanel from "../../assets/cp-1.png"
import { FaArrowLeft, FaEllipsisV, FaImage, FaLock, FaPaperclip, FaSmile, FaTimes, FaFile, FaPaperPlane } from "react-icons/fa";
import MessageBubble from './MessageBubble';
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-toastify";
import { RxCross1 } from 'react-icons/rx';

const isValidate = (date) => {
    return date instanceof Date && !isNaN(date)
}

const ChatWindow = ({ contact: selectedContact, setSelectedContact }) => {
    const [message, setMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFileMenu, setShowFileMenu] = useState(false);
    const [filePreview, setFilePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showAIMenu, setShowAIMenu] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiModal, setAiModal] = useState(null);
    // "translate" | "improve" | "tone" | "summarize"
    const [aiText, setAiText] = useState("");
    const [improveOptions, setImproveOptions] = useState([]);
    const [selectedImproveText, setSelectedImproveText] = useState("");

    const [selectedToneText, setSelectedToneText] = useState("");
    const [selectedTone, setSelectedTone] = useState("");
    const [tone, setTone] = useState("polite");
    const [language, setLanguage] = useState("English");
    const [translateSourceText, setTranslateSourceText] = useState("");

    const typingTimeoutRef = useRef(null);
    const messageEndRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const fileInputRef = useRef(null);

    const { theme } = useThemeStore();
    const { user } = useUserStore();

    const { messages, loading, sendMessage, receiveMessage, fetchMessages, fetchConversations, conversations, isUserTyping, startTyping, stopTyping, isUserLastSeen, isUserOnline, cleanup, addReaction, deleteMessage } = useChatStore();
    const online = isUserOnline(selectedContact?._id)
    const lastSeen = isUserLastSeen(selectedContact?._id);
    const isTyping = isUserTyping(selectedContact?._id);

    useEffect(() => {
        if (!selectedContact?._id) return;
        if (!Array.isArray(conversations?.data)) return;

        const conversation = conversations.data.find((conv) =>
            Array.isArray(conv.participants) &&
            conv.participants.some(
                (participant) =>
                    participant &&
                    (participant._id === selectedContact._id ||
                        participant === selectedContact._id)
            )
        );

        if (conversation?._id) {
            fetchMessages(conversation._id);
        }
    }, [selectedContact?._id, conversations?.data]);

    useEffect(() => {
        fetchConversations();
    }, []);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "auto" })
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages])

    useEffect(() => {
        if (message && selectedContact) {
            startTyping(selectedContact?._id)

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }

            typingTimeoutRef.current = setTimeout(() => {
                stopTyping(selectedContact?._id)
            }, 2000);
        }
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [message, selectedContact, startTyping, stopTyping])

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setShowFileMenu(false);
            if (file.type.startsWith('image/') || file.type.startsWith("video/")) {
                setFilePreview(URL.createObjectURL(file));
            }
        }
    }

    const handleSendMessage = async () => {
        if (!selectedContact) return;
        try {
            const formData = new FormData();
            formData.append("senderId", user?._id);
            formData.append("receiverId", selectedContact?._id)

            const status = online ? "delivered" : "send";
            formData.append("messageStatus", status);
            if (message.trim()) {
                formData.append("content", message.trim());
            }
            //if there is a file include that too
            if (selectedFile) {
                formData.append("media", selectedFile, selectedFile.name)
            }

            if (!message.trim() && !selectedFile) return;
            await sendMessage(formData);

            //clear state
            setMessage("");
            setFilePreview(null);
            setSelectedFile(null);
            setShowFileMenu(false);
        } catch (error) {
            console.error("Failed to send message! ", error);
        }
    }
    const handleAI = async (action) => {
        if (aiLoading) return;

        // 🔹 SMART REPLY
        if (action === "reply") {
            const lastReceiverMessage = getLastReceiverMessage();

            if (!lastReceiverMessage) {
                toast.warn("No messages to reply to");
                return;
            }

            setAiLoading(true);
            try {
                const res = await axiosInstance.post("/ai/chat", {
                    action: "smartReply",
                    messages: [
                        { sender: "Receiver", content: lastReceiverMessage }
                    ],
                });

                setAiText(res.data.reply);
                setAiModal("reply");
            } catch {
                toast.error("AI service not responding");
            } finally {
                setAiLoading(false);
            }
            return;
        }

        // 🔹 SUMMARIZE
        if (action === "summarize") {
            if (!messages || messages.length === 0) {
                toast.warn("No messages to summarize");
                return;
            }

            setAiLoading(true);
            try {
                const res = await axiosInstance.post("/ai/chat", {
                    action: "summarize",
                    messages: buildChatHistory(),
                });

                setAiText(res.data.reply);
                setAiModal("summarize");
            } catch {
                toast.error("AI service not responding");
            } finally {
                setAiLoading(false);
            }
            return;
        }

        // TRANSLATE (unchanged)
        if (action === "translate") {
            if (!message.trim()) {
                toast.warn("Please type text to translate");
                return;
            }
            setTranslateSourceText(message);
            setAiText("");
            setAiModal("translate");
            return;
        }

        // IMPROVE / OTHER FEATURES (unchanged)
        if (!message.trim()) {
            toast.warn("Please write a message to use AI features");
            return;
        }

        setAiLoading(true);
        try {
            const res = await axiosInstance.post("/ai/chat", {
                action,
                messages: [{ sender: "User", content: message }],
            });

            if (action === "improve") {
                setImproveOptions(res.data.reply);
                setSelectedImproveText("");
            } else {
                setAiText(res.data.reply);
            }

            setAiModal(action);
        } catch {
            toast.error("AI service not responding");
        } finally {
            setAiLoading(false);
        }
    };

    //Translate Model
    const handleTranslateInModal = async () => {
        if (!translateSourceText.trim()) return;

        setAiLoading(true);
        try {
            const res = await axiosInstance.post("/ai/chat", {
                action: "translate",
                messages: [
                    { sender: "User", content: translateSourceText }
                ],
                targetLanguage: language,
            });

            setAiText(res.data.reply);
        } catch {
            toast.error("Translation failed");
        } finally {
            setAiLoading(false);
        }
    };

    //For Chat Summarization
    const buildChatHistory = () => {
        return messages
            .slice(-15)
            .map((msg) => ({
                sender: msg.sender === user?._id ? "User" : "Receiver",
                content: msg.content || ""
            }));
    };

    //To get last Chat message
    const getLastReceiverMessage = () => {
        if (!messages || messages.length === 0) return null;

        // find last message NOT sent by current user
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender !== user?._id && messages[i].content) {
                return messages[i].content;
            }
        }
        return null;
    };

    const aiBoxTheme =
        theme === "dark"
            ? "bg-white text-gray-600"
            : "bg-gray-600 text-white";

    const renderDateSeparator = (date) => {
        if (!isValidate(date)) {
            return null;
        }
        let dateString;
        if (isToday(date)) {
            dateString = "Today"
        } else if (isYesterday(date)) {
            dateString = "Yesterday";
        } else {
            dateString = format(date, "EEEE,MMMM,d")
        }
        return (
            <div className="flex justify-center my-4">
                <span className={`px-4 py-2 rounded-full text-sm ${theme === 'dark' ? "bg-gray-700 text-gray-300 " : "bg-gray-200 text-gray-600"}`}>
                    {dateString}
                </span>
            </div>
        )

    }

    //Group message 
    const groupedMessages = Array.isArray(messages) ? messages.reduce((acc, message) => {
        if (!message.createdAt) return acc;
        const date = new Date(message.createdAt);
        if (isValidate(date)) {
            const dateString = format(date, "yyyy-MM-dd");
            if (!acc[dateString]) {
                acc[dateString] = [];
            }
            acc[dateString].push(message);
        } else {
            console.error("Invalid date for message", message)
        }
        return acc;
    }, {}) : {};

    const handleReaction = (messageId, emoji) => {
        addReaction(messageId, emoji)
    }

    if (!selectedContact) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center">
                <div className='max-w-md'>
                    <img src={rightPanel} alt="Let'sChat" className='w-full h-auto rounded-full' />
                    <h2 className={`text-3xl font-semibold mb-4 ${theme === 'dark' ? "text-white" : "text-black"}`}>Select a conversation to start chatting</h2>
                    <p className={`mb-6 ${theme === 'dark' ? "text-gray-400" : "text-gray-600"}`}>Choose a contact from the list to start messaging</p>
                    <p className={`text-sm mt-8 flex items-center justify-center gap-2 ${theme === 'dark' ? "text-gray-400" : "text-gray-600"}`}> <FaLock className='h-4 w-4' /> Your messages are end-to-end encrypted..</p>
                </div>
            </div>
        )
    }
    return (
        <div className="flex-1 h-screen w-full flex flex-col">
            <div className={`p-4 flex items-center ${theme === 'dark' ? "bg-[#303430] text-white" : "bg-[rgb(239,242,245)] text-gray-600"}`}>
                <button className="mr-2 focus:outline-none" onClick={() => setSelectedContact(null)}>
                    <FaArrowLeft className="h-6 w-6" />
                </button>

                <img src={selectedContact?.profilePicture} alt={selectedContact?.username} className="w-10 h-10 rounded-full" />
                <div className="ml-3 grow">
                    <h2 className="font-semibold text-start">{selectedContact?.username}</h2>
                    {isTyping ? (
                        <span className="text-sm text-green-500">Typing...</span>
                    ) : (
                        <p className={`text-sm ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}`}>
                            {online ? "Online" : lastSeen ? `Last seen ${format(new Date(lastSeen), "HH:mm")}` : "Offline"}
                        </p>
                    )}
                </div>

                <div className="flex items-center space-x-4 relative">
                    <button
                        className="focus:outline-none"
                        onClick={() => setShowAIMenu(prev => !prev)}
                    >
                        <FaEllipsisV className="h-5 w-5" />
                    </button>

                    {showAIMenu && (
                        <div className={`absolute right-0 top-9 w-56 rounded-xl shadow-xl z-50 py-5 overflow-hidden ${theme === "dark" ? "bg-white text-gray-700" : "bg-gray-800 text-white"}`}>
                            <button onClick={() => setShowAIMenu(false)} className='cursor-pointer absolute top-1 right-2 p-2'>
                                <RxCross1 className={`h-4 w-4 ${theme === 'dark' ? "text-black" : "text-white"}`} />
                            </button>
                            <div
                                onClick={() => { handleAI("reply"); setShowAIMenu(false); }}
                                className={`px-4 py-2 cursor-pointer mt-3 ${theme === 'dark' ? "hover:bg-gray-400" : "hover:bg-gray-600"}`}
                            >
                                ✨ Smart Reply
                            </div>

                            <div
                                onClick={() => { handleAI("summarize"); setShowAIMenu(false); }}
                                className={`px-4 py-2 cursor-pointer ${theme === 'dark' ? "hover:bg-gray-400" : "hover:bg-gray-600"}`}
                            >
                                📝 Summarize Chat
                            </div>

                            <div
                                onClick={() => { handleAI("translate"); setShowAIMenu(false); }}
                                className={`px-4 py-2 cursor-pointer ${theme === 'dark' ? "hover:bg-gray-400" : "hover:bg-gray-600"}`}
                            >
                                🌍 Translate
                            </div>

                            <div
                                onClick={() => { handleAI("improve"); setShowAIMenu(false); }}
                                className={`px-4 py-2 cursor-pointer ${theme === 'dark' ? "hover:bg-gray-400" : "hover:bg-gray-600"}`}
                            >
                                ✍️ Improve Message
                            </div>

                            <div
                                onClick={() => {
                                    if (!message.trim()) {
                                        toast.warn("Please type a message");
                                        return;
                                    }
                                    setTranslateSourceText(message); // reuse this as source text
                                    setAiText("");
                                    setSelectedTone("");
                                    setAiModal("tone");
                                    setShowAIMenu(false);
                                }}

                                className={`px-4 py-2 cursor-pointer ${theme === 'dark' ? "hover:bg-gray-400" : "hover:bg-gray-600"}`}
                            >
                                🎭 Polite / Formal Tone
                            </div>

                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className={`flex-1 p-4 overflow-y-auto ${theme === "dark" ? "bg-[#191a1a]" : "bg-[rgb(241,236,229)]"}`}>
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <React.Fragment key={date}>
                        {renderDateSeparator(new Date(date))}
                        {msgs
                            .map((msg) => (
                                <MessageBubble
                                    key={msg._id || msg.tempId}
                                    message={msg}
                                    theme={theme}
                                    currentUser={user}
                                    onReact={handleReaction}
                                    deleteMessage={deleteMessage}
                                />
                            ))}
                    </React.Fragment>
                ))}
                <div ref={messageEndRef} />
            </div>
            {filePreview && (
                <div className='relative p-2'>
                    {selectedFile?.type.startsWith("video/") ? (
                        <video src={filePreview} controls className='w-80 object-cover rounded shadow-lg mx-auto' />
                    ) : (

                        <img src={filePreview} alt="file-preview" className='w-80 object-cover rounded shadow-lg mx-auto' />
                    )}
                    <button onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                    }} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1">
                        <FaTimes className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className={`p-4 ${theme === 'dark' ? "bg-[#303430]" : "bg-white"} flex items-center space-x-2 relative`}>
                <button className='focus:outline-none'
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <FaSmile className={`h-6 w-6 ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}`} />
                </button>

                {showEmojiPicker && (
                    <div ref={emojiPickerRef} className='absolute left-0 bottom-16 z-50'>
                        <EmojiPicker onEmojiClick={(emojiObject) => {
                            setMessage((prev) => prev + emojiObject.emoji)
                            setShowEmojiPicker(false)
                        }} theme={theme} />
                    </div>
                )}
                <div className=' relative'>
                    <button className=" focus:outline-none"
                        onClick={() => setShowFileMenu(!showFileMenu)}>
                        <FaPaperclip className={`h-6 w-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"} mt-2`} />
                    </button>

                    {showFileMenu && (
                        <div className={`absolute bottom-full left-0 mb-2 ${theme === "dark" ? "bg-gray-700" : "bg-white"} rounded-lg shadow-lg`}>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept='image/*,video/*' className="hidden" />
                            <button onClick={() => fileInputRef.current.click()} className={`flex items-center px-4 py-2 w-full transition-colors hover:bg-gray-100 ${theme === 'dark' ? "hover:bg-gray-500" : "bg-gray-100"}`}>
                                <FaImage className='mr-2' />Image/Video
                            </button>

                            <button onClick={() => fileInputRef.current.click()} className={`flex items-center px-4 py-2 w-full transition-colors hover:bg-gray-100 ${theme === 'dark' ? "hover:bg-gray-500" : "bg-gray-100"}`}>
                                <FaFile className='mr-2' /> Documents
                            </button>
                        </div>
                    )}
                </div>
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => {
                    if (e.key === "Enter") {
                        handleSendMessage();
                    }
                }} placeholder='Type a mesaage' className={`grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 ${theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white text-black border-gray-300"}`} />
                <button onClick={handleSendMessage} className='focus:outline-none'>
                    <FaPaperPlane className='h-6 w-6 text-green-500' />
                </button>
            </div>
            {aiLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className={`px-6 py-4 rounded-lg shadow-lg ${theme === 'dark' ? "bg-white text-gray-600" : "bg-gray-600 text-white"}`}>
                        <span className="text-lg font-semibold animate-pulse">
                            👍Processing Request.
                        </span>
                    </div>
                </div>
            )}
            {aiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className={`w-[90%] max-w-lg rounded-lg p-4 ${theme === 'dark' ? "bg-white text-gray-600" : "bg-gray-700 text-white"}`}>

                        <h2 className="text-lg font-semibold mb-3 capitalize">
                            {aiModal} Message
                        </h2>

                        {/* TEXT AREA */}
                        {/* GENERIC AI TEXT (hide for translate) */}
                        {aiModal !== "translate" && aiModal !== "tone" && aiModal !== "improve" && (
                            <textarea
                                rows={4}
                                value={aiText}
                                onChange={(e) => setAiText(e.target.value)}
                                disabled={aiModal === 'summarize'}
                                className={`w-full border rounded p-2 mb-3 ${aiBoxTheme}`}
                            />
                        )}


                        {/* TRANSLATE */}
                        {aiModal === "translate" && (
                            <>
                                {/* ORIGINAL TEXT */}
                                <div className="mb-3">
                                    <label className={`text-sm font-medium ${theme === 'dark' ? "text-gray-500" : "text-gray-200"}`}>Original Text</label>
                                    <textarea
                                        rows={3}
                                        value={translateSourceText}
                                        disabled
                                        className={`w-full border rounded p-2 ${aiBoxTheme}`}
                                    />
                                </div>

                                {/* TARGET LANGUAGE */}
                                <div className="mb-3">
                                    <label className={`text-sm font-medium ${theme === 'dark' ? "text-gray-500" : "text-gray-200"}`}>Translate To</label>
                                    <select
                                        className={`w-full border p-2 rounded ${theme === 'dark' ? "bg-gray-200 text-gray-600" : "bg-gray-600 text-white"}`}
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                    >
                                        <option>English</option>
                                        <option>Hindi</option>
                                        <option>Telugu</option>
                                        <option>French</option>
                                        <option>Spanish</option>
                                    </select>
                                </div>

                                {/* TRANSLATED TEXT */}
                                <div className="mb-3">
                                    <label className={`text-sm font-medium ${theme === 'dark' ? "text-gray-500" : "text-gray-200"}`}>Translated Text</label>
                                    <textarea
                                        rows={3}
                                        value={aiText}
                                        readOnly
                                        className={`w-full border rounded p-2 ${theme === 'dark' ? "bg-gray-200 text-gray-600" : "bg-gray-600 text-white"}`}
                                    />
                                </div>

                                {/* TRANSLATE BUTTON */}
                                <div className="flex justify-end mb-3">
                                    <button
                                        onClick={handleTranslateInModal}
                                        disabled={aiLoading}
                                        className="px-4 py-2 cursor-pointer bg-blue-500 text-white rounded font-medium flex items-center gap-2"
                                    >
                                        {aiLoading ? "Translating..." : "Translate"}
                                    </button>

                                </div>
                            </>
                        )}

                        {/* TONE */}
                        {aiModal === "tone" && (
                            <>
                                {/* ORIGINAL TEXT */}
                                <div className="mb-3">
                                    <label className={`text-sm ${theme === 'dark' ? "text-gray-500" : "text-gray-200"}`}>Original Text</label>
                                    <textarea
                                        rows={3}
                                        value={translateSourceText}
                                        disabled
                                        className={`w-full border rounded p-2 ${aiBoxTheme}`}
                                    />
                                </div>

                                {/* TONE OPTIONS */}
                                <div className="flex gap-4 mb-3">
                                    {["polite", "formal", "friendly"].map(t => (
                                        <label key={t} className="flex gap-2 items-center">
                                            <input
                                                type="radio"
                                                checked={selectedTone === t}
                                                onChange={() => setSelectedTone(t)}
                                            />
                                            {t}
                                        </label>
                                    ))}
                                </div>

                                {/* RESULT */}
                                {aiText && (
                                    <textarea
                                        rows={3}
                                        value={aiText}
                                        readOnly
                                        className={`w-full border rounded p-2 ${aiBoxTheme}`}
                                    />
                                )}

                                {/* APPLY BUTTON */}
                                <div className="flex justify-end mb-4">
                                    <button
                                        disabled={!selectedTone || aiLoading}
                                        onClick={async () => {
                                            setAiLoading(true);
                                            try {
                                                const res = await axiosInstance.post("/ai/chat", {
                                                    action: "tone",
                                                    tone: selectedTone,
                                                    messages: [{ sender: "User", content: translateSourceText }],
                                                });
                                                setAiText(res.data.reply);
                                            } finally {
                                                setAiLoading(false);
                                            }
                                        }}
                                        className="px-4 py-2 bg-blue-500 text-white rounded"
                                    >
                                        {aiLoading ? "Applying" : "Apply"}
                                    </button>
                                </div>
                            </>
                        )}

                        {aiModal === "improve" && (
                            <div className="space-y-3 mb-3">
                                {improveOptions.map((text, index) => (
                                    <label
                                        key={index}
                                        className={`flex gap-3 items-start p-3 rounded cursor-pointer border ${aiBoxTheme}`}
                                    >
                                        <input
                                            type="radio"
                                            name="improve"
                                            checked={selectedImproveText === text}
                                            onChange={() => setSelectedImproveText(text)}
                                        />
                                        <span>{text}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-3">
                            <button
                                className={`px-4 py-2 rounded cursor-pointer ${theme === 'dark' ? "bg-gray-600 text-white" : "bg-red-400 text-white"}`}
                                onClick={() => setAiModal(null)}
                            >
                                Cancel
                            </button>

                            <button
                                className="px-4 py-2 bg-green-500 text-white rounded cursor-pointer"
                                onClick={() => {
                                    if (aiModal === 'translate' && !aiText.trim()) return;
                                    if (aiModal === "improve") {
                                        if (!selectedImproveText) return;
                                        setMessage(selectedImproveText);
                                    } else if (aiModal === "tone") {
                                        setMessage(aiText);
                                    } else {
                                        setMessage(aiText);
                                    }
                                    setAiModal(null);
                                }}
                            >
                                OK
                            </button>

                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWindow