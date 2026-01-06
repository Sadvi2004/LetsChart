import React from "react"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from "./pages/user-login/Login"
import MainPage from "./pages/MainPage"
import { NotFound } from "./pages/NotFound"
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path='/user-login' element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App