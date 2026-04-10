const ChatMessage = require("../models/chatMessageModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const fs = require("fs");
const { uploadToCloudinary } = require("../services/fileUploadService");

const getChatUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("name email isOnline lastActivity")
      .populate("role", "name")
      .lean();

    const unreadCounts = await ChatMessage.aggregate([
      { $match: { receiver: new mongoose.Types.ObjectId(currentUserId), read: false } },
      { $group: { _id: "$sender", count: { $sum: 1 } } },
    ]);

    const unreadMap = {};
    unreadCounts.forEach((u) => {
      unreadMap[u._id.toString()] = u.count;
    });

    const lastMessages = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(currentUserId) },
            { receiver: new mongoose.Types.ObjectId(currentUserId) },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(currentUserId)] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $first: "$content" },
          lastMessageAt: { $first: "$createdAt" },
        },
      },
    ]);

    const lastMsgMap = {};
    lastMessages.forEach((m) => {
      lastMsgMap[m._id.toString()] = {
        lastMessage: m.lastMessage,
        lastMessageAt: m.lastMessageAt,
      };
    });

    const enriched = users.map((u) => ({
      ...u,
      unreadCount: unreadMap[u._id.toString()] || 0,
      lastMessage: lastMsgMap[u._id.toString()]?.lastMessage || "",
      lastMessageAt: lastMsgMap[u._id.toString()]?.lastMessageAt || null,
    }));

    enriched.sort((a, b) => {
      if (a.lastMessageAt && b.lastMessageAt) {
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      }
      if (a.lastMessageAt) return -1;
      if (b.lastMessageAt) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json(enriched);
  } catch (error) {
    console.error("getChatUsers error:", error);
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { otherUserId } = req.params;

    const messages = await ChatMessage.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate({
        path: "replyTo",
        select: "content fileName fileUrl fileType sender",
        populate: { path: "sender", select: "name" },
      })
      .lean();

    await ChatMessage.updateMany(
      { sender: otherUserId, receiver: currentUserId, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ message: "Failed to fetch messages", error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { receiver, content, replyTo } = req.body;
    const file = req.file;

    if (!receiver) {
      return res.status(400).json({ message: "Receiver required" });
    }
    if ((!content || !content.trim()) && !file) {
      return res.status(400).json({ message: "Message or attachment required" });
    }

    let fileData = {};
    if (file) {
      const uploadResult = await uploadToCloudinary(file.path, { folder: "chat_attachments" });
      fileData = {
        fileUrl: uploadResult.url,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
      };
      try {
        fs.unlinkSync(file.path);
      } catch (e) {
        console.warn("Failed to clean temp file:", e.message);
      }
    }

    const message = await ChatMessage.create({
      sender: currentUserId,
      receiver,
      content: (content || "").trim(),
      replyTo: replyTo || null,
      ...fileData,
    });

    const populated = await ChatMessage.findById(message._id)
      .populate({
        path: "replyTo",
        select: "content fileName fileUrl fileType sender",
        populate: { path: "sender", select: "name" },
      })
      .lean();

    res.status(201).json(populated);
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await ChatMessage.countDocuments({
      receiver: req.user._id,
      read: false,
    });
    res.json({ count });
  } catch (error) {
    console.error("getUnreadCount error:", error);
    res.status(500).json({ message: "Failed to fetch unread count", error: error.message });
  }
};

module.exports = {
  getChatUsers,
  getMessages,
  sendMessage,
  getUnreadCount,
};
