import React, { useState, useRef } from 'react'
import { format } from 'date-fns'
import { FaCheck, FaCheckDouble, FaPlus, FaSmile, FaRegCopy, FaRegTrashAlt } from 'react-icons/fa'
import { HiDotsVertical } from 'react-icons/hi'
import useOutsideclick from '../../hooks/useOutsideclick'
import EmojiPicker from 'emoji-picker-react'
import { RxCross2 } from "react-icons/rx"

const MessageBubble = ({ message, theme, onReact, currentUser, deleteMessage }) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showReactions, setShowReactions] = useState(false)
    const [showOptions, setShowOptions] = useState(false)

    const emojiPickerRef = useRef(null)
    const reactionsMenuRef = useRef(null)
    const optionsRef = useRef(null)

    const isUserMessage = message.sender._id === currentUser?._id
    const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

    const bubbleContentClass = isUserMessage
        ? `chat-bubble md:max-w-[50%] min-w-[130px] ${theme === 'dark' ? "bg-[#144d38] text-white" : "bg-[#d9fdd3] text-black"}`
        : `chat-bubble md:max-w-[50%] min-w-[130px] bg-white text-black`

    const handleReact = (emoji) => {
        onReact(message._id, emoji)
        setShowEmojiPicker(false)
        setShowReactions(false)
    }

    useOutsideclick(emojiPickerRef, () => showEmojiPicker && setShowEmojiPicker(false))
    useOutsideclick(reactionsMenuRef, () => showReactions && setShowReactions(false))
    useOutsideclick(optionsRef, () => showOptions && setShowOptions(false))

    if (!message) return null

    return (
        <div className={`flex mb-6 ${isUserMessage ? "justify-end" : "justify-start"}`}>
            <div className={`${bubbleContentClass} relative group`}>

                {/* MESSAGE CONTENT */}
                {message.contentType === 'text' && (
                    <p className="mb-5 pr-6 wrap-break-word">{message.content}</p>
                )}

                {message.contentType === 'image' && (
                    <div className="mb-5">
                        <img src={message.imageOrVideoUrl} alt="media" className="rounded-lg max-w-xs" />
                        <p className="mt-1 pr-6 wrap-break-word">{message.content}</p>
                    </div>
                )}

                {/* TIME + STATUS */}
                <div className="absolute bottom-1 right-2 flex items-center gap-1 text-xs opacity-60">
                    <span>{format(new Date(message.createdAt), "HH:mm")}</span>
                    {isUserMessage && (
                        <>
                            {message.messageStatus === 'sent' && <FaCheck size={12} />}
                            {message.messageStatus === 'delivered' && <FaCheckDouble size={12} />}
                            {message.messageStatus === 'read' && <FaCheckDouble size={12} className="text-blue-900" />}
                        </>
                    )}
                </div>

                {/* OPTIONS (⋮) */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition z-20">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowOptions(!showOptions)
                            setShowReactions(false)
                            setShowEmojiPicker(false)
                        }}
                        className={`p-1 rounded-full ${theme === 'dark' ? "text-white" : "text-gray-800"}`}
                    >
                        <HiDotsVertical size={18} />
                    </button>
                </div>

                {/* 😊 SMILE BUTTON + QUICK REACTIONS */}
                <div
                    className={`absolute ${isUserMessage ? "-left-10" : "-right-10"} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition`}
                >
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowOptions(false)
                                setShowReactions(!showReactions)
                            }}
                            className={`p-2 rounded-full shadow-lg ${theme === "dark" ? "bg-[#202c33]" : "bg-white"}`}
                        >
                            <FaSmile className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`} />
                        </button>

                        {showReactions && (
                            <div
                                ref={reactionsMenuRef}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center bg-[#202c33]/90 rounded-full px-2 py-1.5 gap-1 shadow-lg z-50"
                            >
                                {quickReactions.map((emoji, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleReact(emoji)}
                                        className="hover:scale-125 transition p-1"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                                <div className="w-px h-5 bg-gray-600 mx-1" />
                                <button onClick={() => setShowEmojiPicker(true)} className="p-1">
                                    <FaPlus className="text-gray-300" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 😀 EMOJI PICKER */}
                {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="absolute left-0 -top-96 z-50">
                        <div className="relative">
                            <EmojiPicker
                                theme={theme}
                                onEmojiClick={(emojiObject) => handleReact(emojiObject.emoji)}
                            />
                            <button
                                onClick={() => setShowEmojiPicker(false)}
                                className="absolute top-2 right-2"
                            >
                                <RxCross2 />
                            </button>
                        </div>
                    </div>
                )}

                {/* ✅ REACTION DISPLAY */}
                {message.reactions && message.reactions.length > 0 && (
                    <div
                        className={`absolute -bottom-5.5 ${isUserMessage ? "right-2" : "left-2"} ${theme === 'dark' ? "bg-[#2a3942]" : "bg-gray-200"} rounded-full px-2 py-1 shadow-md flex gap-1 text-sm z-10`}
                    >
                        {message.reactions.map((reaction, index) => (
                            <span key={index}>{reaction.emoji}</span>
                        ))}
                    </div>
                )}

                {/* OPTIONS MENU */}
                {showOptions && (
                    <div
                        ref={optionsRef}
                        className={`absolute top-8 right-1 z-50 w-44 rounded-xl shadow-lg py-2.5 text-sm ${theme === 'dark' ? "bg-[#1d1f1f] text-white" : "bg-gray-100 text-black"}`}
                    >
                        <button
                            onClick={() => {
                                if (message.contentType === 'text') {
                                    navigator.clipboard.writeText(message.content)
                                }
                                setShowOptions(false)
                            }}
                            className={`flex items-center w-full px-5 py-2.5 gap-3 rounded-lg transition-colors ${theme === 'dark' ? "hover:bg-[#2a2d2e]" : "hover:bg-gray-200"}`}
                        >
                            <FaRegCopy size={15} />
                            <span>Copy</span>
                        </button>

                        {isUserMessage && (
                            <button
                                onClick={() => {
                                    deleteMessage(message?._id)
                                    setShowOptions(false)
                                }}
                                className="flex items-center w-full px-5 py-2.5 gap-3 rounded-lg text-red-600 transition-colors hover:bg-red-50"
                            >
                                <FaRegTrashAlt size={15} />
                                <span>Delete</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MessageBubble