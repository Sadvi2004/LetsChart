import React, { useEffect, useState } from 'react'
import useThemeStore from '../../store/themeStore'
import useUserStore from '../../store/useUserStore'
import useStatusStore from '../../store/useStatusStore'
import Layout from '../../components/Layout'
import StatusPreview from './StatusPreview'
import { motion } from "framer-motion"
import { RxCross2 } from 'react-icons/rx'
import { FaCamera, FaEllipsisH, FaPlus } from 'react-icons/fa'
import formatTimestamp from "../../utils/formatTime"
import StatusList from './StatusList'

const Status = () => {
    const [previewContact, setPreviewContact] = useState(null)
    const [currentStatusIndex, setCurrentStatusIndex] = useState(0)
    const [showOption, setShowOption] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [showCreateModel, setShowCreateModel] = useState(false)
    const [newStatus, setNewStatus] = useState("")
    const [filePreview, setFilePreview] = useState(null)

    const { theme } = useThemeStore()
    const { user } = useUserStore()

    const {
        statuses,
        loading,
        error,
        fetchStatuses,
        createStatus,
        viewStatus,
        deleteStatus,
        getUserStatuses,
        getOtherStatuses,
        clearError,
        initializeSocket,
        cleanupSocket
    } = useStatusStore()

    const userStatus = getUserStatuses(user?._id)
    const otherStatus = getOtherStatuses(user?._id)

    useEffect(() => {
        if (!user?._id) return
        fetchStatuses()
        initializeSocket()
        return () => cleanupSocket()
    }, [user?._id])

    useEffect(() => {
        return () => clearError()
    }, [])

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setSelectedFile(file)
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
            setFilePreview(URL.createObjectURL(file))
        }
    }

    const handleCreateStatus = async () => {
        if (!newStatus.trim() && !selectedFile) return
        await createStatus({ content: newStatus, file: selectedFile })
        setNewStatus("")
        setSelectedFile(null)
        setFilePreview(null)
        setShowCreateModel(false)
    }

    const handlePreviewClose = () => {
        setPreviewContact(null)
        setCurrentStatusIndex(0)
    }

    const handlePreviewNext = () => {
        if (!previewContact) return
        if (currentStatusIndex < previewContact.statuses.length - 1) {
            setCurrentStatusIndex(prev => prev + 1)
        } else {
            handlePreviewClose()
        }
    }

    const handlePreviewPrev = () => {
        setCurrentStatusIndex(prev => Math.max(prev - 1, 0))
    }

    const handleStatusPreview = (contact, index = 0) => {
        setPreviewContact(contact)
        setCurrentStatusIndex(index)
        if (contact?.statuses[index]) {
            viewStatus(contact.statuses[index].id)
        }
    }

    return (
        <Layout
            isStatusPreviewOpen={!!previewContact}
            statusPreviewContent={
                previewContact && (
                    <StatusPreview
                        contact={previewContact}
                        currentIndex={currentStatusIndex}
                        onClose={handlePreviewClose}
                        onNext={handlePreviewNext}
                        onPrev={handlePreviewPrev}
                        onDelete={deleteStatus}
                        theme={theme}
                        currentUser={user}
                        loading={loading}
                    />
                )
            }
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`flex-1 h-screen border-r ${theme === "dark"
                    ? "bg-[rgb(12,19,24)] text-white border-gray-600"
                    : "bg-gray-100 text-black"
                    }`}
            >
                {/* Header */}
                <div
                    className={`flex justify-between items-center shadow-md p-4 ${theme === "dark" ? "bg-[rgb(17,27,33)]" : "bg-white"
                        }`}
                >
                    <h2 className="text-2xl font-bold">Status</h2>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-2">
                        <span>{error}</span>
                        <button onClick={clearError} className="float-right">
                            <RxCross2 />
                        </button>
                    </div>
                )}

                <div className="overflow-y-auto h-[calc(100vh-64px)]">

                    {/* My Status */}
                    <div className="flex p-3 space-x-4 shadow-md">
                        <div
                            className="relative cursor-pointer"
                            onClick={() =>
                                userStatus
                                    ? handleStatusPreview(userStatus)
                                    : setShowCreateModel(true)
                            }
                        >
                            <img
                                src={user?.profilePicture}
                                className="w-12 h-12 rounded-full object-cover"
                            />

                            <button
                                className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowCreateModel(true)
                                }}
                            >
                                <FaPlus className="h-2 w-2" />
                            </button>
                        </div>

                        <div className="flex-1">
                            <p className="font-semibold">My Status</p>
                            <p className="text-sm">
                                {userStatus ? (
                                    <>
                                        {userStatus.statuses.length} status
                                        {userStatus.statuses.length > 1} •{" "}
                                        {formatTimestamp(userStatus.statuses[0].timestamp)}
                                    </>
                                ) : (
                                    "Tap to add status update"
                                )}
                            </p>
                        </div>

                        {userStatus && (
                            <button onClick={() => setShowOption(!showOption)}>
                                <FaEllipsisH />
                            </button>
                        )}
                    </div>

                    {/* Options */}
                    {showOption && userStatus && (
                        <div className="p-2 shadow-md">
                            <button
                                className="w-full text-left py-2 flex items-center"
                                onClick={() => {
                                    setShowCreateModel(true)
                                    setShowOption(false)
                                }}
                            >
                                <FaCamera className="mr-2" />
                                Add Status
                            </button>

                            <button
                                className="w-full text-left py-2"
                                onClick={() => {
                                    handleStatusPreview(userStatus)
                                    setShowOption(false)
                                }}
                            >
                                View Status
                            </button>
                        </div>
                    )}

                    {/* Loader */}
                    {loading && (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin h-8 w-8 border-b-2 border-green-500 rounded-full" />
                        </div>
                    )}

                    {/* Other Status */}
                    {!loading && otherStatus.length > 0 && (
                        <div className="p-4 space-y-4 mt-4">
                            <h3 className="font-semibold">Recent Updates</h3>
                            {otherStatus.map((contact, index) => (
                                <React.Fragment key={contact.id}>
                                    <StatusList
                                        contact={contact}
                                        onPreview={() => handleStatusPreview(contact)}
                                        theme={theme}
                                    />
                                    {index < otherStatus.length - 1 && <hr />}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && statuses.length === 0 && (
                        <div className="flex flex-col items-center p-8 text-center">
                            <div className="text-6xl mb-4">📱</div>
                            <h3 className="text-lg font-semibold">No Status Updates</h3>
                            <p className="text-sm">Be the first to share a status</p>
                        </div>
                    )}
                </div>

                {/* Create Status Modal */}
                {showCreateModel && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg max-w-md w-full">
                            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? "text-black" : "text-black"}`}>Create Status</h3>

                            {filePreview && (
                                <img
                                    src={filePreview}
                                    className="w-full h-32 object-cover rounded mb-4"
                                />
                            )}

                            <textarea
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                placeholder="What's on your mind?"
                                className={`w-full border p-3 rounded mb-4 ${theme === 'dark' ? "bg-gray-200 border-gray-400 text-black" : "text-black"}`}
                            />

                            <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className={`mb-4 ${theme === 'dark' ? "text-gray-500" : "text-gray-400"}`}
                            />

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowCreateModel(false)}
                                    className="px-4 py-2 bg-gray-300 rounded cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateStatus}
                                    className="px-4 py-2 bg-green-500 text-white rounded cursor-pointer"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </Layout>
    )
}

export default Status