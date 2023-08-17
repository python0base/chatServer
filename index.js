const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const socket = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);
const io = socket(server, {
  cors: {
    // origin: "http://localhost:3000",
    origin: "https://chat-web-seven.vercel.app:3000",

    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  // const users = new Map();

  global.chatSocket = socket;

  socket.on("add-user", (userid) => {
    onlineUsers.set(userid, socket.id);
    const obj = [...onlineUsers.entries()].reduce(
      (obj, [key, value]) => ((obj[key] = value), obj),
      {}
    );
    socket.broadcast.emit("users", obj);
  });
  socket.on("online", (data) => {
    const obj = [...onlineUsers.entries()].reduce(
      (obj, [key, value]) => ((obj[key] = value), obj),
      {}
    );

    console.log(onlineUsers, "1212");
    socket.emit("users", obj);
  });
  socket.on("offline", (id) => {
    const obj = [...onlineUsers.entries()]
      .filter((item, index) => {
        if (index != id) return item;
      })
      .reduce((obj, [key, value]) => ((obj[key] = value), obj), {});
    console.log(onlineUsers);
    socket.broadcast.emit("users", obj);
  });

  // socket.broadcast.emit("user connected", {
  //   // userID: user._id,
  //   username: socket,
  // });

  socket.on("send-msg", (data) => {
    //在线用户才需要发送请求
    const sendUserSocket = onlineUsers.get(data.to);
    console.log(onlineUsers, "onlineUsers");

    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
