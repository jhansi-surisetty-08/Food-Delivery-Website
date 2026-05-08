import { Server } from "socket.io";
import orderModel from "./models/orderModel.js";

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("order:join", (orderId) => {
      if (orderId) socket.join(orderId);
    });

    socket.on("order:leave", (orderId) => {
      if (orderId) socket.leave(orderId);
    });

    socket.on("driver:location", async (payload) => {
      try {
        const { orderId, lat, lng, etaMinutes } = payload || {};
        if (!orderId || typeof lat !== "number" || typeof lng !== "number") return;

        const update = {
          deliveryLocation: { lat, lng },
        };
        if (typeof etaMinutes === "number") {
          update.etaMinutes = etaMinutes;
        }

        const order = await orderModel.findByIdAndUpdate(
          orderId,
          { $set: update },
          { new: true }
        );

        if (order) {
          io.to(orderId).emit("order:update", order);
        }
      } catch (error) {
        console.log(error);
      }
    });
  });

  return io;
};

const getIO = () => io;

export { initSocket, getIO };
