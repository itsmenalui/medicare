// In src/pages/ChatPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom"; // 1. Import useLocation
import { usePatientAuth } from "../context/PatientAuthContext";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import axios from "../api/axios";
import io from "socket.io-client";
import { Send, User } from "lucide-react";

const socket = io("https://medicare4bd.netlify.app");

const ChatPage = () => {
  const location = useLocation(); // 2. Get the current URL location
  const { user: patientUser } = usePatientAuth();
  const { employeeUser } = useEmployeeAuth();

  // 3. FIXED: This logic now correctly determines the user based on the URL path
  const isEmployeeView = location.pathname.startsWith("/employee-portal");
  const currentUser = isEmployeeView ? employeeUser : patientUser;

  const currentUserId = currentUser?.login_id;
  const currentUserRole = currentUser?.user_type;

  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // ... The rest of your useEffects and functions are correct ...

  // Fetch contacts for the current user
  useEffect(() => {
    const fetchContacts = async () => {
      if (currentUserId) {
        try {
          const response = await axios.get("/api/chat/contacts", {
            headers: {
              "X-User-ID": currentUserId,
              "X-User-Role": currentUserRole,
            },
          });
          setContacts(response.data);
        } catch (error) {
          console.error("Failed to fetch contacts", error);
        }
      }
    };
    fetchContacts();
  }, [currentUserId, currentUserRole]);

  // Fetch messages for the selected contact and join the chat room
  // Updated useEffect in ChatPage.jsx
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedContact && currentUserId) {
        try {
          const response = await axios.get(
            `/api/chat/messages/${currentUserId}/${selectedContact.login_id}`
          );
          setMessages(response.data);
        } catch (error) {
          console.error("Failed to fetch messages", error);
        }
      }
    };
    fetchMessages();

    if (selectedContact && currentUserId) {
      // THIS IS THE NEW LOGGING LINE
      console.log(`[FRONTEND BROWSER] Emitting 'join_chat' for room with:`, {
        userId: currentUserId,
        contactId: selectedContact.login_id,
      });
      // -----------------------------

      socket.emit("join_chat", {
        userId: currentUserId,
        contactId: selectedContact.login_id,
      });
    }
  }, [selectedContact, currentUserId]);

  // Listen for incoming messages via Socket.IO
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      // Only add message if it belongs to the currently selected chat
      if (
        selectedContact &&
        (message.sender_id === selectedContact.login_id ||
          message.recipient_id === selectedContact.login_id)
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };
    socket.on("receive_message", handleReceiveMessage);

    // Clean up on unmount
    return () => socket.off("receive_message", handleReceiveMessage);
  }, [selectedContact]);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // In src/pages/ChatPage.jsx

  // Handle sending a new message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !selectedContact || !currentUserId) return;

    const messageData = {
      sender_id: currentUserId,
      recipient_id: selectedContact.login_id,
      message_content: newMessage,
    };

    // 1. Send the message to the server
    socket.emit("send_message", messageData);

    // 2. REMOVED the setMessages() call from here.
    // We will now rely on the 'receive_message' listener to update the UI.

    // 3. Just clear the input field
    setNewMessage("");
  };

  // Render a message if no user is logged in
  if (!currentUser) {
    return <div className="text-center p-8">Please log in to use chat.</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel: Contact List */}
      <div className="w-1/3 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Conversations</h2>
        </div>
        <div className="flex-grow overflow-y-auto">
          {contacts.map((contact) => (
            <div
              key={contact.login_id}
              onClick={() => setSelectedContact(contact)}
              className={`p-4 flex items-center cursor-pointer border-l-4 ${
                selectedContact?.login_id === contact.login_id
                  ? "bg-blue-50 border-blue-500"
                  : "border-transparent hover:bg-gray-50"
              }`}
            >
              <img
                src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${
                  contact.first_name?.charAt(0) || "C"
                }`}
                alt="avatar"
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="font-semibold text-gray-900">
                  {contact.first_name || "Unknown"}{" "}
                  {contact.last_name || "User"}
                </p>
                <p className="text-sm text-gray-500">{contact.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Chat Window */}
      <div className="w-2/3 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b flex items-center">
              <img
                src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${
                  selectedContact.first_name?.charAt(0) || "C"
                }`}
                alt="avatar"
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="font-bold text-lg text-gray-800">
                  {selectedContact.first_name || "Unknown"}{" "}
                  {selectedContact.last_name || "User"}
                </p>
              </div>
            </div>
            {/* Messages Display */}
            // In the return() section of src/pages/ChatPage.jsx
            <div className="flex-grow p-6 overflow-y-auto bg-gray-200">
              {messages.map(
                (
                  msg // Removed 'index' from here
                ) => (
                  <div
                    key={msg.message_id} // FIXED: Use the unique message_id for the key
                    className={`flex mb-4 ${
                      msg.sender_id === currentUserId
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {/* ... rest of the message bubble div ... */}
                    <div
                      className={`py-2 px-4 rounded-2xl max-w-lg ${
                        msg.sender_id === currentUserId
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-800"
                      }`}
                    >
                      <p>{msg.message_content}</p>
                      <p className="text-xs opacity-75 mt-1 text-right">
                        {new Date(msg.sent_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )
              )}
              <div ref={messagesEndRef} /> {/* Scroll target */}
            </div>
            {/* Message Input */}
            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSendMessage} className="flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="ml-4 bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600"
                >
                  <Send />
                </button>
              </form>
            </div>
          </>
        ) : (
          // Placeholder when no contact is selected
          <div className="flex-grow flex items-center justify-center text-center text-gray-500">
            <div>
              <h2 className="text-2xl font-semibold">Select a conversation</h2>
              <p>Choose a contact from the left to start chatting.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
