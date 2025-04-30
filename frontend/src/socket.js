// frontend/src/socket.js
import io from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : "https://studyhive-backend.onrender.com";

const socket = io(API_URL, {
  withCredentials: true,
  auth: { token: localStorage.getItem("token") },
  path: "/socket.io/",
});

socket.on("connect", () => console.log("Connected to Socket.IO"));
socket.on("connect_error", (err) =>
  console.error("Socket.IO Error:", err.message)
);

export default socket;
