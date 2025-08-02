import axios from "axios";

// Create a new Axios instance with a custom configuration
const api = axios.create({
  // ✅ This now uses an environment variable for the base URL.
  baseURL: import.meta.env.VITE_API_URL,
});

// You can also add interceptors here in the future to automatically
// add authentication tokens to every request.

export default api;
