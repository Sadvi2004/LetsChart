import React from 'react';
import { Link } from 'react-router-dom';
import errorPage from "../assets/NotFound.png";

export const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full h-screen bg-gray-100 text-center">
            <img
                src={errorPage}
                alt="Page Not Found"
                className="w-1/2 max-w-md mb-6 object-contain"
            />
            <p className="text-gray-700 mb-6 font-semibold">
                Oops! The page you’re looking for doesn’t exist.
            </p>
            <Link
                to="/user-login"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                Go Back Home
            </Link>
        </div>
    );
};