// import React, { useEffect, useState } from 'react';
// import { useLocation } from 'react-router-dom';
// import useLayoutStore from '../store/layoutStore';
// import useThemeStore from '../store/themeStore';
// import Sidebar from './Sidebar';
// import { motion, AnimatePresence } from 'framer-motion';
// import ChatWindow from "../pages/chatSection/ChatWindow";

// const Layout = ({ children, isThemeDialogOpen, toggleThemeDialog, isStatusPreviewOpen, statusPreviewContent }) => {
//     const selectedContact = useLayoutStore((state) => state.selectedContact);
//     const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
//     const location = useLocation();
//     const [isMobile, setIsMobile] = useState(window.innerWidth < 760);
//     const { theme, setTheme } = useThemeStore();

//     useEffect(() => {
//         const handleResize = () => {
//             setIsMobile(window.innerWidth < 760);
//         };
//         window.addEventListener('resize', handleResize);
//         return () => {
//             window.removeEventListener('resize', handleResize);
//         };
//     }, []);

//     return (
//         <div className={`min-h-screen ${theme === 'dark' ? "bg-[#111b21] text-white" : "bg-gray-100 text-black"} flex relative`}>
//             {!isMobile && <Sidebar />}
//             <div className={`flex-1 flex overflow-hidden ${isMobile ? "flex-col" : ""}`}>
//                 <AnimatePresence initial={false}>
//                     {(!selectedContact || !isMobile) && (
//                         <motion.div
//                             key="chatList"
//                             initial={{ x: isMobile ? "-100" : 0 }}
//                             animate={{ x: 0 }}
//                             exit={{ x: "-100" }}
//                             transition={{ type: "tween" }}
//                             className={`w-full md:w-2/5 h-full ${isMobile ? "pb-16" : ""}`}
//                         >
//                             {children}
//                         </motion.div>
//                     )}

//                     {(selectedContact || !isMobile) && (
//                         <motion.div
//                             key="chatWindow"
//                             initial={{ x: isMobile ? "-100" : 0 }}
//                             animate={{ x: 0 }}
//                             exit={{ x: "-100" }}
//                             transition={{ type: "tween" }}
//                             className="w-full h-full"
//                         >
//                             <ChatWindow contact={selectedContact} setSelectedContact={setSelectedContact} isMobile={isMobile} />
//                         </motion.div>
//                     )}
//                 </AnimatePresence>
//             </div>
//             {isMobile && <Sidebar />}

//             {isThemeDialogOpen && (
//                 <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
//                     <div className={`${theme === 'dark' ? "bg-[#202c33] text-white" : "bg-white text-black"} p-6 rounded-lg shadow-lg max-w-sm w-full`}>
//                         <h2 className='text-2xl font-semibold mb-4'>
//                             Choose a theme
//                         </h2>
//                         <div className='space-y-4'>
//                             <label className='flex items-center space-x-3 cursor-pointer'>
//                                 <input type='radio' value='light' checked={theme === 'light'} onChange={() => setTheme('light')} className='from-radio text-blue-600' />
//                                 <span>Light</span>
//                             </label>

//                             <label className='flex items-center space-x-3 cursor-pointer'>
//                                 <input type='radio' value='dark' checked={theme === 'dark'} onChange={() => setTheme('dark')} className='from-radio text-blue-600' />
//                                 <span>Dark</span>
//                             </label>
//                         </div>
//                         <button onClick={toggleThemeDialog}
//                             className='mt-6 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-200'
//                         >
//                             Close
//                         </button>
//                     </div>
//                 </div>
//             )}
//             {/* Status Preview */}
//             {isStatusPreviewOpen && (
//                 <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
//                     {statusPreviewContent}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default Layout;


import React, { useEffect, useState } from "react";
import useLayoutStore from "../store/layoutStore";
import useThemeStore from "../store/themeStore";
import Sidebar from "./Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import ChatWindow from "../pages/chatSection/ChatWindow";

const Layout = ({
    children,
    isThemeDialogOpen,
    toggleThemeDialog,
    isStatusPreviewOpen,
    statusPreviewContent,
}) => {

    const selectedContact = useLayoutStore(
        (state) => state.selectedContact
    );

    const setSelectedContact = useLayoutStore(
        (state) => state.setSelectedContact
    );

    const { theme, setTheme } = useThemeStore();

    const [isMobile, setIsMobile] = useState(false);

    // detect mobile properly
    useEffect(() => {

        const checkScreen = () => {
            setIsMobile(window.innerWidth < 760);
        };

        checkScreen();

        window.addEventListener("resize", checkScreen);

        return () => {
            window.removeEventListener("resize", checkScreen);
        };

    }, []);

    return (
        <div
            className={`
                min-h-screen flex overflow-hidden relative
                ${theme === "dark"
                    ? "bg-[#111b21] text-white"
                    : "bg-gray-100 text-black"
                }
            `}
        >

            {/* Desktop Sidebar */}
            {!isMobile && <Sidebar />}

            <div className="flex-1 flex overflow-hidden">

                {/* Chat List */}
                {(!selectedContact || !isMobile) && (
                    <motion.div
                        initial={{ x: isMobile ? "-100%" : 0 }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ duration: 0.25 }}
                        className={`
                            h-screen
                            ${isMobile ? "w-full" : "w-100"}
                            border-r
                            ${theme === "dark"
                                ? "border-gray-700"
                                : "border-gray-300"
                            }
                        `}
                    >
                        {children}
                    </motion.div>
                )}

                {/* Chat Window */}
                <AnimatePresence>

                    {selectedContact && (
                        <motion.div
                            key={selectedContact._id}
                            initial={{ x: isMobile ? "100%" : 0 }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ duration: 0.25 }}
                            className="flex-1 h-screen"
                        >
                            <ChatWindow
                                contact={selectedContact}
                                setSelectedContact={setSelectedContact}
                                isMobile={isMobile}
                            />
                        </motion.div>
                    )}

                </AnimatePresence>

                {/* Empty State */}
                {!selectedContact && !isMobile && (

                    <div
                        className={`
                            flex-1 flex flex-col items-center justify-center
                            ${theme === "dark"
                                ? "bg-[#0b141a]"
                                : "bg-[#f0f2f5]"
                            }
                        `}
                    >

                        <img
                            src="https://cdn-icons-png.flaticon.com/512/1041/1041916.png"
                            alt="chat"
                            className="w-32 opacity-60 mb-5"
                        />

                        <h1 className="text-3xl font-semibold mb-2">
                            Welcome to Let'sChat
                        </h1>

                        <p className="text-gray-500 text-center max-w-md">
                            Select a conversation to start chatting with your friends in real time.
                        </p>

                    </div>
                )}

            </div>

            {/* Mobile Sidebar */}
            {isMobile && <Sidebar />}

            {/* Theme Dialog */}
            {isThemeDialogOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

                    <div
                        className={`
                            p-6 rounded-2xl w-[90%] max-w-sm shadow-xl
                            ${theme === "dark"
                                ? "bg-[#202c33] text-white"
                                : "bg-white text-black"
                            }
                        `}
                    >

                        <h2 className="text-2xl font-semibold mb-6">
                            Choose Theme
                        </h2>

                        <div className="space-y-4">

                            <label className="flex items-center gap-3 cursor-pointer">

                                <input
                                    type="radio"
                                    value="light"
                                    checked={theme === "light"}
                                    onChange={() => setTheme("light")}
                                />

                                <span>Light</span>

                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">

                                <input
                                    type="radio"
                                    value="dark"
                                    checked={theme === "dark"}
                                    onChange={() => setTheme("dark")}
                                />

                                <span>Dark</span>

                            </label>

                        </div>

                        <button
                            onClick={toggleThemeDialog}
                            className="mt-6 w-full py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition"
                        >
                            Close
                        </button>

                    </div>

                </div>
            )}

            {/* Status Preview */}
            {isStatusPreviewOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
                    {statusPreviewContent}
                </div>
            )}

        </div>
    );
};

export default Layout;