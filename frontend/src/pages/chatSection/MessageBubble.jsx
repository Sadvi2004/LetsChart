// import React, { useState, useRef } from 'react'
// import { format } from 'date-fns'
// import { FaCheck, FaCheckDouble, FaPlus, FaSmile } from 'react-icons/fa';
// import { HiDotsVertical } from 'react-icons/hi';
// import useOutsideclick from '../../hooks/useOutsideclick';
// import EmojiPicker from 'emoji-picker-react';
// import { RxCross2 } from "react-icons/rx"

// const MessageBubble = ({ message, theme, onReact, currentUser, deleteMessage }) => {
//     const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//     const [showReactions, setShowReactions] = useState(false);
//     const messageRef = useRef(null);
//     const [showOptions, setShowOptions] = useState(false);
//     const optionsRef = useRef(null);

//     const emojiPickerRef = useRef(null);
//     const reactionsMenuRef = useRef(null);
//     const isUserMessage = message.sender._id === currentUser?._id

//     const bubbleClass = isUserMessage ? `chat-end` : `chat-start`

//     const bubbleContentClass = isUserMessage
//         ? `chat-bubble md:max-w-[50%] min-w-[130px] ${theme === 'dark' ? "bg-[#144d38] text-white" : "bg-[#d9fdd3] text-black"}`
//         : `chat-bubble md:max-w-[50%] min-w-[130px] ${theme === 'dark' ? "bg-white text-black" : "bg-white text-black"}`

//     const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

//     const handleReact = (emoji) => {

//         onReact(message._id, emoji)
//         setShowEmojiPicker(false)
//         setShowReactions(false)
//     }

//     useOutsideclick(emojiPickerRef, () => {
//         if (showEmojiPicker) setShowEmojiPicker(false)
//     })
//     useOutsideclick(reactionsMenuRef, () => {
//         if (showReactions) setShowReactions(false)
//     })
//     useOutsideclick(optionsRef, () => {
//         if (showOptions) setShowOptions(false)
//     })

//     if (message === 0) return

//     return (
//         <div className={`chat ${bubbleClass}`}>
//             <div className={`${bubbleContentClass} relative group`} ref={messageRef}>
//                 {/* Message content at the top */}
//                 {message.contentType === 'text' && (
//                     <p className="mb-5 wrap-break-word pr-6">{message.content}</p>
//                 )}

//                 {message.contentType === 'image' && (
//                     <div className="mb-5">
//                         <img src={message.imageOrVideoUrl} alt='images-videos' className='rounded-lg max-w-xs' />
//                         <p className='mt-1 wrap-break-word pr-6'>{message.content}</p>
//                     </div>
//                 )}

//                 {/* Time + Status at bottom-right */}
//                 <div className="absolute bottom-1 right-2 flex items-center gap-1 text-xs opacity-60">
//                     <span>{format(new Date(message.createdAt), "HH:mm")}</span>

//                     {isUserMessage && (
//                         <>
//                             {message.messageStatus === 'sent' && <FaCheck size={12} />}
//                             {message.messageStatus === 'delivered' && <FaCheckDouble size={12} />}
//                             {message.messageStatus === 'read' && <FaCheckDouble size={12} className='text-blue-900' />}
//                         </>
//                     )}
//                 </div>
//                 <div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20'>
//                     <button onClick={() => setShowOptions((prev) => !prev)} className={`p-1 rounded-full ${theme === 'dark' ? "text-white" : "text-gray-800"}`}>
//                         <HiDotsVertical size={18} />
//                     </button>
//                 </div>
//                 <div
//                     className={`absolute ${isUserMessage ? "-left-10" : "-right-10"} 
//               top-1/2 transform -translate-y-1/2 opacity-0 
//               group-hover:opacity-100 transition-opacity flex flex-col gap-2`}
//                 >
//                     <div className="relative inline-block">
//                         <button
//                             onClick={() => setShowReactions(!showReactions)}
//                             className={`p-2 rounded-full ${theme === "dark"
//                                 ? "bg-[#202c33] hover:bg-[#202c33]/80%"
//                                 : "bg-white hover:bg-gray-100"
//                                 } shadow-lg`}
//                         >
//                             <FaSmile
//                                 className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
//                             />
//                         </button>

//                         {showReactions && (
//                             <div
//                                 ref={reactionsMenuRef}
//                                 className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
//                    flex items-center bg-[#202c33]/90 rounded-full px-2 py-1.5 gap-1 
//                    shadow-lg z-50"
//                             >
//                                 {quickReactions.map((emoji, index) => (
//                                     <button
//                                         key={index}
//                                         onClick={() => handleReact(emoji)}
//                                         className="hover:scale-125 transition-transform p-1"
//                                     >
//                                         {emoji}
//                                     </button>
//                                 ))}
//                                 <div className="w-px h-5 bg-gray-600 mx-1" />
//                                 <button
//                                     className="hover:bg-[#ffffff1a] rounded-full p-1"
//                                     onClick={() => setShowEmojiPicker(true)}
//                                 >
//                                     <FaPlus className="h-4 w-4 text-gray-300" />
//                                 </button>
//                             </div>
//                         )}
//                         {showEmojiPicker && (
//                             <div ref={emojiPickerRef} className='absolute left-0 mb-6 z-50'>
//                                 <div className='relative'>
//                                     <EmojiPicker onEmojiClick={(emojiObject) =>
//                                         handleReact(emojiObject.emoji)
//                                     } theme={theme} />
//                                     <button onClick={() => setShowEmojiPicker(false)} className='absolute top-2 right-2 text-gray-500 hover:text-gray-700'>
//                                         <RxCross2 />
//                                     </button>
//                                 </div>
//                             </div>
//                         )}
//                         {message.reactions && message.reactions.length > 0 && (
//                             <div className={`absolute -bottom-5 ${isUserMessage ? "right-2" : "left-2"} ${theme === 'dark' ? "bg-[#2a3942]" : "bg-gray-200"} rounded-full px-2 shadow-md`}>
//                                 {message.reactions.map((reaction) => (
//                                     <span key={reaction.user} className="mr-1">
//                                         {reaction.emoji}
//                                     </span>
//                                 ))}
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default MessageBubble

import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { FaCheck, FaCheckDouble, FaPlus, FaSmile } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import EmojiPicker from "emoji-picker-react";
import { RxCross2 } from "react-icons/rx";
import useOutsideclick from "../../hooks/useOutsideclick";

/* 🔒 GLOBAL EMOJI LOCK (WhatsApp style) */
const EMOJI_EVENT = "GLOBAL_EMOJI_PICKER_OPEN";

const MessageBubble = ({ message, theme, onReact, currentUser }) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });

    const emojiPickerRef = useRef(null);
    const reactionsMenuRef = useRef(null);
    const optionsRef = useRef(null);
    const smileBtnRef = useRef(null);

    const isUserMessage = message.sender._id === currentUser?._id;

    const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

    /* ---------------- GLOBAL CLOSE ---------------- */

    const closeEmojiPicker = () => {
        setShowEmojiPicker(false);
        setShowReactions(false);
    };

    /* 🔥 CLOSE WHEN OTHER MESSAGE OPENS PICKER */
    useEffect(() => {
        const closeHandler = () => closeEmojiPicker();
        window.addEventListener(EMOJI_EVENT, closeHandler);
        return () => window.removeEventListener(EMOJI_EVENT, closeHandler);
    }, []);

    const handleReact = (emoji) => {
        onReact(message._id, emoji);
        closeEmojiPicker();
    };

    useOutsideclick(emojiPickerRef, () => showEmojiPicker && closeEmojiPicker());
    useOutsideclick(reactionsMenuRef, () => !showEmojiPicker && setShowReactions(false));
    useOutsideclick(optionsRef, () => setShowOptions(false));

    /* ---------------- EMOJI PICKER POSITION ---------------- */

    const openEmojiPicker = () => {
        if (!smileBtnRef.current) return;

        /* 🔒 CLOSE ALL OTHER PICKERS */
        window.dispatchEvent(new Event(EMOJI_EVENT));

        const rect = smileBtnRef.current.getBoundingClientRect();
        const PICKER_HEIGHT = 360;
        const PICKER_WIDTH = 350;
        const GAP = 8;

        let top;
        let left;

        // vertical (never overlap input)
        if (rect.top > PICKER_HEIGHT) {
            top = rect.top - PICKER_HEIGHT - GAP;
        } else {
            top = rect.bottom + GAP;
        }

        // horizontal
        left = isUserMessage
            ? rect.left - PICKER_WIDTH - GAP
            : rect.right + GAP;

        // clamp to viewport
        top = Math.max(8, Math.min(top, window.innerHeight - PICKER_HEIGHT - 8));
        left = Math.max(8, Math.min(left, window.innerWidth - PICKER_WIDTH - 8));

        setPickerPos({ top, left });
        setShowEmojiPicker(true);
        setShowReactions(true);
    };

    const groupedReactions =
        message.reactions?.reduce((acc, r) => {
            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
            return acc;
        }, {}) || {};

    /* ---------------- UI ---------------- */

    return (
        <div className={`chat ${isUserMessage ? "chat-end" : "chat-start"} mb-7`}>
            <div
                className={`relative chat-bubble md:max-w-[50%] min-w-130px pb-6
        ${isUserMessage
                        ? theme === "dark"
                            ? "bg-[#144d38] text-white"
                            : "bg-[#d9fdd3] text-black"
                        : "bg-white text-black"
                    }`}
            >
                <p className="pr-6 wrap-break-word">{message.content}</p>

                {/* TIME + STATUS */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[11px] opacity-60">
                    <span>{format(new Date(message.createdAt), "HH:mm")}</span>
                    {isUserMessage && (
                        <>
                            {message.messageStatus === "sent" && <FaCheck size={12} />}
                            {message.messageStatus === "delivered" && <FaCheckDouble size={12} />}
                            {message.messageStatus === "read" && (
                                <FaCheckDouble size={12} className="text-blue-900" />
                            )}
                        </>
                    )}
                </div>

                {/* OPTIONS */}
                <div className="absolute top-1 right-1 opacity-0 hover:opacity-100 transition">
                    <button
                        ref={optionsRef}
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-1 rounded-full cursor-pointer"
                    >
                        <HiDotsVertical size={18} />
                    </button>
                </div>

                {/* REACTION PILL */}
                {Object.keys(groupedReactions).length > 0 && (
                    <div
                        className={`absolute -bottom-4 ${isUserMessage ? "right-2" : "left-2"
                            }`}
                    >
                        <div
                            className={`${theme === "dark" ? "bg-[#2a3942]" : "bg-gray-200"
                                } rounded-full px-2 py-2px shadow-md flex gap-1 text-sm cursor-pointer`}
                        >
                            {Object.entries(groupedReactions).map(([emoji, count]) => (
                                <span key={emoji}>
                                    {emoji}{count > 1 && ` ${count}`}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* SMILE BUTTON */}
                <div
                    className={`absolute ${isUserMessage ? "-left-10" : "-right-10"
                        } top-1/2 -translate-y-1/2
          ${showEmojiPicker ? "opacity-100" : "opacity-0 hover:opacity-100"}`}
                >
                    <button
                        ref={smileBtnRef}
                        onClick={() => setShowReactions((v) => !v)}
                        className="p-2 rounded-full shadow-lg cursor-pointer bg-[#202c33] text-gray-300"
                    >
                        <FaSmile />
                    </button>

                    {showReactions && (
                        <div
                            ref={reactionsMenuRef}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
              flex bg-[#202c33]/90 rounded-full px-2 py-1 gap-1 z-50"
                        >
                            {quickReactions.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => handleReact(emoji)}
                                    className="cursor-pointer hover:scale-125 transition p-1"
                                >
                                    {emoji}
                                </button>
                            ))}
                            <div className="w-px h-5 bg-gray-600 mx-1" />
                            <button onClick={openEmojiPicker} className="p-1 cursor-pointer">
                                <FaPlus className="text-gray-300" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/*SINGLE GLOBAL EMOJI PICKER */}
            {showEmojiPicker && (
                <div
                    ref={emojiPickerRef}
                    style={{
                        position: "fixed",
                        top: pickerPos.top,
                        left: pickerPos.left,
                        zIndex: 9999,
                    }}
                >
                    <div className="relative">
                        <EmojiPicker
                            theme={theme}
                            onEmojiClick={(e) => handleReact(e.emoji)}
                        />
                        <button
                            onClick={closeEmojiPicker}
                            className="absolute top-2 right-2 cursor-pointer"
                        >
                            <RxCross2 />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageBubble;