import axios from "axios";

const apiUrl = "https://letschart-2.onrender.com/api";

const axiosInstance = axios.create({
    baseURL: apiUrl,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add token automatically
axiosInstance.interceptors.request.use(
    (config) => {

        const token = localStorage.getItem("auth_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {

        if (error.response) {

            // Unauthorized
            if (error.response.status === 401) {
                console.error("Unauthorized Access");
            }

            // Internal server error
            if (error.response.status === 500) {
                console.error("Server Error");
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;