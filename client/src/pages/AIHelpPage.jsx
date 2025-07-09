import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// This function now contains our own simple "AI" logic.
const getMockAIResponse = async (message) => {
  // Convert the user's message to lowercase to make matching easier.
  const lowerCaseMessage = message.toLowerCase();

  // --- START OF YOUR CUSTOM AI KNOWLEDGE BASE ---
  // You can add more questions and answers here.

  // --- Appointments & Services ---
  if (
    lowerCaseMessage.includes("book appointment") ||
    lowerCaseMessage.includes("see a doctor")
  ) {
    return "You can book an appointment by visiting our 'Find a Doctor' page or by calling our reception at 555-1234. We recommend booking online for the fastest service.";
  }
  if (
    lowerCaseMessage.includes("services") ||
    lowerCaseMessage.includes("offer")
  ) {
    return "We offer a wide range of services including 24/7 Pharmacy, Ambulance Services, Room Bookings, and specialized medical consultations. Please visit the homepage to see all our services.";
  }
  if (
    lowerCaseMessage.includes("find a specific doctor") ||
    lowerCaseMessage.includes("doctor information")
  ) {
    return "Yes, you can search for our doctors by name or specialty on the 'Find a Doctor' page. There you will find their qualifications and department information.";
  }

  // --- General Information ---
  if (
    lowerCaseMessage.includes("opening hours") ||
    lowerCaseMessage.includes("open")
  ) {
    return "Our hospital is open 24/7 for emergency services. For general appointments and consultations, our hours are from 9:00 AM to 5:00 PM, Monday to Friday.";
  }
  if (
    lowerCaseMessage.includes("location") ||
    lowerCaseMessage.includes("address")
  ) {
    return "We are located at 123 Health St, Wellness City. You can find a map and directions on our website's contact page.";
  }
  if (
    lowerCaseMessage.includes("visiting hours") ||
    lowerCaseMessage.includes("visit a patient") ||
    lowerCaseMessage.includes("time for doctor")
  ) {
    return "General visiting hours for inpatient rooms are from 11:00 AM to 1:00 PM and from 5:00 PM to 8:00 PM every day. Please check with the specific ward for any variations.";
  }

  // --- Contact & Emergency ---
  if (
    lowerCaseMessage.includes("contact") ||
    lowerCaseMessage.includes("phone number")
  ) {
    // CORRECTED TYPO HERE
    return "You can reach our main reception at 01936580923. For emergencies, please dial 999 immediately. All contact details are on our website.";
  }
  if (lowerCaseMessage.includes("emergency")) {
    // CORRECTED TYPO HERE
    return "In case of a medical emergency, please call our dedicated emergency hotline at 999 or visit our Emergency Department immediately. We are open 24/7.";
  }

  // --- Cost & Insurance ---
  if (lowerCaseMessage.includes("cost") || lowerCaseMessage.includes("price")) {
    return "The cost of a consultation or procedure varies. For detailed pricing, please contact our billing department at 555-5678 during business hours.";
  }
  if (lowerCaseMessage.includes("insurance")) {
    return "We accept a wide range of health insurance providers. To confirm if your specific plan is accepted, please call our insurance verification team at 555-8765.";
  }

  // --- Pharmacy ---
  if (
    lowerCaseMessage.includes("pharmacy") ||
    lowerCaseMessage.includes("medicine")
  ) {
    return "Our pharmacy is open 24/7. You can visit in person or use our online pharmacy service on the website to order medications for delivery.";
  }

  // --- Basic Medical Questions ---
  if (
    lowerCaseMessage.includes("fever") ||
    lowerCaseMessage.includes("headache") ||
    lowerCaseMessage.includes("flu")
  ) {
    return "For symptoms like fever or a headache, it's best to consult with a doctor to get a proper diagnosis. You can book an appointment with one of our general physicians online. Please remember, this is not medical advice.";
  }

  // --- Greetings ---
  if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi")) {
    return "Hello! How can I assist you today?";
  }
  if (
    lowerCaseMessage.includes("thanks") ||
    lowerCaseMessage.includes("thank you")
  ) {
    return "You're welcome! Is there anything else I can help you with?";
  }

  // --- END OF YOUR CUSTOM AI KNOWLEDGE BASE ---

  // If no match is found, return a default message.
  return "I'm sorry, I can only answer specific questions about our services, opening hours, and appointments. Please try asking your question differently, or contact our support staff for more complex inquiries.";
};

const AIHelpPage = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    setMessages([
      {
        text: "Hello! I'm your AI Health Assistant. How can I help you today? Please note, I am not a substitute for professional medical advice.",
        sender: "ai",
      },
    ]);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate a short delay to feel like a real AI is "thinking"
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const aiResponse = await getMockAIResponse(input);
      const aiMessage = { text: aiResponse, sender: "ai" };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting mock response:", error);
      const errorMessage = {
        text: "Sorry, an internal error occurred.",
        sender: "ai",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          AI Health Assistant
        </h1>
        <Link to="/" className="btn btn-ghost">
          Back to Home
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat ${
                msg.sender === "user" ? "chat-end" : "chat-start"
              }`}
            >
              <div className="chat-image avatar">
                <div className="w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span>{msg.sender === "user" ? "You" : "AI"}</span>
                </div>
              </div>
              <div
                className={`chat-bubble ${
                  msg.sender === "user"
                    ? "chat-bubble-primary"
                    : "chat-bubble-secondary"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat chat-start">
              <div className="chat-bubble chat-bubble-secondary">
                <span className="loading loading-dots loading-md"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a health-related question..."
            className="input input-bordered w-full"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
};

export default AIHelpPage;
