const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Serve Static Assets in Production
if (process.env.NODE_ENV === "production") {
    const path = require("path");
    app.use(express.static(path.join(__dirname, "../client/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../client/dist", "index.html"));
    });
}


// Database Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log(err));

// Socket.IO Logic
const users = {}; // Map socket.id -> user_id
const socketToRoom = {}; // Map socket.id -> room_id (if we assume usage of rooms) or just track online users

// We will track online users: userId -> socketId
const onlineUsers = new Map();

io.on("connection", (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    socket.on("join", (userId) => {
        // Map socket.id -> userId
        onlineUsers.set(socket.id, userId);

        // Broadcast all unique online user IDs
        const onlineUserIds = Array.from(new Set(onlineUsers.values()));
        io.emit("getOnlineUsers", onlineUserIds);
        console.log(`User ${userId} came online (Socket: ${socket.id})`);
    });

    socket.on("disconnect", () => {
        const userId = onlineUsers.get(socket.id);
        if (userId) {
            onlineUsers.delete(socket.id);

            // Broadcast updated list
            const onlineUserIds = Array.from(new Set(onlineUsers.values()));
            io.emit("getOnlineUsers", onlineUserIds);
            console.log(`User ${userId} disconnected (Socket: ${socket.id})`);
        }
    });

    // Call Signaling
    socket.on("callUser", ({ userToCall, signalData, from, name }) => {
        // Find the socket ID(s) associated with the userToCall
        // Since we map socket.id -> userId, we need to find the socket.id where value === userToCall
        const socketId = [...onlineUsers.entries()]
            .find(([key, val]) => val === userToCall)?.[0];

        if (socketId) {
            io.to(socketId).emit("callUser", { signal: signalData, from, name });
        }
    });

    socket.on("answerCall", (data) => {
        // data.to is presumably the caller's USER ID. 
        // Note: In Dashboard.jsx, `answerCall` emits `to: caller`. 
        // `caller` state in Dashboard is set from `data.from` in `callUser` event.
        // `data.from` in `callUser` event comes from `user._id` (User ID).
        // So `data.to` is a User ID. We need to find the socket again.

        const socketId = [...onlineUsers.entries()]
            .find(([key, val]) => val === data.to)?.[0];

        if (socketId) {
            io.to(socketId).emit("callAccepted", data.signal);
        }
    });

    socket.on("rejectCall", (data) => {
        const socketId = [...onlineUsers.entries()]
            .find(([key, val]) => val === data.to)?.[0];

        if (socketId) {
            io.to(socketId).emit("callRejected");
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Trigger restart for port change
