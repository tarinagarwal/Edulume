import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  MessageSquare,
  Award,
  AtSign,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../utils/api";
import { Notification as NotificationType } from "../../types/discussions";
import { useSocket } from "../../contexts/SocketContext";

// 🧪 MOCK DATA - Only for testing without backend
/*
const allMockNotifications: NotificationType[] = [
  {
    id: 1,
    user_id: 1,
    type: "new_answer",
    title: "New Answer on Your Question",
    message: "John Doe answered your question about React hooks",
    related_id: 123,
    related_type: "discussion",
    from_user_id: 2,
    from_username: "johndoe",
    is_read: 0,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    type: "mention",
    title: "You were mentioned",
    message: "Alice mentioned you in a discussion about TypeScript",
    related_id: 456,
    related_type: "discussion",
    from_user_id: 3,
    from_username: "alice_dev",
    is_read: 0,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    user_id: 1,
    type: "best_answer",
    title: "Best Answer Selected! 🎉",
    message: "Your answer was marked as the best answer",
    related_id: 789,
    related_type: "discussion",
    from_user_id: 4,
    from_username: "mike_smith",
    is_read: 1,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    user_id: 1,
    type: "reply",
    title: "New Reply",
    message: "Sarah replied to your answer about JavaScript closures",
    related_id: 321,
    related_type: "discussion",
    from_user_id: 5,
    from_username: "sarah_codes",
    is_read: 1,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    user_id: 1,
    type: "new_answer",
    title: "Multiple New Answers",
    message: "3 people answered your question about Node.js streams",
    related_id: 654,
    related_type: "discussion",
    from_user_id: 6,
    from_username: "dev_expert",
    is_read: 0,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 6,
    user_id: 1,
    type: "mention",
    title: "Tagged in Discussion",
    message: "David tagged you in a discussion about Python async/await",
    related_id: 987,
    related_type: "discussion",
    from_user_id: 7,
    from_username: "david_py",
    is_read: 0,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 7,
    user_id: 1,
    type: "reply",
    title: "New Reply on Discussion",
    message: "Emma replied to your comment about database indexing",
    related_id: 234,
    related_type: "discussion",
    from_user_id: 8,
    from_username: "emma_db",
    is_read: 1,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 8,
    user_id: 1,
    type: "new_answer",
    title: "Question Answered",
    message: "Chris answered your question about Docker containers",
    related_id: 567,
    related_type: "discussion",
    from_user_id: 9,
    from_username: "chris_devops",
    is_read: 1,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 9,
    user_id: 1,
    type: "best_answer",
    title: "Your Answer Was Chosen!",
    message: "Your answer about Git workflows was marked as best",
    related_id: 890,
    related_type: "discussion",
    from_user_id: 10,
    from_username: "lisa_git",
    is_read: 1,
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 10,
    user_id: 1,
    type: "reply",
    title: "Discussion Activity",
    message: "Tom replied to your answer about REST APIs",
    related_id: 345,
    related_type: "discussion",
    from_user_id: 11,
    from_username: "tom_api",
    is_read: 1,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 11,
    user_id: 1,
    type: "mention",
    title: "You were mentioned",
    message: "Nina mentioned you in a discussion about MongoDB",
    related_id: 678,
    related_type: "discussion",
    from_user_id: 12,
    from_username: "nina_mongo",
    is_read: 1,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 12,
    user_id: 1,
    type: "new_answer",
    title: "New Answer Posted",
    message: "Kevin answered your question about GraphQL",
    related_id: 901,
    related_type: "discussion",
    from_user_id: 13,
    from_username: "kevin_graphql",
    is_read: 1,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
*/

const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // Set to true to show Load More button
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    socket.on("new_notification", (notification: NotificationType) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/logo.png",
        });
      }
    });

    return () => {
      socket.off("new_notification");
    };
  }, [socket]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      // Real API call
      const response = await getNotifications(page, 5); // 5 notifications per page
      
      if (append) {
        setNotifications((prev) => [...prev, ...response.notifications]);
      } else {
        setNotifications(response.notifications);
      }
      
      setUnreadCount(response.unreadCount);
      setCurrentPage(page);
      setHasMore(page < response.pagination.pages);

      /* 🧪 MOCK DATA LOGIC - Only for testing without backend
      const LIMIT = 5;
      const skip = (page - 1) * LIMIT;
      const mockPage = allMockNotifications.slice(skip, skip + LIMIT);
      const totalPages = Math.ceil(allMockNotifications.length / LIMIT);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (append) {
        setNotifications((prev) => [...prev, ...mockPage]);
      } else {
        setNotifications(mockPage);
      }
      
      setUnreadCount(allMockNotifications.filter(n => n.is_read === 0).length);
      setCurrentPage(page);
      setHasMore(page < totalPages);
      */

      // Request notification permission if not already granted
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      // Don't show error to user for notifications, just log it
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationType) => {
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id.toString());
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: 1 } : n))
        );
      }

      // Navigate to the related discussion
      if (
        notification.related_id &&
        notification.related_type === "discussion"
      ) {
        navigate(`/discussions/${notification.related_id}`);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!loadingMore && hasMore) {
      await fetchNotifications(currentPage + 1, true); // Load next page and append
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_answer":
        return <MessageSquare size={16} className="text-blue-400" />;
      case "mention":
        return <AtSign size={16} className="text-alien-green" />;
      case "best_answer":
        return <Award size={16} className="text-yellow-400" />;
      case "reply":
        return <MessageCircle size={16} className="text-purple-400" />;
      default:
        return <Bell size={16} className="text-gray-400" />;
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-alien-green transition-colors duration-300 rounded-lg"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-smoke-gray border border-smoke-light rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-smoke-light flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="text-xs text-alien-green hover:text-alien-green-dark transition-colors duration-300 disabled:opacity-50"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors duration-300"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 border-b border-smoke-light/50 cursor-pointer hover:bg-smoke-light/30 transition-colors duration-300 ${
                    !notification.is_read
                      ? "bg-alien-green/5 border-l-2 border-l-alien-green"
                      : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p
                          className={`text-sm font-medium ${
                            !notification.is_read
                              ? "text-white"
                              : "text-gray-300"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-alien-green rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                        {notification.from_username && (
                          <p className="text-xs text-alien-green">
                            @{notification.from_username}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Load More Button */}
            {hasMore && notifications.length > 0 && (
              <div className="px-4 py-3 text-center border-t border-smoke-light/50">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="text-sm text-alien-green hover:text-alien-green-dark transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-smoke-light text-center">
              <button
                onClick={() => {
                  navigate("/discussions");
                  setIsOpen(false);
                }}
                className="text-xs text-alien-green hover:text-alien-green-dark transition-colors duration-300"
              >
                View All Discussions
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
