// backend/config/socket.js
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

const initSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io/",
  });

  // Middleware to authenticate Socket.IO connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.error("Socket.IO Auth Error: No token provided");
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      // Verify the token (adjust the secret to match your auth setup)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Attach user data to socket
      console.log(`Socket.IO Auth Success: User ${decoded.id} connected`);
      next();
    } catch (error) {
      console.error("Socket.IO Auth Error:", error.message);
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id, "User ID:", socket.user?.id);

    socket.on("joinGroup", (groupId) => {
      socket.join(groupId);
      console.log(
        `User ${socket.id} (ID: ${socket.user?.id}) joined group ${groupId}`
      );
    });

    socket.on("sendMessage", (data) => {
      console.log(
        `Message sent to group ${data.groupId} by user ${socket.user?.id}:`,
        data
      );
      io.to(data.groupId).emit("newMessage", data);
    });

    socket.on("deleteMessage", (data) => {
      console.log(
        `Message ${data.messageId} deleted in group ${data.groupId} by user ${socket.user?.id}`
      );
      io.to(data.groupId).emit("messageDeleted", data.messageId);
    });

    socket.on("reactToMessage", (data) => {
      console.log(
        `Reaction on message ${data.messageId} in group ${data.groupId} by user ${socket.user?.id}:`,
        data
      );
      io.to(data.groupId).emit("messageReacted", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id, "User ID:", socket.user?.id);
    });

    socket.on("error", (error) => {
      console.error("Socket.IO Error:", error.message);
    });
  });

  return io;
};

module.exports = initSocket;
