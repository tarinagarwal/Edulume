import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Send,
  FileText,
  MessageSquare,
  X,
  History,
  Trash2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { isAuthenticated, getAuthToken } from "../../utils/auth";
import { uploadPdfToPython, queryPdfChat } from "../../utils/api";
import { ToastContainer, ToastType } from "../ui/Toast";
import { ProgressBar } from "../ui/ProgressBar";
import { MarkdownRenderer } from "../ui/MarkdownRenderer";
import { PdfViewer } from "../ui/PdfViewer";

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatSession {
  id: string;
  sessionId: string;
  pdfName: string;
  pdfUrl: string;
  createdAt: string;
  messages: ChatMessage[];
}

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export default function PdfChatbotPage() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    fetchChatHistory();
  }, []);

  useEffect(() => {
    // Only auto-scroll when new messages are added, not when existing ones are updated
    if (shouldAutoScroll && messages.length > lastMessageCount) {
      console.log("Auto-scrolling chat container"); // Debug log
      scrollToBottom();
      setLastMessageCount(messages.length);
    } else if (messages.length !== lastMessageCount) {
      setLastMessageCount(messages.length);
    }
  }, [messages, shouldAutoScroll, lastMessageCount]);

  const checkAuth = async () => {
    const authenticated = await isAuthenticated();
    setIsAuth(authenticated);
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
          console.log("Scrolled chat container to:", container.scrollHeight); // Debug log
        }
      });
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

    setShouldAutoScroll(isNearBottom);
  };

  const scrollToBottomManually = () => {
    setShouldAutoScroll(true);
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
      console.log("Manual scroll to:", container.scrollHeight); // Debug log
    }
  };

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
  };

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      addToast({
        type: "error",
        title: "Invalid File",
        message: "Please select a valid PDF file",
      });
      return;
    }

    // Clear the input to prevent issues
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setPdfFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    let progressInterval: NodeJS.Timeout;

    try {
      // Simulate progress for better UX
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Generate new session first
      const newSessionId = generateSessionId();

      addToast({
        type: "info",
        title: "Uploading PDF",
        message: "Processing your document...",
      });

      // Upload PDF to Python backend
      const result = await uploadPdfToPython(file, newSessionId);
      console.log("Upload result:", result); // Debug log
      setUploadProgress(95);

      // Set session data
      setSessionId(newSessionId);
      setPdfUrl(result.cloudinary_url);
      setMessages([]);

      // Save session to backend
      const sessionResponse = await fetch("/api/pdf-chat/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          sessionId: newSessionId,
          pdfUrl: result.cloudinary_url,
          pdfName: file.name,
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error("Failed to create chat session");
      }

      setUploadProgress(100);
      clearInterval(progressInterval);

      // Keep progress visible for a moment
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1500);

      addToast({
        type: "success",
        title: "PDF Uploaded Successfully",
        message: "You can now start chatting with your document!",
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      addToast({
        type: "error",
        title: "Upload Failed",
        message: "Failed to upload PDF. Please try again.",
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !sessionId || isLoading) return;

    const userMessage = currentMessage.trim();
    const messageId = Date.now().toString();

    // Add message immediately with loading state
    const loadingMessage: ChatMessage = {
      id: messageId,
      message: userMessage,
      response: "",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, loadingMessage]);
    setCurrentMessage("");
    setIsLoading(true);
    setShouldAutoScroll(true); // Enable auto-scroll for new messages

    try {
      const result = await queryPdfChat(sessionId, userMessage);

      // Update the message with the response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, response: result.rag_response, isLoading: false }
            : msg
        )
      );

      // Save message to backend
      const saveResponse = await fetch("/api/pdf-chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
          response: result.rag_response,
        }),
      });

      if (!saveResponse.ok) {
        console.error("Failed to save message to backend");
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Update message with error state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                response: "Sorry, I encountered an error. Please try again.",
                isLoading: false,
              }
            : msg
        )
      );

      addToast({
        type: "error",
        title: "Message Failed",
        message: "Failed to send message. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    setIsEndingSession(true);

    try {
      addToast({
        type: "info",
        title: "Ending Session",
        message: "Cleaning up embeddings...",
      });

      // End session and cleanup embeddings
      await fetch(`/api/pdf-chat/sessions/${sessionId}/end`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      // Reset state
      setPdfFile(null);
      setPdfUrl("");
      setSessionId("");
      setMessages([]);
      setLastMessageCount(0);
      setShouldAutoScroll(true);

      // Refresh chat history
      fetchChatHistory();

      addToast({
        type: "success",
        title: "Session Ended",
        message: "Embeddings have been cleaned up successfully.",
      });
    } catch (error) {
      console.error("Error ending session:", error);
      addToast({
        type: "error",
        title: "Error Ending Session",
        message: "Failed to end session properly.",
      });
    } finally {
      setIsEndingSession(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch("/api/pdf-chat/history", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.ok) {
        const history = await response.json();
        setChatHistory(history);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const deleteHistorySession = async (historySessionId: string) => {
    try {
      await fetch(`/api/pdf-chat/sessions/${historySessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      fetchChatHistory();
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  if (isAuth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-alien-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-royal-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-400">Please log in to use the PDF Chatbot.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-royal-black pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">PDF Chatbot</h1>
            <p className="text-gray-400">
              Upload a PDF and chat with its content using AI
            </p>
          </div>
          <div className="flex gap-4">
            {/* <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 bg-smoke-gray border border-smoke-light rounded-lg text-gray-300 hover:text-alien-green transition-colors"
            >
              <History size={20} />
              Chat History
            </button> */}
            {sessionId && (
              <button
                onClick={endSession}
                disabled={isEndingSession}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEndingSession ? <>Ending...</> : <>End Session</>}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* PDF Preview Section */}
          <div className="lg:col-span-1">
            <div className="bg-smoke-gray border border-smoke-light rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={20} />
                PDF Preview
              </h2>

              {!pdfFile ? (
                <div className="border-2 border-dashed border-smoke-light rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400 mb-4">
                    Upload a PDF to start chatting
                  </p>
                  {isUploading && (
                    <div className="mb-4">
                      <ProgressBar progress={uploadProgress} />
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-6 py-2 bg-alien-green hover:bg-alien-green/80 text-royal-black font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Choose PDF"
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-alien-green">
                    <FileText size={20} />
                    <span className="font-medium">{pdfFile.name}</span>
                  </div>
                  {pdfUrl && (
                    <PdfViewer
                      pdfUrl={pdfUrl}
                      fileName={pdfFile.name}
                      className="mt-4"
                    />
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full px-4 py-2 bg-smoke-light hover:bg-smoke-light/80 text-gray-300 rounded-lg transition-colors"
                  >
                    Upload Different PDF
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2">
            <div className="bg-smoke-gray border border-smoke-light rounded-lg h-[600px] flex flex-col">
              <div className="p-4 border-b border-smoke-light flex-shrink-0">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <MessageSquare size={20} />
                  Chat with PDF
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 relative overflow-hidden">
                <div
                  ref={messagesContainerRef}
                  className="absolute inset-0 overflow-y-auto p-4 space-y-4 scroll-smooth"
                  onScroll={(e) => {
                    e.stopPropagation(); // Prevent scroll event bubbling
                    handleScroll();
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20">
                      {sessionId
                        ? "Start asking questions about your PDF!"
                        : "Upload a PDF to begin chatting"}
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="space-y-3">
                        {/* User Message */}
                        <div className="flex justify-end">
                          <div className="bg-alien-green text-royal-black px-4 py-2 rounded-lg max-w-xs lg:max-w-md break-words">
                            {msg.message}
                          </div>
                        </div>
                        {/* AI Response */}
                        <div className="flex justify-start">
                          <div className="bg-smoke-light text-gray-300 px-4 py-2 rounded-lg max-w-xs lg:max-w-md">
                            {msg.isLoading ? (
                              <div className="flex items-center gap-2">
                                <Loader2
                                  size={16}
                                  className="animate-spin text-alien-green"
                                />
                                <span className="text-sm">Thinking...</span>
                              </div>
                            ) : (
                              <MarkdownRenderer content={msg.response} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Scroll to bottom button */}
                {!shouldAutoScroll && messages.length > 0 && (
                  <button
                    onClick={scrollToBottomManually}
                    className="absolute bottom-4 right-4 p-2 bg-alien-green text-royal-black rounded-full shadow-lg hover:bg-alien-green/80 transition-colors z-10"
                    title="Scroll to bottom"
                  >
                    <ChevronDown size={20} />
                  </button>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-smoke-light flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && sendMessage()
                    }
                    placeholder={
                      sessionId
                        ? "Ask a question about the PDF..."
                        : "Upload a PDF first"
                    }
                    disabled={!sessionId || isLoading}
                    className="flex-1 px-4 py-2 bg-smoke-light border border-smoke-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-alien-green disabled:opacity-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!sessionId || !currentMessage.trim() || isLoading}
                    className="px-4 py-2 bg-alien-green hover:bg-alien-green/80 text-royal-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-5">
            <div className="bg-smoke-gray border border-smoke-light rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-smoke-light flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">
                  Chat History
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-96">
                {chatHistory.length === 0 ? (
                  <p className="text-gray-400 text-center">
                    No chat history found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {chatHistory.map((session) => (
                      <div
                        key={session.id}
                        className="bg-smoke-light rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-white">
                              {session.pdfName}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {new Date(session.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              deleteHistorySession(session.sessionId)
                            }
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="text-sm text-gray-300">
                          {session.messages.length} messages
                        </div>
                        {session.messages.slice(0, 2).map((msg, idx) => (
                          <div key={idx} className="mt-2 text-xs">
                            <div className="text-alien-green">
                              Q: {msg.message.substring(0, 50)}...
                            </div>
                            <div className="text-gray-400">
                              A: {msg.response.substring(0, 50)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
