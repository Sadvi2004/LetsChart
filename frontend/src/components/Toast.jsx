import React from "react";
import { motion } from "framer-motion";
import { FaCheckCircle, FaTimes } from "react-icons/fa";

export default function Toast({ message, onClose }) {
    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed top-6 right-6 z-50 bg-white rounded-xl shadow-lg flex items-center gap-3 px-4 py-3 border-l-4 border-green-500"
        >
            <FaCheckCircle className="text-green-500 text-xl" />

            <div>
                <p className="font-semibold text-gray-800">Success</p>
                <p className="text-sm text-gray-500">{message}</p>
            </div>

            <button onClick={onClose}>
                <FaTimes className="text-gray-400" />
            </button>
        </motion.div>
    );
}