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
import type { Notification as AppNotification } from "../../types/discussions";
import { useSocket } from "../../contexts/SocketContext";

const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const socket = useSocket();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (isOpen) fetchNotifications(1);
  }, [isOpen]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handler = (notification: AppNotification) => {
      setNotifications((prev) => {
        // const exists = prev.some((n) => n.id === notification.id);
        const nid = getNotifId(notification);
        const exists = prev.some((n: any) => getNotifId(n) === nid);

        if (exists) return prev;

        if (!notification.is_read) {
          setUnreadCount((c) => c + 1);
        }

        return [notification, ...prev];
      });

      if (window.Notification?.permission === "granted") {
        new window.Notification(notification.title, {
          body: notification.message,
          icon: "/logo.png",
        });
      }
    };

    socket.on("new_notification", handler);

    return () => {
      socket.off("new_notification", handler);
    };
  }, [socket]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchNotifications(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getNotifId = (n: any) => (n?.id ?? n?._id)?.toString();

  const fetchNotifications = async (pageToFetch: number = 1) => {
    try {
      if (pageToFetch === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await getNotifications(pageToFetch);

      if (response.pagination?.pages) {
        setTotalPages(response.pagination.pages);
      }

      if (pageToFetch === 1) {
        setNotifications(response.notifications);
      } else {
        setNotifications((prev) => [...prev, ...response.notifications]);
      }

      setUnreadCount(
        typeof response.unreadCount === "number" ? response.unreadCount : 0
      );

      setPage(pageToFetch);

      // Request notification permission if not already granted
      if (window.Notification?.permission === "default") {
        window.Notification.requestPermission();
      }
    } catch (error) {
      // Don't show error to user for notifications, just log it
      console.error("Error fetching notifications:", error);
    } finally {
      if (pageToFetch === 1) setLoading(false);
      else setLoadingMore(false);
    }
  };

  const markAsRead = async (notificationId?: string) => {
    if (!notificationId) return;
    try {
      await markNotificationAsRead(notificationId);

      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
            getNotifId(notification) === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await markAllNotificationsAsRead();

      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({ ...notification, is_read: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.is_read) {
      await markAsRead(getNotifId(notification));
    }

    // Navigate to the related discussion
    if (notification.related_type === "discussion" && notification.related_id) {
      navigate(`/discussions/${notification.related_id}`);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_answer":
        return <MessageSquare size={16} className="text-blue-400" />;
      case "mention":
        return <AtSign size={16} className="text-green-400" />;
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
        className="relative p-2 text-gray-300 hover:text-alien-green transition-colors duration-300 rounded-lg overflow-visible"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 z-[9999] bg-red-500 text-white text-[10px] font-semibold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-smoke-gray border border-smoke-light rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-smoke-light flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-gray-400 hover:text-alien-green transition-colors duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors duration-300"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && page === 1 ? (
              <div className="p-4 text-center text-gray-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={getNotifId(notification)}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 border-b border-smoke-light cursor-pointer hover:bg-smoke-light/30 transition-colors duration-300 ${
                    !notification.is_read ? "bg-smoke-light/10" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-white truncate">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="ml-2 w-2 h-2 bg-alien-green rounded-full flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(getNotifId(notification));
                            }}
                            className="text-xs text-alien-green hover:text-alien-green-dark transition-colors duration-300 flex items-center space-x-1 cursor-pointer"
                          >
                            <Check size={12} />
                            <span>Mark as read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {page < totalPages && (
              <div className="p-3 text-center">
                <button
                  onClick={() => fetchNotifications(page + 1)}
                  disabled={loadingMore}
                  className="text-xs text-alien-green hover:text-alien-green-dark transition-colors duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>

          {/* {page < totalPages && (
            <div className="p-3 text-center">
              <button
                onClick={() => fetchNotifications(page + 1)}
                disabled={loadingMore}
                className="text-xs text-alien-green hover:text-alien-green-dark transition-colors duration-300 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )} */}

          {/* Footer */}
          {/* <div className="px-4 py-2 border-t border-smoke-light text-center">
            <button
              onClick={() => {
                navigate("/notifications");
                setIsOpen(false);
              }}
              className="text-xs text-alien-green hover:text-alien-green-dark transition-colors duration-300"
            >
              View all notifications
            </button>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
