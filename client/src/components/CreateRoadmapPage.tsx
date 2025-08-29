import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Map,
  Eye,
  EyeOff,
  Loader2,
  BookOpen,
  Target,
  Zap,
} from "lucide-react";
import { generateRoadmap, createRoadmap } from "../utils/api";
import { RoadmapContent } from "../types";

const CreateRoadmapPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Topic, 2: Review, 3: Created
  const [topic, setTopic] = useState("");
  const [roadmapContent, setRoadmapContent] = useState<RoadmapContent | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState("");

  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setError("");

    try {
      const generatedRoadmap = await generateRoadmap(topic.trim());
      setRoadmapContent(generatedRoadmap);
      setStep(2);
    } catch (error) {
      console.error("Error generating roadmap:", error);
      setError(
        "Failed to generate roadmap. Please try again!"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateRoadmap = async () => {
    if (!roadmapContent) return;

    setIsCreating(true);
    setError("");

    try {
      const response = await createRoadmap({
        title: roadmapContent.title,
        description: roadmapContent.description,
        topic: topic.trim(),
        content: roadmapContent,
        isPublic,
      });

      navigate(`/roadmaps/${response.id}`);
    } catch (error) {
      console.error("Error creating roadmap:", error);
      setError("Failed to create roadmap. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-royal-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate("/roadmaps")}
            className="mr-4 p-2 rounded-lg hover:bg-smoke-gray transition-colors duration-200"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Create Learning Roadmap
            </h1>
            <p className="text-gray-400 mt-1">
              Generate a comprehensive learning path with AI assistance
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1
                  ? "bg-alien-green text-royal-black"
                  : "bg-smoke-gray text-gray-400"
              }`}
            >
              1
            </div>
            <div
              className={`w-16 h-1 ${
                step >= 2 ? "bg-alien-green" : "bg-smoke-gray"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2
                  ? "bg-alien-green text-royal-black"
                  : "bg-smoke-gray text-gray-400"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Topic Input */}
        {step === 1 && (
          <div className="bg-smoke-gray rounded-lg p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-alien-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-alien-glow">
                <Map className="text-royal-black" size={40} />
              </div>
              <h2 className="text-3xl font-bold mb-4 glow-text">
                What do you want to learn?
              </h2>
              <p className="text-gray-400 text-lg">
                Enter any topic and our AI will create a comprehensive learning
                roadmap with resources, projects, and career guidance
              </p>
            </div>

            <form
              onSubmit={handleGenerateRoadmap}
              className="max-w-2xl mx-auto"
            >
              <div className="mb-8">
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium text-gray-300 mb-3"
                >
                  Learning Topic
                </label>
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Full Stack Web Development, Machine Learning, Digital Marketing, Data Science, Mobile App Development..."
                  className="w-full px-6 py-4 bg-royal-black border border-smoke-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-alien-green focus:ring-2 focus:ring-alien-green/50 text-lg"
                  required
                />
                <div className="mt-3 text-sm text-gray-500">
                  💡 Be specific for better results. Examples: "React.js
                  Frontend Development", "Python Machine Learning", "Digital
                  Marketing for E-commerce"
                </div>
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={!topic.trim() || isGenerating}
                  className="bg-alien-green text-royal-black px-12 py-4 rounded-lg font-bold text-lg hover:bg-alien-green/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 mx-auto shadow-alien-glow"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      <span>Generating Your Roadmap...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Learning Roadmap</span>
                    </>
                  )}
                </button>

                {isGenerating && (
                  <div className="mt-4 text-sm text-gray-400">
                    This may take 30-60 seconds to generate a comprehensive
                    roadmap...
                  </div>
                )}
              </div>
            </form>

            {/* Feature highlights */}
            <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-alien-green/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Target className="text-alien-green" size={24} />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  Structured Learning
                </h3>
                <p className="text-sm text-gray-400">
                  Progressive stages from beginner to advanced with clear
                  milestones
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-alien-green/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="text-alien-green" size={24} />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  Curated Resources
                </h3>
                <p className="text-sm text-gray-400">
                  Hand-picked tutorials, courses, and documentation for each
                  stage
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-alien-green/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Zap className="text-alien-green" size={24} />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  Practical Projects
                </h3>
                <p className="text-sm text-gray-400">
                  Real-world projects to build your portfolio and skills
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review Generated Roadmap */}
        {step === 2 && roadmapContent && (
          <div className="bg-smoke-gray rounded-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Confirm Create</h2>
              <p className="text-gray-400">
                Your comprehensive learning roadmap has been generated. Review
                and customize before saving.
              </p>
            </div>

            <div className="bg-royal-black rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {roadmapContent.title}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {roadmapContent.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 mr-3 py-3 bg-smoke-light text-white rounded-lg hover:bg-smoke-light/80 transition-colors duration-300"
              >
                Back
              </button>
              <button
                onClick={handleCreateRoadmap}
                disabled={isCreating}
                className="px-8 py-3 bg-alien-green text-royal-black rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-alien-glow"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Creating Roadmap...</span>
                  </>
                ) : (
                  <>
                    <span>Create Roadmap</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateRoadmapPage;
