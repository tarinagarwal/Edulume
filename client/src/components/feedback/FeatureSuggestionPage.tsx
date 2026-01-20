import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from '../../components/seo/SEO';
import { Lightbulb, Send, ArrowLeft } from "lucide-react";

const FeatureSuggestionPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "functionality",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { value: "ui", label: "User Interface" },
    { value: "functionality", label: "Functionality" },
    { value: "performance", label: "Performance" },
    { value: "other", label: "Other" },
  ];

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

      const response = await fetch("/api/feedback/feature-suggestions", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ title: "", description: "", category: "functionality" });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit feature suggestion");
      }
    } catch (error) {
      console.error("Error submitting feature suggestion:", error);
      alert("Failed to submit feature suggestion");
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
            <div className="w-16 h-16 bg-alien-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-alien-glow">
              <Lightbulb className="text-royal-black" size={32} />
            </div>
            <h2 className="text-2xl font-alien font-bold mb-4 text-alien-green">
              Thank You!
            </h2>
            <p className="text-gray-300 mb-6">
              Your feature suggestion has been submitted successfully. Our team
              will review it and consider it for future updates.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setSubmitted(false)}
                className="alien-button px-6 py-2"
              >
                Submit Another
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
        title="Suggest a Feature"
        description="Share your ideas and suggest new features to improve Edulume for everyone."
        canonicalUrl="https://edulume.site/suggest-feature"
    />
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-alien-green hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Home
        </button>

        <div className="smoke-card p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-alien-green rounded-full flex items-center justify-center mr-4 shadow-alien-glow">
              <Lightbulb className="text-royal-black" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-alien font-bold text-alien-green">
                Suggest a Feature
              </h1>
              <p className="text-gray-400">
                Help us improve Edulume with your ideas
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Feature Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-alien-green transition-colors "
                placeholder="Brief title for your feature suggestion"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-alien-green transition-colors"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
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
                rows={6}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-alien-green transition-colors resize-vertical"
                placeholder="Describe your feature suggestion in detail. What problem would it solve? How would it work?"
              />
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                💡 Tips for a great suggestion:
              </h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Be specific about what you want</li>
                <li>• Explain why it would be useful</li>
                <li>• Consider how it fits with existing features</li>
                <li>• Include examples if possible</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full alien-button py-3 flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-royal-black border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Send className="mr-2" size={20} />
              )}
              {isSubmitting ? "Submitting..." : "Submit Feature Suggestion"}
            </button>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};

export default FeatureSuggestionPage;
