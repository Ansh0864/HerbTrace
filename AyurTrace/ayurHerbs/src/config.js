// src/config.js
const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:8000" 
  : "https://herbtrace.onrender.com";

export default API_BASE_URL;