"use client";

import type React from "react";
import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Eye,
  Calendar,
  User,
  CheckCircle,
  ImageIcon,
  AlertCircle,
  Tag,
  Reply,
  Users,
} from "lucide-react";
import SEO from "../seo/SEO";
import {
  getDiscussion,
  addAnswer,
  addReply,
  voteDiscussion,
  voteAnswer,
  voteReply,
  markBestAnswer,
  uploadImage,
} from "../../utils/api";
import type { Discussion, DiscussionAnswer } from "../../types/discussions";
import { DISCUSSION_CATEGORIES } from "../../types/discussions";
import { getUserProfile } from "../../utils/api";
import MentionInput from "./MentionInput";
import { useSocket } from "../../contexts/SocketContext";
import { Skeleton } from "../ui/Skeleton";

const DiscussionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socket = useSocket();

  useEffect(() => {
    if (!id || id === "undefined") {
      console.error("❌ Invalid discussion ID:", id);
      navigate("/discussions");
      return;
    }
  }, [id, navigate]);

  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [answers, setAnswers] = useState<DiscussionAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Answer form state
  const [answerContent, setAnswerContent] = useState("");
  const [answerImages, setAnswerImages] = useState<string[]>([]);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Reply form state
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyToUsername, setReplyToUsername] = useState<string>("");

  // Typing indicator timeout
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id || id === "undefined") return;

    fetchDiscussion();
    fetchCurrentUser();
  }, [id]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !id) return;

    // Join discussion room
    console.log("🏠 Joining discussion room:", id);
    socket.emit("join_discussion", id);

    // Add a timeout to check if we're receiving events
    setTimeout(() => {
      console.log(
        "🔍 Checking if socket is still connected:",
        socket.connected
      );
      console.log("🔍 Socket ID:", socket.id);
    }, 1000);

    // Test event to verify socket is working
    socket.on("test_event", (data) => {
      console.log("🧪 Test event received:", data);
    });

    // Listen for new answers
    socket.on("new_answer", (newAnswer: DiscussionAnswer) => {
      console.log("📨 Received new_answer event:", newAnswer);
      console.log("🔍 Current answers count before adding:", answers.length);

      setAnswers((prev) => {
        console.log("🔍 Adding new answer to", prev.length, "existing answers");
        const updated = [newAnswer, ...prev];
        console.log("🔍 New answers count:", updated.length);
        return updated;
      });
    });

    // Listen for new replies
    socket.on("new_reply", ({ answerId, reply }) => {
      console.log("📨 Received new_reply event:", { answerId, reply });
      console.log("🔍 Current answers before update:", answers.length);
      console.log("🔍 Looking for answer ID:", answerId);

      setAnswers((prev) => {
        console.log(
          "🔍 Previous answers:",
          prev.map((a) => ({ id: a.id, replyCount: a.replies?.length || 0 }))
        );
        const updated = prev.map((answer) =>
          answer.id === answerId
            ? { ...answer, replies: [...(answer.replies || []), reply] }
            : answer
        );
        console.log(
          "🔍 Updated answers:",
          updated.map((a) => ({ id: a.id, replyCount: a.replies?.length || 0 }))
        );
        return updated;
      });
    });

    // Listen for best answer updates
    socket.on("best_answer_marked", ({ answerId }) => {
      setAnswers((prev) =>
        prev.map((answer) => ({
          ...answer,
          is_best_answer: answer.id === answerId ? 1 : 0,
        }))
      );

      if (discussion) {
        setDiscussion((prev) =>
          prev ? { ...prev, has_best_answer: 1 } : null
        );
      }
    });

    // Listen for vote updates
    socket.on("vote_count_updated", ({ targetId, targetType, voteCount }) => {
      if (targetType === "discussion" && discussion?.id === targetId) {
        setDiscussion((prev) =>
          prev ? { ...prev, vote_count: voteCount } : null
        );
      } else if (targetType === "answer") {
        setAnswers((prev) =>
          prev.map((answer) =>
            answer.id === targetId
              ? { ...answer, vote_count: voteCount }
              : answer
          )
        );
      } else if (targetType === "reply") {
        setAnswers((prev) =>
          prev.map((answer) => ({
            ...answer,
            replies:
              answer.replies?.map((reply) =>
                reply.id === targetId
                  ? { ...reply, vote_count: voteCount }
                  : reply
              ) || [],
          }))
        );
      }
    });

    // Listen for typing indicators
    socket.on("user_typing", ({ userId, username, type }) => {
      if (userId !== currentUser?.id) {
        setTypingUsers((prev) => ({ ...prev, [userId]: username }));
      }
    });

    socket.on("user_stop_typing", ({ userId }) => {
      setTypingUsers((prev) => {
        const newTyping = { ...prev };
        delete newTyping[userId];
        return newTyping;
      });
    });

    return () => {
      socket.emit("leave_discussion", id);
      socket.off("new_answer");
      socket.off("new_reply");
      socket.off("best_answer_marked");
      socket.off("vote_count_updated");
      socket.off("user_typing");
      socket.off("user_stop_typing");

      // Fix #11: Clear typing timeout on unmount
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [socket, id]);
  const fetchDiscussion = async () => {
    try {
      setLoading(true);
      const response = await getDiscussion(id!);
      setDiscussion(response.discussion);
      setAnswers(response.answers.reverse());
    } catch (err: any) {
      setError("Failed to load discussion");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await getUserProfile();
      setCurrentUser(response.user);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  const handleVoteDiscussion = async (voteType: "up" | "down") => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    try {
      await voteDiscussion(id!, voteType);

      // Emit real-time vote update
      if (socket) {
        socket.emit("vote_update", {
          discussionId: id,
          targetId: id,
          targetType: "discussion",
          voteType,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to vote");
    }
  };

  const handleVoteAnswer = async (
    answerId: string,
    voteType: "up" | "down"
  ) => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    try {
      await voteAnswer(answerId, voteType);

      // Emit real-time vote update
      if (socket) {
        socket.emit("vote_update", {
          discussionId: id,
          targetId: answerId,
          targetType: "answer",
          voteType,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to vote");
    }
  };

  const handleVoteReply = async (replyId: string, voteType: "up" | "down") => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    try {
      await voteReply(replyId, voteType);

      // Emit real-time vote update
      if (socket) {
        socket.emit("vote_update", {
          discussionId: id,
          targetId: replyId,
          targetType: "reply",
          voteType,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to vote");
    }
  };

  const handleMarkBestAnswer = async (answerId: string) => {
    if (!currentUser || !discussion) {
      return;
    }

    if (currentUser.id !== discussion.author_id) {
      setError("Only the question author can mark the best answer");
      return;
    }

    try {
      await markBestAnswer(answerId);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to mark best answer");
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setImageUploading(true);
    setError("");

    try {
      const result = await uploadImage(file, `answer-${Date.now()}`);
      setAnswerImages([...answerImages, result.url]);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeAnswerImage = (index: number) => {
    setAnswerImages(answerImages.filter((_, i) => i !== index));
  };

  const removeReplyImage = (index: number) => {
    setReplyImages(replyImages.filter((_, i) => i !== index));
  };

  const handleReplyClick = (answerId: number, username: string) => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    setReplyingTo(answerId);
    setReplyToUsername(username);
    setReplyContent(`@${username} `);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
    setReplyImages([]);
    setReplyToUsername("");
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !replyingTo) {
      return;
    }

    if (!replyContent.trim()) {
      setError("Please enter your reply");
      return;
    }

    setSubmittingReply(true);
    setError("");

    try {
      console.log(
        "📤 Submitting reply:",
        replyingTo.toString(),
        replyContent.trim()
      );
      await addReply(
        replyingTo.toString(),
        replyContent.trim(),
        replyImages.length > 0 ? replyImages : undefined
      );

      console.log("✅ Reply submitted successfully");
      // Reset form
      handleCancelReply();
    } catch (err: any) {
      console.error("❌ Reply submission failed:", err);
      setError(err.response?.data?.error || "Failed to submit reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      navigate("/auth");
      return;
    }

    if (!answerContent.trim()) {
      setError("Please enter your answer");
      return;
    }

    setSubmittingAnswer(true);
    setError("");

    try {
      console.log("📤 Submitting answer:", id, answerContent.trim());
      await addAnswer(
        id!,
        answerContent.trim(),
        answerImages.length > 0 ? answerImages : undefined
      );

      console.log("✅ Answer submitted successfully");
      // Reset form
      setAnswerContent("");
      setAnswerImages([]);
    } catch (err: any) {
      console.error("❌ Answer submission failed:", err);
      setError(err.response?.data?.error || "Failed to submit answer");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Handle typing indicators
  const handleTypingStart = (type: "answer" | "reply") => {
    if (socket && id) {
      socket.emit("typing_start", { discussionId: id, type });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing_stop", { discussionId: id });
      }, 3000);
    }
  };

  const handleTypingStop = () => {
    if (socket && id) {
      socket.emit("typing_stop", { discussionId: id });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getCategoryInfo = (category: string) => {
    return (
      DISCUSSION_CATEGORIES.find((cat) => cat.value === category) || {
        value: category,
        label: category,
        icon: "💬",
      }
    );
  };

  const parseTags = (tagsString?: string): string[] => {
    if (!tagsString) return [];
    try {
      return JSON.parse(tagsString);
    } catch {
      return [];
    }
  };

  const parseImages = (imagesString?: string): string[] => {
    if (!imagesString) return [];
    try {
      return JSON.parse(imagesString);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <div className="flex items-center space-x-2 text-gray-400 mr-6">
              <Skeleton className="h-5 w-5 bg-white/[0.06]" />
              <Skeleton className="h-4 w-40 bg-white/[0.06]" />
            </div>
          </div>
    
          <div className="smoke-card p-8 mb-8 relative smoke-effect">
            <div className="flex items-start space-x-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-4 gap-4">
                  <Skeleton className="h-7 w-2/3 bg-white/[0.07]" />
                  <Skeleton className="h-6 w-20 rounded-full bg-white/[0.06]" />
                </div>
    
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <Skeleton className="h-4 w-32 bg-white/[0.06]" />
                  <Skeleton className="h-4 w-24 bg-white/[0.06]" />
                  <Skeleton className="h-4 w-24 bg-white/[0.06]" />
                </div>
    
                <div className="space-y-3 mb-6">
                  <Skeleton className="h-4 w-full bg-white/[0.06]" />
                  <Skeleton className="h-4 w-11/12 bg-white/[0.06]" />
                  <Skeleton className="h-4 w-4/5 bg-white/[0.06]" />
                </div>
    
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-20 rounded-full bg-white/[0.06]" />
                  <Skeleton className="h-6 w-24 rounded-full bg-white/[0.06]" />
                  <Skeleton className="h-6 w-16 rounded-full bg-white/[0.06]" />
                </div>
              </div>
            </div>
          </div>
    
          <div className="smoke-card p-6 mt-10 mb-5 smoke-effect">
            <Skeleton className="h-5 w-28 bg-white/[0.07] mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg bg-white/[0.05]" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-44 rounded bg-white/[0.05]" />
                <Skeleton className="h-10 w-32 rounded bg-white/[0.06]" />
              </div>
            </div>
          </div>
    
          <div className="space-y-6">
            <Skeleton className="h-6 w-40 bg-white/[0.07]" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="smoke-card p-6 relative smoke-effect space-y-4"
              >
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full bg-white/[0.06]" />
                  <Skeleton className="h-4 w-5/6 bg-white/[0.06]" />
                  <Skeleton className="h-4 w-2/3 bg-white/[0.05]" />
                </div>
            
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28 bg-white/[0.05]" />
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-20 bg-white/[0.05]" />
                    <Skeleton className="h-4 w-16 bg-white/[0.05]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-alien text-gray-400 mb-4">
            Discussion not found
          </h2>
          <Link to="/discussions" className="alien-button">
            Back to Discussions
          </Link>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(discussion.category);
  const tags = parseTags(discussion.tags);
  const discussionImages = parseImages(discussion.images);

  return (
    <>
      <SEO
        title={discussion.title}
        description={discussion.content.substring(0, 160)}
        keywords={`${discussion.category}, discussion, Q&A, ${
          Array.isArray(discussion.tags)
            ? discussion.tags.join(", ")
            : discussion.tags || ""
        }`}
      />
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate("/discussions")}
              className="flex items-center space-x-2 text-gray-400 hover:text-alien-green transition-colors duration-300 mr-6"
            >
              <ArrowLeft size={20} />
              <span>Back to Discussions</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center">
              <AlertCircle className="mr-2 flex-shrink-0" size={20} />
              {error}
            </div>
          )}

          {/* Debug: Test Socket Connection */}
          {/* {socket && (
          <div className="bg-blue-900/50 border border-blue-500 text-blue-200 px-4 py-3 rounded-lg mb-6">
            <button
              onClick={() => {
                console.log("🧪 Testing socket connection...");
                socket.emit("test_event", { message: "Hello from client!" });
              }}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Test Socket Connection
            </button>
            <span className="ml-3 text-sm">
              Socket: {socket.connected ? "✅ Connected" : "❌ Disconnected"}
            </span>
          </div>
        )} */}

          {/* Discussion */}
          <div className="smoke-card p-8 mb-8 relative smoke-effect">
            <div className="flex items-start space-x-6">
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-2xl font-alien font-bold text-white">
                    {discussion.title}
                  </h1>
                  {discussion.has_best_answer === 1 && (
                    <div className="flex items-center space-x-2 text-alien-green">
                      <CheckCircle size={20} />
                      <span className="text-sm font-medium">Solved</span>
                    </div>
                  )}
                </div>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">{categoryInfo.icon}</span>
                    <span>{categoryInfo.label}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User size={16} />
                    <span>{discussion.author_username}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <MessageCircle size={16} />
                    <span>{answers.length} answers</span>
                  </div>
                </div>

                {/* Content */}
                <div className="prose prose-invert max-w-none mb-6">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {discussion.content}
                  </p>
                </div>

                {/* Images - Lazy loading (Fix #12) */}
                {discussionImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {discussionImages.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl || "/placeholder.svg"}
                        alt={`Discussion image ${index + 1}`}
                        loading="lazy"
                        className="w-full h-32 object-cover rounded-lg border border-smoke-light cursor-pointer hover:opacity-80 transition-opacity duration-300"
                        onClick={() => window.open(imageUrl, "_blank")}
                      />
                    ))}
                  </div>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center bg-alien-green/20 text-alien-green px-3 py-1 rounded-full text-sm"
                      >
                        <Tag size={12} className="mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add Answer Form */}
          {currentUser && (
            <div className="smoke-card p-6 mt-10 mb-5 smoke-effect">
              <h3 className="text-lg font-alien font-bold text-alien-green mb-4">
                Your Answer
              </h3>
              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                <MentionInput
                  value={answerContent}
                  onChange={(value) => {
                    setAnswerContent(value);
                    if (value.trim()) {
                      handleTypingStart("answer");
                    } else {
                      handleTypingStop();
                    }
                  }}
                  placeholder="Write your answer..."
                  className="alien-input w-full h-32 resize-none"
                  rows={6}
                />

                {/* Image Upload */}
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading || answerImages.length >= 3}
                    className="flex items-center space-x-2 px-4 py-2 border border-smoke-light rounded text-gray-400 hover:border-alien-green hover:text-alien-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {imageUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-alien-green border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={16} />
                        <span>Add Images ({answerImages.length}/3)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Answer Image Preview */}
                {answerImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {answerImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl || "/placeholder.svg"}
                          alt={`Answer upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded border border-smoke-light"
                        />
                        <button
                          type="button"
                          onClick={() => removeAnswerImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!answerContent.trim() || submittingAnswer}
                    className="alien-button disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingAnswer ? "Posting Answer..." : "Post Answer"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {!currentUser && (
            <div className="smoke-card p-6 text-center smoke-effect">
              <p className="text-gray-400 mb-4">
                Please sign in to post an answer or reply to this discussion.
              </p>
              <Link to="/auth" className="alien-button">
                Sign In
              </Link>
            </div>
          )}

          {/* Answers */}
          <div className="space-y-6">
            <h2 className="text-xl font-alien font-bold text-alien-green">
              {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
            </h2>

            {/* Typing Indicators */}
            {Object.keys(typingUsers).length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-400 bg-smoke-light/20 px-4 py-2 rounded-lg">
                <Users size={16} />
                <span>
                  {Object.values(typingUsers).join(", ")}
                  {Object.keys(typingUsers).length === 1 ? " is" : " are"}{" "}
                  typing...
                </span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-alien-green rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-alien-green rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-alien-green rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            )}
            {answers.map((answer) => {
              const answerImages = parseImages(answer.images);
              const canMarkBest =
                currentUser &&
                currentUser.id === discussion.author_id &&
                !answer.is_best_answer &&
                discussion.has_best_answer === 0;

              return (
                <div key={answer.id} className="space-y-4">
                  <div
                    className={`smoke-card p-6 relative smoke-effect ${
                      answer.is_best_answer
                        ? "border-2 border-alien-green shadow-alien-glow"
                        : ""
                    }`}
                  >
                    {answer.is_best_answer === 1 && (
                      <div className="absolute top-4 right-4 flex items-center space-x-2 text-alien-green">
                        <CheckCircle size={20} />
                        <span className="text-sm font-medium">Best Answer</span>
                      </div>
                    )}

                    <div className="flex items-start space-x-6">
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="prose prose-invert max-w-none mb-4">
                          <p className="text-gray-300 whitespace-pre-wrap">
                            {answer.content}
                          </p>
                        </div>

                        {/* Images */}
                        {/* Images - Lazy loading (Fix #12) */}
                        {answerImages.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            {answerImages.map((imageUrl, index) => (
                              <img
                                key={index}
                                src={imageUrl || "/placeholder.svg"}
                                alt={`Answer image ${index + 1}`}
                                loading="lazy"
                                className="w-full h-32 object-cover rounded-lg border border-smoke-light cursor-pointer hover:opacity-80 transition-opacity duration-300"
                                onClick={() => window.open(imageUrl, "_blank")}
                              />
                            ))}
                          </div>
                        )}

                        {/* Meta and Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <User size={14} />
                              <span>{answer.author_username}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {canMarkBest && (
                              <button
                                onClick={() =>
                                  handleMarkBestAnswer(answer.id.toString())
                                }
                                className="flex items-center space-x-1 text-sm text-gray-400 hover:text-alien-green transition-colors duration-300"
                              >
                                <CheckCircle size={16} />
                                <span>Mark as Best</span>
                              </button>
                            )}
                            {currentUser && (
                              <button
                                onClick={() =>
                                  handleReplyClick(
                                    answer.id,
                                    answer.author_username
                                  )
                                }
                                className="flex items-center space-x-1 text-sm text-gray-400 hover:text-alien-green transition-colors duration-300"
                              >
                                <Reply size={16} />
                                <span>Reply</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {((answer.replies && answer.replies.length > 0) ||
                    replyingTo === answer.id) && (
                    <div className="ml-8 border-l-2 border-smoke-light/30 pl-6">
                      {/* Replies Header */}
                      {answer.replies && answer.replies.length > 0 && (
                        <div className="flex items-center space-x-2 mb-4 text-sm text-gray-400">
                          <MessageCircle size={16} />
                          <span>
                            {answer.replies.length}{" "}
                            {answer.replies.length === 1 ? "reply" : "replies"}
                          </span>
                        </div>
                      )}

                      {answer.replies && answer.replies.length > 0 && (
                        <div
                          className={`space-y-4 ${
                            answer.replies.length > 3
                              ? "max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-smoke-dark scrollbar-thumb-smoke-light hover:scrollbar-thumb-alien-green"
                              : ""
                          }`}
                        >
                          {answer.replies.map((reply, index) => {
                            const replyImages = parseImages(reply.images);

                            return (
                              <div key={reply.id} className="relative">
                                <div className="bg-smoke-dark/50 border border-smoke-light/20 rounded-lg p-4 hover:bg-smoke-dark/70 hover:border-smoke-light/40 transition-all duration-300">
                                  <div className="flex items-start space-x-4">
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      {/* Reply Header */}
                                      <div className="flex items-center space-x-3 mb-2">
                                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                                          <User size={12} />
                                          <span className="font-medium text-gray-300">
                                            {reply.author_username}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Reply Content */}
                                      <div className="prose prose-invert max-w-none mb-3">
                                        <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                                          {reply.content}
                                        </p>
                                      </div>

                                      {/* Images */}
                                      {replyImages.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                          {replyImages.map(
                                            (imageUrl, index) => (
                                              <img
                                                key={index}
                                                src={
                                                  imageUrl || "/placeholder.svg"
                                                }
                                                alt={`Reply image ${index + 1}`}
                                                className="w-full h-20 object-cover rounded border border-smoke-light cursor-pointer hover:opacity-80 transition-opacity duration-300"
                                                onClick={() =>
                                                  window.open(
                                                    imageUrl,
                                                    "_blank"
                                                  )
                                                }
                                              />
                                            )
                                          )}
                                        </div>
                                      )}

                                      {/* Reply Actions */}
                                      {currentUser && (
                                        <div className="flex justify-end">
                                          <button
                                            onClick={() =>
                                              handleReplyClick(
                                                answer.id,
                                                reply.author_username
                                              )
                                            }
                                            className="flex items-center space-x-1 text-xs text-gray-400 hover:text-alien-green transition-colors duration-300 px-2 py-1 rounded hover:bg-smoke-light/20"
                                          >
                                            <Reply size={12} />
                                            <span>Reply</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {replyingTo === answer.id && (
                        <div
                          className={`${
                            answer.replies && answer.replies.length > 0
                              ? "mt-4 pt-4 border-t border-smoke-light/20"
                              : ""
                          }`}
                        >
                          <div className="bg-smoke-light/5 border-2 border-alien-green/30 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-3 text-sm text-alien-green">
                              <Reply size={14} />
                              <span>
                                Replying
                                {replyToUsername
                                  ? ` to @${replyToUsername}`
                                  : ""}
                              </span>
                            </div>

                            <form
                              onSubmit={handleSubmitReply}
                              className="space-y-4"
                            >
                              <MentionInput
                                value={replyContent}
                                onChange={setReplyContent}
                                placeholder="Write your reply..."
                                className="alien-input w-full h-20 resize-none"
                                rows={3}
                                replyToUsername={replyToUsername}
                              />

                              {/* Image Upload for Reply */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/*"
                                    className="hidden"
                                  />
                                  {/* <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={
                                    imageUploading || replyImages.length >= 2
                                  }
                                  className="flex items-center space-x-2 px-3 py-2 text-sm border border-smoke-light rounded text-gray-400 hover:border-alien-green hover:text-alien-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                >
                                  {imageUploading ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-alien-green border-t-transparent rounded-full animate-spin"></div>
                                      <span>Uploading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <ImageIcon size={14} />
                                      <span>
                                        Add Image ({replyImages.length}/2)
                                      </span>
                                    </>
                                  )}
                                </button> */}
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={handleCancelReply}
                                    className="px-3 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors duration-300"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={
                                      !replyContent.trim() || submittingReply
                                    }
                                    className="px-4 py-2 bg-alien-green text-black text-sm font-medium rounded hover:bg-alien-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                  >
                                    {submittingReply
                                      ? "Posting..."
                                      : "Post Reply"}
                                  </button>
                                </div>
                              </div>

                              {/* Reply Image Preview */}
                              {replyImages.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                  {replyImages.map((imageUrl, index) => (
                                    <div key={index} className="relative group">
                                      <img
                                        src={imageUrl || "/placeholder.svg"}
                                        alt={`Reply upload ${index + 1}`}
                                        className="w-full h-20 object-cover rounded border border-smoke-light"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeReplyImage(index)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default DiscussionDetailPage;
