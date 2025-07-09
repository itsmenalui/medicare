import axios from "axios";

// Create a new Axios instance with a custom configuration
const api = axios.create({
  // This sets the base URL for every single API request
  baseURL: "http://localhost:5001/api",
});

// You can also add interceptors here in the future to automatically
// add authentication tokens to every request.

export default api;
