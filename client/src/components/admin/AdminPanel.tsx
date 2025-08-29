import React, { useState, useEffect } from "react";
import {
  Shield,
  Lightbulb,
  Bug,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Filter,
  Search,
  Eye,
  Edit3,
} from "lucide-react";

interface FeatureSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  userName?: string;
  userEmail?: string;
  adminNotes?: string;
  createdAt: string;
  user?: {
    username: string;
    email: string;
  };
}

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo?: string;
  deviceInfo?: string;
  userName?: string;
  userEmail?: string;
  adminNotes?: string;
  createdAt: string;
  user?: {
    username: string;
    email: string;
  };
}

interface AdminStats {
  featureSuggestions: {
    total: number;
    pending: number;
  };
  bugReports: {
    total: number;
    open: number;
    critical: number;
  };
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "features" | "bugs">(
    "dashboard"
  );
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [featureSuggestions, setFeatureSuggestions] = useState<
    FeatureSuggestion[]
  >([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<
    FeatureSuggestion | BugReport | null
  >(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    features: { status: "", category: "" },
    bugs: { status: "", severity: "" },
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [statsRes, featuresRes, bugsRes] = await Promise.all([
        fetch("/api/feedback/admin/stats", { headers }),
        fetch("/api/feedback/feature-suggestions", { headers }),
        fetch("/api/feedback/bug-reports", { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (featuresRes.ok) {
        const featuresData = await featuresRes.json();
        setFeatureSuggestions(featuresData.suggestions);
      }

      if (bugsRes.ok) {
        const bugsData = await bugsRes.json();
        setBugReports(bugsData.bugReports);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateFeatureSuggestion = async (
    id: string,
    updates: Partial<FeatureSuggestion>
  ) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/feedback/feature-suggestions/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchAdminData();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error updating feature suggestion:", error);
    }
  };

  const updateBugReport = async (id: string, updates: Partial<BugReport>) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/feedback/bug-reports/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchAdminData();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error updating bug report:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "open":
        return "text-yellow-400";
      case "in-progress":
        return "text-blue-400";
      case "completed":
      case "resolved":
        return "text-green-400";
      case "rejected":
      case "closed":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "high":
        return "text-orange-400";
      case "critical":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-4 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-alien-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 bg-alien-green rounded-full flex items-center justify-center mr-4 shadow-alien-glow">
            <Shield className="text-royal-black" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-alien font-bold text-alien-green">
              Admin Panel
            </h1>
            <p className="text-gray-400">
              Manage feature suggestions and bug reports
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: "dashboard", label: "Dashboard", icon: TrendingUp },
            { id: "features", label: "Feature Suggestions", icon: Lightbulb },
            { id: "bugs", label: "Bug Reports", icon: Bug },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-alien-green text-royal-black"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <tab.icon className="mr-2" size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && stats && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="smoke-card p-6">
              <div className="flex items-center justify-between mb-4">
                <Lightbulb className="text-alien-green" size={24} />
                <span className="text-2xl font-bold text-white">
                  {stats.featureSuggestions.total}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Feature Suggestions
              </h3>
              <p className="text-gray-400">
                {stats.featureSuggestions.pending} pending review
              </p>
            </div>

            <div className="smoke-card p-6">
              <div className="flex items-center justify-between mb-4">
                <Bug className="text-red-400" size={24} />
                <span className="text-2xl font-bold text-white">
                  {stats.bugReports.total}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Bug Reports
              </h3>
              <p className="text-gray-400">
                {stats.bugReports.open} open issues
              </p>
            </div>

            <div className="smoke-card p-6">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="text-orange-400" size={24} />
                <span className="text-2xl font-bold text-white">
                  {stats.bugReports.critical}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Critical Bugs
              </h3>
              <p className="text-gray-400">Require immediate attention</p>
            </div>

            <div className="smoke-card p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="text-blue-400" size={24} />
                <span className="text-2xl font-bold text-white">
                  {stats.featureSuggestions.pending + stats.bugReports.open}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Pending Items
              </h3>
              <p className="text-gray-400">Awaiting review</p>
            </div>
          </div>
        )}

        {/* Feature Suggestions Tab */}
        {activeTab === "features" && (
          <div className="smoke-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                Feature Suggestions
              </h2>
              <div className="flex gap-4">
                <select
                  value={filters.features.status}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      features: { ...filters.features, status: e.target.value },
                    })
                  }
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={filters.features.category}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      features: {
                        ...filters.features,
                        category: e.target.value,
                      },
                    })
                  }
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                >
                  <option value="">All Categories</option>
                  <option value="ui">UI</option>
                  <option value="functionality">Functionality</option>
                  <option value="performance">Performance</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {featureSuggestions
                .filter(
                  (item) =>
                    (!filters.features.status ||
                      item.status === filters.features.status) &&
                    (!filters.features.category ||
                      item.category === filters.features.category)
                )
                .map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {suggestion.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">
                          {suggestion.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">
                            Category: {suggestion.category}
                          </span>
                          <span className="text-gray-500">
                            Priority: {suggestion.priority}
                          </span>
                          <span
                            className={`font-medium ${getStatusColor(
                              suggestion.status
                            )}`}
                          >
                            Status: {suggestion.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedItem(suggestion);
                          setShowModal(true);
                        }}
                        className="alien-button-secondary px-4 py-2 ml-4"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Submitted by:{" "}
                      {suggestion.user?.username ||
                        suggestion.userName ||
                        "Anonymous"}{" "}
                      •{new Date(suggestion.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Bug Reports Tab */}
        {activeTab === "bugs" && (
          <div className="smoke-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Bug Reports</h2>
              <div className="flex gap-4">
                <select
                  value={filters.bugs.status}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      bugs: { ...filters.bugs, status: e.target.value },
                    })
                  }
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={filters.bugs.severity}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      bugs: { ...filters.bugs, severity: e.target.value },
                    })
                  }
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                >
                  <option value="">All Severity</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {bugReports
                .filter(
                  (item) =>
                    (!filters.bugs.status ||
                      item.status === filters.bugs.status) &&
                    (!filters.bugs.severity ||
                      item.severity === filters.bugs.severity)
                )
                .map((bug) => (
                  <div
                    key={bug.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {bug.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">
                          {bug.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span
                            className={`font-medium ${getSeverityColor(
                              bug.severity
                            )}`}
                          >
                            Severity: {bug.severity}
                          </span>
                          <span
                            className={`font-medium ${getStatusColor(
                              bug.status
                            )}`}
                          >
                            Status: {bug.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedItem(bug);
                          setShowModal(true);
                        }}
                        className="alien-button-secondary px-4 py-2 ml-4"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Reported by:{" "}
                      {bug.user?.username || bug.userName || "Anonymous"} •
                      {new Date(bug.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Modal for editing items */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">
                {"severity" in selectedItem
                  ? "Edit Bug Report"
                  : "Edit Feature Suggestion"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedItem.status}
                    onChange={(e) =>
                      setSelectedItem({
                        ...selectedItem,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                  >
                    {"severity" in selectedItem ? (
                      <>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </>
                    ) : (
                      <>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </>
                    )}
                  </select>
                </div>

                {"severity" in selectedItem ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Severity
                    </label>
                    <select
                      value={selectedItem.severity}
                      onChange={(e) =>
                        setSelectedItem({
                          ...selectedItem,
                          severity: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={(selectedItem as FeatureSuggestion).priority}
                      onChange={(e) =>
                        setSelectedItem({
                          ...selectedItem,
                          priority: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={selectedItem.adminNotes || ""}
                    onChange={(e) =>
                      setSelectedItem({
                        ...selectedItem,
                        adminNotes: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    placeholder="Add internal notes..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => {
                      if ("severity" in selectedItem) {
                        updateBugReport(selectedItem.id, {
                          status: selectedItem.status,
                          severity: selectedItem.severity,
                          adminNotes: selectedItem.adminNotes,
                        });
                      } else {
                        updateFeatureSuggestion(selectedItem.id, {
                          status: selectedItem.status,
                          priority: (selectedItem as FeatureSuggestion)
                            .priority,
                          adminNotes: selectedItem.adminNotes,
                        });
                      }
                    }}
                    className="alien-button px-6 py-2"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="alien-button-secondary px-6 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
