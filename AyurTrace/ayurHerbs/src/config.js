// src/config.js
const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:8000" 
  : "https://ayurtrace-backend.onrender.com";

export default API_BASE_URL;