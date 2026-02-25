import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bug, Send, ArrowLeft, Monitor, Smartphone } from "lucide-react";
import SEO from '../../components/seo/SEO';


const BugReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stepsToReproduce: "",
    expectedBehavior: "",
    actualBehavior: "",
    severity: "medium",
    browserInfo: "",
    deviceInfo: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const severityLevels = [
    { value: "low", label: "Low - Minor issue", color: "text-green-400" },
    {
      value: "medium",
      label: "Medium - Moderate issue",
      color: "text-yellow-400",
    },
    { value: "high", label: "High - Major issue", color: "text-orange-400" },
    {
      value: "critical",
      label: "Critical - Blocks functionality",
      color: "text-red-400",
    },
  ];

  useEffect(() => {
    // Auto-detect browser and device info
    const getBrowserInfo = () => {
      const userAgent = navigator.userAgent;
      let browser = "Unknown";

      if (userAgent.includes("Chrome")) browser = "Chrome";
      else if (userAgent.includes("Firefox")) browser = "Firefox";
      else if (userAgent.includes("Safari")) browser = "Safari";
      else if (userAgent.includes("Edge")) browser = "Edge";

      return `${browser} - ${userAgent}`;
    };

    const getDeviceInfo = () => {
      const { platform, userAgent } = navigator;
      const screenInfo = `${screen.width}x${screen.height}`;
      return `Platform: ${platform}, Screen: ${screenInfo}, UA: ${userAgent}`;
    };

    setFormData((prev) => ({
      ...prev,
      browserInfo: getBrowserInfo(),
      deviceInfo: getDeviceInfo(),
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("auth_token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/feedback/bug-reports", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          title: "",
          description: "",
          stepsToReproduce: "",
          expectedBehavior: "",
          actualBehavior: "",
          severity: "medium",
          browserInfo: formData.browserInfo,
          deviceInfo: formData.deviceInfo,
        });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit bug report");
      }
    } catch (error) {
      console.error("Error submitting bug report:", error);
      alert("Failed to submit bug report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="smoke-card p-8 text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Bug className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-alien font-bold mb-4 text-red-400">
              Bug Report Submitted!
            </h2>
            <p className="text-gray-300 mb-6">
              Thank you for reporting this bug. Our development team will
              investigate and work on a fix as soon as possible.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setSubmitted(false)}
                className="alien-button px-6 py-2"
              >
                Report Another Bug
              </button>
              <button
                onClick={() => navigate("/")}
                className="alien-button-secondary px-6 py-2"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <SEO
        title="Report a Bug"
        description="Found a bug? Report it here and help us improve Edulume."
        canonicalUrl="https://edulume.site/report-bug"
      />
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-red-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Home
        </button>

        <div className="smoke-card p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
              <Bug className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-alien font-bold text-red-400">
                Report a Bug
              </h1>
              <p className="text-gray-400">
                Help us fix issues and improve Edulume
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bug Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-400 transition-colors"
                placeholder="Brief description of the bug"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Severity *
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-400 transition-colors"
              >
                {severityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-400 transition-colors resize-vertical"
                placeholder="Describe the bug in detail"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Steps to Reproduce
              </label>
              <textarea
                name="stepsToReproduce"
                value={formData.stepsToReproduce}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-400 transition-colors resize-vertical"
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expected Behavior
                </label>
                <textarea
                  name="expectedBehavior"
                  value={formData.expectedBehavior}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-400 transition-colors resize-vertical"
                  placeholder="What should happen?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Actual Behavior
                </label>
                <textarea
                  name="actualBehavior"
                  value={formData.actualBehavior}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-400 transition-colors resize-vertical"
                  placeholder="What actually happens?"
                />
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                <Monitor className="mr-2" size={16} />
                System Information (Auto-detected)
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Browser Info
                  </label>
                  <input
                    type="text"
                    name="browserInfo"
                    value={formData.browserInfo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-300 focus:outline-none focus:border-red-400"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Device Info
                  </label>
                  <input
                    type="text"
                    name="deviceInfo"
                    value={formData.deviceInfo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-gray-300 focus:outline-none focus:border-red-400"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                🐛 Tips for effective bug reports:
              </h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Be specific and clear in your description</li>
                <li>• Include exact error messages if any</li>
                <li>• Mention what you were trying to do</li>
                <li>
                  • Include screenshots if helpful (you can attach them later)
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Send className="mr-2" size={20} />
              )}
              {isSubmitting ? "Submitting..." : "Submit Bug Report"}
            </button>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};

export default BugReportPage;
