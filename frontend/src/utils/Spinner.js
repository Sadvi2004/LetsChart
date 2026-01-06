import React from 'react';
import { motion } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';

export default function Spinner({ size = 'medium', color = 'light', showText = true }) {
    const sizeClasses = {
        small: 'w-4 h-4',
        medium: 'w-6 h-6',
        large: 'w-8 h-8',
    };

    const colorClasses = {
        light: 'text-white',
        dark: 'text-gray-800',
    };

    return (
        <div className="flex items-center justify-center space-x-2">
            <motion.div
                role="status"
                aria-label="Loading"
                className={`${sizeClasses[size]} ${colorClasses[color]} inline-flex`}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            >
                <FaSpinner className="w-full h-full" />
            </motion.div>
            {showText && (
                <span className={`${colorClasses[color]} text-md font-medium`}>
                    Loading...
                </span>
            )}
        </div>
    );
}