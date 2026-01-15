import React, { useState, useEffect } from "react";
import {
  Shield,
  Lightbulb,
  Bug,
  TrendingUp,
  Clock,
  AlertTriangle,
  Edit3,
} from "lucide-react";

/* ===================== TYPES ===================== */
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
  featureSuggestions: { total: number; pending: number };
  bugReports: { total: number; open: number; critical: number };
}

type TabId = "dashboard" | "features" | "bugs";

/* ===================== CONFIG ===================== */
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp },
  { id: "features", label: "Feature Suggestions", icon: Lightbulb },
  { id: "bugs", label: "Bug Reports", icon: Bug },
];

const FEATURE_STATUS = ["pending", "in-progress", "completed", "rejected"];
const FEATURE_CATEGORIES = ["ui", "functionality", "performance", "other"];

const BUG_STATUS = ["open", "in-progress", "resolved", "closed"];
const BUG_SEVERITY = ["low", "medium", "high", "critical"];

const STATUS_OPTIONS = {
  feature: FEATURE_STATUS,
  bug: BUG_STATUS,
};

const renderOptions = (items: string[], empty: string) => (
  <>
    <option value="">{empty}</option>
    {items.map((i) => (
      <option key={i} value={i}>
        {i.charAt(0).toUpperCase() + i.slice(1).replace("-", " ")}
      </option>
    ))}
  </>
);

/* ===================== COMPONENT ===================== */
const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [featureSuggestions, setFeatureSuggestions] = useState<FeatureSuggestion[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<FeatureSuggestion | BugReport | null>(null);
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
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      const [statsRes, featuresRes, bugsRes] = await Promise.all([
        fetch("/api/feedback/admin/stats", { headers }),
        fetch("/api/feedback/feature-suggestions", { headers }),
        fetch("/api/feedback/bug-reports", { headers }),
      ]);

      if (statsRes.ok) setStats((await statsRes.json()).stats);
      if (featuresRes.ok) setFeatureSuggestions((await featuresRes.json()).suggestions);
      if (bugsRes.ok) setBugReports((await bugsRes.json()).bugReports);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateFeatureSuggestion = async (id: string, updates: Partial<FeatureSuggestion>) => {
    const token = localStorage.getItem("auth_token");
    await fetch(`/api/feedback/feature-suggestions/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    fetchAdminData();
    setShowModal(false);
  };

  const updateBugReport = async (id: string, updates: Partial<BugReport>) => {
    const token = localStorage.getItem("auth_token");
    await fetch(`/api/feedback/bug-reports/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    fetchAdminData();
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-alien-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 bg-alien-green rounded-full flex items-center justify-center mr-4">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-alien-green">Admin Panel</h1>
            <p className="text-gray-400">Manage feedback</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex space-x-1 mb-8">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-6 py-3 rounded-lg flex items-center ${
                activeTab === id
                  ? "bg-alien-green text-black"
                  : "bg-gray-800 text-gray-300"
              }`}
            >
              <Icon size={20} className="mr-2" />
              {label}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && stats && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{
              icon: Lightbulb,
              color: "text-alien-green",
              value: stats.featureSuggestions.total,
              title: "Feature Suggestions",
            },{
              icon: Bug,
              color: "text-red-400",
              value: stats.bugReports.total,
              title: "Bug Reports",
            },{
              icon: AlertTriangle,
              color: "text-orange-400",
              value: stats.bugReports.critical,
              title: "Critical Bugs",
            },{
              icon: Clock,
              color: "text-blue-400",
              value: stats.featureSuggestions.pending + stats.bugReports.open,
              title: "Pending Items",
            }].map(({ icon: Icon, color, value, title }) => (
              <div key={title} className="smoke-card p-6">
                <div className="flex justify-between mb-4">
                  <Icon className={color} size={24} />
                  <span className="text-2xl font-bold text-white">{value}</span>
                </div>
                <h3 className="text-white font-semibold">{title}</h3>
              </div>
            ))}
          </div>
        )}

        {/* FEATURES */}
        {activeTab === "features" && (
          <div className="smoke-card p-6">
            <div className="flex gap-4 mb-4">
              <select
                value={filters.features.status}
                onChange={(e) => setFilters({ ...filters, features: { ...filters.features, status: e.target.value } })}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
              >
                {renderOptions(FEATURE_STATUS, "All Status")}
              </select>

              <select
                value={filters.features.category}
                onChange={(e) => setFilters({ ...filters, features: { ...filters.features, category: e.target.value } })}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
              >
                {renderOptions(FEATURE_CATEGORIES, "All Categories")}
              </select>
            </div>

            {featureSuggestions.map((f) => (
              <div key={f.id} className="bg-gray-800 p-4 rounded mb-3">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-white font-semibold">{f.title}</h3>
                    <p className="text-gray-400 text-sm">{f.description}</p>
                  </div>
                  <button onClick={() => { setSelectedItem(f); setShowModal(true); }}>
                    <Edit3 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BUGS */}
        {activeTab === "bugs" && (
          <div className="smoke-card p-6">
            <div className="flex gap-4 mb-4">
              <select
                value={filters.bugs.status}
                onChange={(e) => setFilters({ ...filters, bugs: { ...filters.bugs, status: e.target.value } })}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
              >
                {renderOptions(BUG_STATUS, "All Status")}
              </select>

              <select
                value={filters.bugs.severity}
                onChange={(e) => setFilters({ ...filters, bugs: { ...filters.bugs, severity: e.target.value } })}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
              >
                {renderOptions(BUG_SEVERITY, "All Severity")}
              </select>
            </div>

            {bugReports.map((b) => (
              <div key={b.id} className="bg-gray-800 p-4 rounded mb-3">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-white font-semibold">{b.title}</h3>
                    <p className="text-gray-400 text-sm">{b.description}</p>
                  </div>
                  <button onClick={() => { setSelectedItem(b); setShowModal(true); }}>
                    <Edit3 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-900 p-6 rounded w-full max-w-xl">
              <select
                value={selectedItem.status}
                onChange={(e) => setSelectedItem({ ...selectedItem, status: e.target.value })}
                className="w-full mb-4 bg-gray-800 border border-gray-700 rounded px-3 py-2"
              >
                {("severity" in selectedItem ? STATUS_OPTIONS.bug : STATUS_OPTIONS.feature).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <button
                onClick={() =>
                  "severity" in selectedItem
                    ? updateBugReport(selectedItem.id, selectedItem)
                    : updateFeatureSuggestion(selectedItem.id, selectedItem)
                }
                className="alien-button"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;