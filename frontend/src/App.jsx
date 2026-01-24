import React, { useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/user-login/Login";
import HomePage from "./components/HomePage";
import UserDetails from "./components/UserDetails";
import Status from "./pages/StatusSection/Status";
import Setting from "./pages/SettingSection/Setting";
import { NotFound } from "./pages/NotFound";
import { ToastContainer } from "react-toastify";
import { ProtectedRoute, PublicRoute } from "./Protected";
import useUserStore from "./store/useUserStore";
import { initializeSocket, disconnectSocket } from "./services/chat.service";
import { useChatStore } from "./store/chatStore";

function App() {
  const { user } = useUserStore();
  const { setCurrentUser, initsocketListeners, cleanup } = useChatStore();
  // const socketInitialized = useRef(false);

  useEffect(() => {
    //   if (user?._id && !socketInitialized.current) {
    //     initializeSocket();
    //     socketInitialized.current = true;
    //   }

    //   if (!user?._id && socketInitialized.current) {
    //     disconnectSocket();
    //     socketInitialized.current = false;
    //   }
    // }, [user?._id]);

    if (user?._id) {
      const socket = initializeSocket();

      if (socket) {
        setCurrentUser(user);

        initsocketListeners();
      }
    }
    return () => {
      cleanup();
      disconnectSocket();
    }
  }, [user, setCurrentUser, initsocketListeners, cleanup])

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/user-profile" element={<UserDetails />} />
            <Route path="/status" element={<Status />} />
            <Route path="/setting" element={<Setting />} />
          </Route>
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<Login />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;