import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { generateCourseOutline, createCourse } from "../utils/api";
import { CourseOutline } from "../types";

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Topic, 2: Outline, 3: Review
  const [topic, setTopic] = useState("");
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  const handleGenerateOutline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const generatedOutline = await generateCourseOutline(topic.trim());
      setOutline(generatedOutline);
      setStep(2);
    } catch (error) {
      console.error("Error generating outline:", error);
      alert("Failed to generate course outline. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!outline) return;

    setIsCreating(true);
    try {
      const response = await createCourse({
        title: outline.title,
        description: outline.description,
        topic: topic.trim(),
        chapters: outline.chapters,
        isPublic,
      });

      navigate(`/courses/${response.id}`);
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Failed to create course. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const updateChapter = (index: number, field: string, value: string) => {
    if (!outline) return;

    const updatedChapters = [...outline.chapters];
    updatedChapters[index] = { ...updatedChapters[index], [field]: value };
    setOutline({ ...outline, chapters: updatedChapters });
  };

  const addChapter = () => {
    if (!outline) return;

    const newChapter = {
      title: "",
      description: "",
      order_index: outline.chapters.length + 1,
    };
    setOutline({
      ...outline,
      chapters: [...outline.chapters, newChapter],
    });
  };

  const removeChapter = (index: number) => {
    if (!outline) return;

    const updatedChapters = outline.chapters.filter((_, i) => i !== index);
    // Update order indices
    const reorderedChapters = updatedChapters.map((chapter, i) => ({
      ...chapter,
      order_index: i + 1,
    }));
    setOutline({ ...outline, chapters: reorderedChapters });
  };

  return (
    <div className="min-h-screen bg-royal-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate("/courses")}
            className="mr-4 p-2 rounded-lg hover:bg-smoke-gray transition-colors duration-200"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Create New Course</h1>
            <p className="text-gray-400 mt-1">
              Generate a comprehensive course with AI assistance
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
            <div
              className={`w-16 h-1 ${
                step >= 3 ? "bg-alien-green" : "bg-smoke-gray"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 3
                  ? "bg-alien-green text-royal-black"
                  : "bg-smoke-gray text-gray-400"
              }`}
            >
              3
            </div>
          </div>
        </div>

        {/* Step 1: Topic Input */}
        {step === 1 && (
          <div className="bg-smoke-gray rounded-lg p-8">
            <div className="text-center mb-8">
              <Sparkles className="mx-auto text-alien-green mb-4" size={48} />
              <h2 className="text-2xl font-bold mb-2">
                What would you like to teach?
              </h2>
              <p className="text-gray-400">
                Enter a topic and our AI will generate a comprehensive course
                outline for you
              </p>
            </div>

            <form
              onSubmit={handleGenerateOutline}
              className="max-w-2xl mx-auto"
            >
              <div className="mb-6">
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Course Topic
                </label>
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., React.js for Beginners, Digital Marketing Fundamentals, Python Data Science..."
                  className="w-full px-4 py-3 bg-royal-black border border-smoke-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-alien-green focus:ring-1 focus:ring-alien-green"
                  required
                />
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={!topic.trim() || isGenerating}
                  className="bg-alien-green text-royal-black px-8 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto shadow-alien-glow"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Generating Outline...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      <span>Generate Course Outline</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Edit Outline */}
        {step === 2 && outline && (
          <div className="bg-smoke-gray rounded-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                Review & Edit Course Outline
              </h2>
              <p className="text-gray-400">
                Customize the generated outline to match your vision
              </p>
            </div>

            <div className="space-y-6">
              {/* Course Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Course Title
                </label>
                <input
                  type="text"
                  value={outline.title}
                  onChange={(e) =>
                    setOutline({ ...outline, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-royal-black border border-smoke-light rounded-lg text-white focus:outline-none focus:border-alien-green focus:ring-1 focus:ring-alien-green"
                />
              </div>

              {/* Course Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Course Description
                </label>
                <textarea
                  value={outline.description}
                  onChange={(e) =>
                    setOutline({ ...outline, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 bg-royal-black border border-smoke-light rounded-lg text-white focus:outline-none focus:border-alien-green focus:ring-1 focus:ring-alien-green resize-none"
                />
              </div>

              {/* Chapters */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-300">
                    Chapters ({outline.chapters.length})
                  </label>
                  <button
                    onClick={addChapter}
                    className="flex items-center space-x-2 text-alien-green hover:text-alien-green/80 transition-colors duration-200"
                  >
                    <Plus size={16} />
                    <span>Add Chapter</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {outline.chapters.map((chapter, index) => (
                    <div
                      key={index}
                      className="bg-royal-black border border-smoke-light rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm text-gray-400 font-medium">
                          Chapter {index + 1}
                        </span>
                        {outline.chapters.length > 1 && (
                          <button
                            onClick={() => removeChapter(index)}
                            className="text-red-400 hover:text-red-300 transition-colors duration-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          value={chapter.title}
                          onChange={(e) =>
                            updateChapter(index, "title", e.target.value)
                          }
                          placeholder="Chapter title"
                          className="w-full px-3 py-2 bg-smoke-gray border border-smoke-light rounded text-white placeholder-gray-400 focus:outline-none focus:border-alien-green focus:ring-1 focus:ring-alien-green"
                        />
                        <textarea
                          value={chapter.description}
                          onChange={(e) =>
                            updateChapter(index, "description", e.target.value)
                          }
                          placeholder="Chapter description"
                          rows={2}
                          className="w-full px-3 py-2 bg-smoke-gray border border-smoke-light rounded text-white placeholder-gray-400 focus:outline-none focus:border-alien-green focus:ring-1 focus:ring-alien-green resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visibility Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {/* Course Visibility */}
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsPublic(true)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                      isPublic
                        ? " text-royal-black"
                        : "bg-royal-black text-gray-300 border-smoke-light hover:border-alien-green"
                    }`}
                  >
                    {/* <Eye size={16} /> */}
                    {/* <span>Public</span> */}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-smoke-light text-white rounded-lg hover:bg-smoke-light/80 transition-colors duration-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-alien-green text-royal-black rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 shadow-alien-glow"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Final Review */}
        {step === 3 && outline && (
          <div className="bg-smoke-gray rounded-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Final Review</h2>
              <p className="text-gray-400">
                Review your course details before creating
              </p>
            </div>

            <div className="bg-royal-black rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                {outline.title}
              </h3>
              <p className="text-gray-300 mb-4">{outline.description}</p>

              <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center space-x-1">
                  <BookOpen size={16} />
                  <span>{outline.chapters.length} chapters</span>
                </div>
                <div className="flex items-center space-x-1">
                  {isPublic ? <Eye size={16} /> : <EyeOff size={16} />}
                  <span>{isPublic ? "Public" : "Private"}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Chapters:</h4>
                <div className="space-y-2">
                  {outline.chapters.map((chapter, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-alien-green font-medium">
                        {index + 1}. {chapter.title}
                      </span>
                      <p className="text-gray-400 ml-4">
                        {chapter.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 mr-2 py-3 bg-smoke-light text-white rounded-lg hover:bg-smoke-light/80 transition-colors duration-300"
              >
                Back to Edit
              </button>
              <button
                onClick={handleCreateCourse}
                disabled={isCreating}
                className="px-6 py-3 bg-alien-green text-royal-black rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-alien-glow"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Creating Course...</span>
                  </>
                ) : (
                  <>
                    <span>Create Course</span>
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

export default CreateCoursePage;
