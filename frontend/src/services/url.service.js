// import axios from "axios";

// // const apiUrl = `${import.meta.env.VITE_API_URL}/api`;
// const apiUrl = `https://letschart-2.onrender.com/api`;

// const getToken = () => localStorage.getItem("auth_token")

// const axiosInstance = axios.create({
//     baseURL: apiUrl,
//     withCredentials: true,
// });

// axiosInstance.interceptors.request.use((config) => {
//     const token = getToken();
//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`
//     }
//     return config;
// })

// export default axiosInstance;

import axios from "axios";

const apiUrl = `https://letschart-2.onrender.com/api`;

const axiosInstance = axios.create({
    baseURL: apiUrl,
    withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default axiosInstance;