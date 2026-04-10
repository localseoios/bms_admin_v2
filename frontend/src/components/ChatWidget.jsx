import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import axiosInstance from "../utils/axios";
import { useAuth } from "../context/AuthContext";

function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageRefs = useRef({});

  const scrollToMessage = (msgId) => {
    const el = messageRefs.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 1500);
    }
  };

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.get("/chat/unread-count");
      setUnreadTotal(res.data.count || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [user]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await axiosInstance.get("/chat/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error("Error fetching chat users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchMessages = useCallback(async (otherUserId) => {
    try {
      const res = await axiosInstance.get(`/chat/messages/${otherUserId}`);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    if (isOpen && !selectedUser) {
      fetchUsers();
    }
  }, [isOpen, selectedUser, fetchUsers]);

  useEffect(() => {
    if (!selectedUser) return;
    fetchMessages(selectedUser._id);
    const interval = setInterval(() => {
      fetchMessages(selectedUser._id);
      fetchUnreadCount();
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedUser, fetchMessages, fetchUnreadCount]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachedFile) || !selectedUser || sending) return;

    try {
      setSending(true);
      const formData = new FormData();
      formData.append("receiver", selectedUser._id);
      formData.append("content", newMessage.trim());
      if (attachedFile) {
        formData.append("file", attachedFile);
      }
      if (replyingTo) {
        formData.append("replyTo", replyingTo._id);
      }
      const res = await axiosInstance.post("/chat/messages", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
      setAttachedFile(null);
      setReplyingTo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Error sending message:", err);
      alert(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      alert("File too large. Max 100MB allowed.");
      return;
    }
    setAttachedFile(file);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const isImageFile = (type) => type?.startsWith("image/");

  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(fileUrl, "_blank");
    }
  };

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setUsers((prev) =>
      prev.map((usr) => (usr._id === u._id ? { ...usr, unreadCount: 0 } : usr))
    );
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    fetchUsers();
  };

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl flex items-center justify-center"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <>
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            {unreadTotal > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 border-2 border-white">
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            )}
          </>
        )}
      </motion.button>

      {/* Chat Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center gap-3">
              {selectedUser && (
                <button
                  onClick={handleBackToList}
                  className="p-1 hover:bg-white/20 rounded-full transition"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
              )}
              {selectedUser ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">
                    {selectedUser.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{selectedUser.name}</div>
                    <div className="text-xs text-white/80 truncate">
                      {selectedUser.role?.name || "Staff"}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <ChatBubbleLeftRightIcon className="w-6 h-6" />
                  <div className="flex-1">
                    <div className="font-semibold">Staff Chat</div>
                    <div className="text-xs text-white/80">
                      {unreadTotal > 0 ? `${unreadTotal} unread messages` : "All caught up"}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Body */}
            {selectedUser ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm mt-8">
                      No messages yet. Say hello!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender === user._id || msg.sender?._id === user._id;
                      return (
                        <div
                          key={msg._id}
                          ref={(el) => (messageRefs.current[msg._id] = el)}
                          className={`group flex items-center gap-1 transition-all rounded-lg ${isMine ? "justify-end" : "justify-start"} ${
                            highlightedMsgId === msg._id ? "bg-yellow-100/70 -mx-2 px-2 py-1" : ""
                          }`}
                        >
                          {isMine && (
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition"
                              title="Reply"
                            >
                              <ArrowUturnLeftIcon className="w-4 h-4" />
                            </button>
                          )}
                          <div
                            className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                              isMine
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm"
                                : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
                            }`}
                          >
                            {msg.replyTo && (
                              <div
                                onClick={() => scrollToMessage(msg.replyTo._id)}
                                className={`mb-2 pl-2 border-l-2 rounded text-xs cursor-pointer hover:opacity-80 ${
                                  isMine
                                    ? "border-white/60 bg-white/10"
                                    : "border-blue-500 bg-blue-50"
                                } py-1 px-2`}
                              >
                                <div className={`font-semibold text-[10px] ${isMine ? "text-white/90" : "text-blue-600"}`}>
                                  {msg.replyTo.sender?.name || "User"}
                                </div>
                                <div className={`truncate ${isMine ? "text-white/80" : "text-gray-600"}`}>
                                  {msg.replyTo.content || msg.replyTo.fileName || "Attachment"}
                                </div>
                              </div>
                            )}
                            {msg.fileUrl && (
                              <div className="mb-1">
                                {isImageFile(msg.fileType) ? (
                                  <div className="relative group/img">
                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={msg.fileUrl}
                                        alt={msg.fileName}
                                        className="max-w-full max-h-48 rounded-lg object-cover"
                                      />
                                    </a>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleDownload(msg.fileUrl, msg.fileName);
                                      }}
                                      className="absolute top-1 right-1 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition"
                                      title="Download"
                                    >
                                      <ArrowDownTrayIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    className={`flex items-center gap-2 p-2 rounded-lg ${
                                      isMine ? "bg-white/20" : "bg-gray-100"
                                    }`}
                                  >
                                    <DocumentIcon className="w-8 h-8 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium truncate">
                                        {msg.fileName}
                                      </div>
                                      <div className="text-[10px] opacity-75">
                                        {formatFileSize(msg.fileSize)}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleDownload(msg.fileUrl, msg.fileName)}
                                      className={`p-1.5 rounded-full flex-shrink-0 ${
                                        isMine ? "hover:bg-white/20" : "hover:bg-gray-200"
                                      }`}
                                      title="Download"
                                    >
                                      <ArrowDownTrayIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                            {msg.content && (
                              <div className="text-sm break-words whitespace-pre-wrap">
                                {msg.content}
                              </div>
                            )}
                            <div
                              className={`text-[10px] mt-1 flex items-center gap-1 ${
                                isMine ? "text-white/70 justify-end" : "text-gray-400"
                              }`}
                            >
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isMine && (
                                <span className="flex items-center -space-x-1.5">
                                  <CheckIcon
                                    className={`w-3 h-3 ${msg.read ? "text-sky-300" : "text-white/70"}`}
                                  />
                                  {msg.read && <CheckIcon className="w-3 h-3 text-sky-300" />}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isMine && (
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition"
                              title="Reply"
                            >
                              <ArrowUturnLeftIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply preview */}
                {replyingTo && (
                  <div className="px-3 pt-2 bg-white border-t border-gray-100">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      <ArrowUturnLeftIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold text-blue-600">
                          Replying to {replyingTo.sender === user._id || replyingTo.sender?._id === user._id ? "yourself" : selectedUser.name}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {replyingTo.content || replyingTo.fileName || "Attachment"}
                        </div>
                      </div>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="p-1 hover:bg-red-100 rounded-full text-red-500"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Attached file preview */}
                {attachedFile && (
                  <div className="px-3 pt-2 bg-white border-t border-gray-100">
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <DocumentIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {attachedFile.name}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {formatFileSize(attachedFile.size)}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setAttachedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="p-1 hover:bg-red-100 rounded-full text-red-500"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white flex gap-2 items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0 transition"
                    title="Attach file"
                  >
                    <PaperClipIcon className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !attachedFile) || sending}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center disabled:opacity-50 hover:shadow-md transition flex-shrink-0"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    ) : (
                      <PaperAirplaneIcon className="w-5 h-5" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* Search */}
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search staff..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* User list */}
                <div className="flex-1 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="text-center text-gray-400 text-sm py-8">Loading...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">No staff found</div>
                  ) : (
                    filteredUsers.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => handleSelectUser(u)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left border-b border-gray-50"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          {u.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium text-gray-900 truncate">{u.name}</div>
                            {u.lastMessageAt && (
                              <div className="text-[10px] text-gray-400 flex-shrink-0">
                                {formatTime(u.lastMessageAt)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <div className="text-xs text-gray-500 truncate">
                              {u.lastMessage || u.role?.name || "Staff"}
                            </div>
                            {u.unreadCount > 0 && (
                              <div className="bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
                                {u.unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatWidget;
