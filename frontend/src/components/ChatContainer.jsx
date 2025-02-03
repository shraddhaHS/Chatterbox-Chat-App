import { useChatStore } from "../store/useChatStore";
import { useState, useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Ellipsis } from "lucide-react";

const ChatContainer = () => {
  const {
    getMessages,
    messages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    unsendMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const [editingMessage, setEditingMessage] = useState(null);
  const [showOptions, setshowOptions] = useState(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleEditMessage = (messageId, currentText) => {
    setEditingMessage({
      messageId,
      currentText,
    });
    setshowOptions(null);
  };
  
  const handleUnsend = (messageId) => {
    unsendMessage(messageId);  
    setshowOptions(null);
  };
  

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <div
            key={message._id}
            ref={messageEndRef}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={message.senderId === authUser._id ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"}
                  alt="profile-pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">{formatMessageTime(message.createdAt)}</time>
            </div>

            {message.image && (
              <img
                src={message.image}
                alt="Attachment"
                className="sm:max-w-[200px] rounded-md mb-2"
              />
            )}

            <div className="chat-bubble relative flex flex-col  break-words ">
           
              {message.text && <p>{message.text}</p>}
             
              {message.senderId === authUser._id && (
                <div className="absolute left-[-40px]">
                  <button
                    className="btn btn-xs"
                    onClick={() => setshowOptions(showOptions === message._id ? null : message._id)}
                  >
                    <Ellipsis size={16} />
                  </button>
                  {showOptions === message._id && (
                    <div className="absolute left-[-40px]  text-center bg-transparent">
                      <button
                        className="text-center px-2 py-1 hover:text-primary"
                        onClick={() => handleUnsend(message._id)}
                      >
                        Unsend
                      </button>
                      <button
                        className="text-center px-2 py-1 hover:text-primary"
                        onClick={() => handleEditMessage(message._id, message.text)} 
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <MessageInput
        editingMessage={editingMessage}
        setEditingMessage={setEditingMessage}
      />
    </div>
  );
};

export default ChatContainer;
