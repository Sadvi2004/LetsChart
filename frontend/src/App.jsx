import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/user-login/Login";
import HomePage from "./components/HomePage";
import UserDetails from "./components/UserDetails";
import Status from "./pages/StatusSection/Status";
import Setting from "./pages/SettingSection/Setting";
import { NotFound } from "./pages/NotFound";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { ProtectedRoute, PublicRoute } from "./Protected";

import useUserStore from "./store/useUserStore";

import {
  initializeSocket,
} from "./services/chat.service";

import { useChatStore } from "./store/chatStore";

function App() {
  const { user } = useUserStore();

  const {
    setCurrentUser,
    initsocketListeners,
  } = useChatStore();

  useEffect(() => {
    if (user?._id) {

      // initialize socket
      const socket = initializeSocket();

      if (socket) {
        // store current user
        setCurrentUser(user);

        // initialize listeners
        initsocketListeners();
      }
    }

  }, [user]);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
      />

      <Router>
        <Routes>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/user-profile" element={<UserDetails />} />
            <Route path="/status" element={<Status />} />
            <Route path="/setting" element={<Setting />} />
          </Route>

          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<Login />} />
          </Route>

          {/* Not Found */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Router>
    </>
  );
}

export default App;