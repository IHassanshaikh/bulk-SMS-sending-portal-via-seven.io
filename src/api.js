import axios from "axios";

// export const API = "https://sms-backend-2-rcw0.onrender.com/api";
// export const API = "http://localhost:5000/api";
// export const API = "http://66.29.142.135:3002/api";
export const API = "https://api.teachers-corner.com/api";

// Custom Event Dispatcher
const triggerLoader = (show) => {
    const event = new CustomEvent("loader-change", { detail: show });
    window.dispatchEvent(event);
};

// Add a request interceptor
axios.interceptors.request.use(
    (config) => {
        triggerLoader(true); // Show Loader
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        triggerLoader(false); // Hide Loader
        return Promise.reject(error);
    }
);

// Add a response interceptor
axios.interceptors.response.use(
    (response) => {
        triggerLoader(false); // Hide Loader
        return response;
    },
    (error) => {
        triggerLoader(false); // Hide Loader

        // Handle 401 (Unauthorized) or Network Error (Backend Down)
        if (error.response && error.response.status === 401) {
            console.warn("Session expired or unauthorized. Logging out.");
            localStorage.removeItem("token");
            window.location.href = "/login";
        } else if (!error.response && error.code === "ERR_NETWORK") {
            // Backend is probably down
            console.error("Network Error: Backend might be down.");
            alert("Connection lost. Please check your internet or try again later.");
            // Optional: Logout on network error too?
            // localStorage.removeItem("token");
            // window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);
