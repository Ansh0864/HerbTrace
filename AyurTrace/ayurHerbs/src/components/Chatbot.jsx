import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Bot, Send, X, User } from "lucide-react";
import ReactMarkdown from 'react-markdown';

// Role constants aligned with App.jsx and AuthPage.jsx
const ROLES = {
  customer: "Customer",
  producer: "Producer",
  processor: "Processor",
};

export default function Chatbot({ colors, userRole, currentUser, darkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const primaryGreen = colors.primaryGreen || "#059669";
  const accent = colors.accent || "#7c3aed";
  const cardBackground = colors.cardBackground || "#ffffff";
  const darkText = colors.darkText || "#111827";

  useEffect(() => {
    // Dynamic greeting based on the logged-in user's role
    if (isOpen) {
      const userName = currentUser?.email ? currentUser.email.split('@')[0] : "there";
      let greeting = `Welcome ${userName}! How can I help you learn about Ayurvedic herbs today?`;

      if (userRole === ROLES.producer) {
        greeting = `Hello ${userName}! How can I assist you with your cultivation, soil health, or harvesting today?`;
      } else if (userRole === ROLES.processor) {
        greeting = `Hello ${userName}! Do you have questions regarding batch tracking or processing standards?`;
      }
      
      setMessages([{ sender: "bot", text: greeting }]);
    }
  }, [isOpen, userRole, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "" || loading) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      // Determine the correct API endpoint based on the user's role
      const baseUrl = "http://127.0.0.1:8000";
      const endpoint = userRole === ROLES.producer
          ? `${baseUrl}/farmer_advice/`
          : `${baseUrl}/consumer_chat/`;

      const formData = new FormData();
      formData.append("query", currentInput);
      
      // Removed hardcoded herb name extraction logic to let the backend AI 
      // handle context from the full query
      if (userRole === ROLES.producer) {
        formData.append("location_name", "India"); 
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to connect to the AyurTrace AI service.");
      }

      const data = await response.json();

      if (data.status === "success") {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: data.response },
        ]);
      } else {
        throw new Error(data.message || "Failed to get a response.");
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `I'm having trouble connecting right now: ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full text-white shadow-lg flex items-center justify-center"
        style={{ backgroundColor: primaryGreen }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 180 : 0 }}
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-28 right-8 z-40 w-[90vw] max-w-md h-[70vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border"
            style={{
              backgroundColor: cardBackground,
              borderColor: `${primaryGreen}20`,
            }}
          >
            <header
              className="p-4 flex items-center space-x-3 text-white"
              style={{ backgroundColor: primaryGreen }}
            >
              <Bot size={24} />
              <div>
                <h3 className="font-bold text-lg">AyurBot</h3>
                <p className="text-sm opacity-90">Ayurvedic Support ({userRole})</p>
              </div>
            </header>

            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  className={`flex items-start gap-3 my-3 ${
                    msg.sender === "bot" ? "justify-start" : "justify-end"
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {msg.sender === "bot" && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: accent }}
                    >
                      <Bot size={18} />
                    </div>
                  )}
                  <div
                    className={`prose prose-sm max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${
                      msg.sender === "bot"
                        ? "bg-gray-200 dark:bg-slate-700 rounded-bl-none"
                        : "bg-green-100 dark:bg-green-900 rounded-br-none"
                    }`}
                    style={{ color: darkText }}
                  >
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                   {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-300 dark:bg-slate-600">
                      <User size={18} />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start items-center gap-3 my-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
                    <Bot size={18} />
                  </div>
                  <div className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-2xl rounded-bl-none">
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t flex items-center"
              style={{ borderColor: `${primaryGreen}20` }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about herbs, cultivation, or benefits..."
                className="flex-1 px-4 py-2 rounded-full border bg-transparent focus:outline-none focus:ring-2"
                style={{
                  borderColor: `${primaryGreen}50`,
                  '--tw-ring-color': primaryGreen,
                }}
                disabled={loading}
              />
              <button
                type="submit"
                className="ml-3 w-10 h-10 rounded-full text-white flex items-center justify-center transition-transform hover:scale-110"
                style={{ backgroundColor: primaryGreen }}
                disabled={loading}
              >
                <Send size={20} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}