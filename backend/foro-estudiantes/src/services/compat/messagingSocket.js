/**
 * WebSocket para mensajería en vivo y estado "visto"
 */
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "lumina-secret-dev";

// userId -> Set de socketIds (un usuario puede tener varias pestañas)
const userSockets = new Map();

function getUserIdFromSocket(socket) {
  const token = socket.handshake?.auth?.token;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
}

function registerUserSocket(userId, socketId) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(socketId);
}

function unregisterUserSocket(userId, socketId) {
  if (userSockets.has(userId)) {
    userSockets.get(userId).delete(socketId);
    if (userSockets.get(userId).size === 0) userSockets.delete(userId);
  }
}

function getSocketIdsForUser(userId) {
  return userSockets.get(userId) || new Set();
}

function setupIO(io) {
  io.use((socket, next) => {
    const userId = getUserIdFromSocket(socket);
    if (!userId) return next(new Error("No autorizado"));
    socket.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    registerUserSocket(userId, socket.id);

    socket.on("join-conversation", (conversationId) => {
      socket.join(`conv-${conversationId}`);
    });

    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conv-${conversationId}`);
    });

    socket.on("disconnect", () => {
      unregisterUserSocket(userId, socket.id);
    });
  });

  return io;
}

let ioInstance = null;

module.exports = {
  setupMessagingSocket(io) {
    ioInstance = io;
    return setupIO(io);
  },
  emitNewMessage(conversationId, message, recipientUserId) {
    if (ioInstance) {
      ioInstance.to(`conv-${conversationId}`).emit("new-message", message);
      const recipientSockets = userSockets.get(recipientUserId);
      if (recipientSockets?.size > 0) {
        ioInstance.to(Array.from(recipientSockets)).emit("conv-update", { conversationId, lastMessage: message });
      }
    }
  },
  emitMessagesSeen(conversationId, messageIds, seenByUserId) {
    if (ioInstance) {
      ioInstance.to(`conv-${conversationId}`).emit("messages-seen", { messageIds, seenByUserId });
    }
  }
};
