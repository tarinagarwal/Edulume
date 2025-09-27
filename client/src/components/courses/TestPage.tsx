import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Circle,
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  FileText,
  Code,
  MessageSquare,
  HelpCircle,
  Info,
  Timer,
} from "lucide-react";
import { submitCertificateTest } from "../../utils/api";
import { MarkdownRenderer } from "../ui/MarkdownRenderer";

interface Question {
  id: string;
  type: "mcq" | "true_false" | "short_answer" | "coding" | "situational";
  question: string;
  options?: string[];
  correctAnswer?: string;
  keyPoints?: string[];
  sampleAnswer?: string;
  marks: number;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
}

interface TestPageProps {
  test: {
    id: string;
    questions: Question[];
    timeLimit: number; // in minutes
    totalMarks: number;
    passingScore: number;
  };
  courseId: string;
  onTestComplete: (result: any) => void;
  onTestExit: () => void;
}

const TestPage: React.FC<TestPageProps> = ({
  test,
  courseId,
  onTestComplete,
  onTestExit,
}) => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(test.timeLimit * 60); // Convert to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "saved" | "saving" | "error"
  >("saved");

  const currentQuestion = test.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === test.questions.length - 1;

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleSubmitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save answers every 30 seconds
  useEffect(() => {
    const autoSave = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        setAutoSaveStatus("saving");
        // Simulate auto-save (in real implementation, you might save to localStorage or server)
        setTimeout(() => setAutoSaveStatus("saved"), 1000);
      }
    }, 30000);

    return () => clearInterval(autoSave);
  }, [answers]);

  // Prevent page refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        "Are you sure you want to leave? Your test will be auto-submitted.";
      return e.returnValue;
    };

    const handleUnload = () => {
      // Auto-submit on page unload
      handleSubmitTest(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
    };
  }, [answers]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleQuestionNavigation = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleSubmitTest = async (isAutoSubmit = false) => {
    if (!isAutoSubmit) {
      const unansweredQuestions = test.questions.filter(
        (q) => !answers[q.id] || answers[q.id] === ""
      );
      if (unansweredQuestions.length > 0) {
        setShowWarning(true);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = await submitCertificateTest(courseId, test.id, answers);
      onTestComplete(result.result);
    } catch (error) {
      console.error("Error submitting test:", error);
      alert("Failed to submit test. Please try again.");
      setIsSubmitting(false);
    }
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case "mcq":
        return <HelpCircle className="w-5 h-5 text-blue-400" />;
      case "true_false":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "short_answer":
        return <MessageSquare className="w-5 h-5 text-yellow-400" />;
      case "coding":
        return <Code className="w-5 h-5 text-purple-400" />;
      case "situational":
        return <FileText className="w-5 h-5 text-orange-400" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "hard":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const renderQuestionContent = () => {
    switch (currentQuestion.type) {
      case "mcq":
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <label
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg border border-smoke-light hover:border-alien-green cursor-pointer transition-colors duration-200"
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, e.target.value)
                  }
                  className="mt-1 text-alien-green focus:ring-alien-green"
                />
                <span className="text-gray-300 flex-1">{option}</span>
              </label>
            ))}
          </div>
        );

      case "true_false":
        return (
          <div className="space-y-3">
            {["true", "false"].map((option) => (
              <label
                key={option}
                className="flex items-start space-x-3 p-3 rounded-lg border border-smoke-light hover:border-alien-green cursor-pointer transition-colors duration-200"
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, e.target.value)
                  }
                  className="mt-1 text-alien-green focus:ring-alien-green"
                />
                <span className="text-gray-300 flex-1 capitalize">
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case "short_answer":
      case "situational":
        return (
          <div>
            <textarea
              value={answers[currentQuestion.id] || ""}
              onChange={(e) =>
                handleAnswerChange(currentQuestion.id, e.target.value)
              }
              placeholder="Enter your answer here..."
              className="w-full h-40 p-4 bg-royal-black border border-smoke-light rounded-lg text-white placeholder-gray-400 focus:border-alien-green focus:ring-1 focus:ring-alien-green resize-none"
            />
            <p className="text-gray-400 text-sm mt-2">
              Provide a detailed answer. Your response will be evaluated based
              on accuracy, completeness, and understanding.
            </p>
          </div>
        );

      case "coding":
        return (
          <div>
            <textarea
              value={answers[currentQuestion.id] || ""}
              onChange={(e) =>
                handleAnswerChange(currentQuestion.id, e.target.value)
              }
              placeholder="Enter your code or solution here..."
              className="w-full h-48 p-4 bg-royal-black border border-smoke-light rounded-lg text-white placeholder-gray-400 focus:border-alien-green focus:ring-1 focus:ring-alien-green resize-none font-mono"
            />
            <p className="text-gray-400 text-sm mt-2">
              Write your code solution. Focus on the logic and approach rather
              than perfect syntax.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  if (timeRemaining <= 0 && !isSubmitting) {
    return (
      <div className="min-h-screen bg-royal-black flex items-center justify-center p-4">
        <div className="bg-smoke-gray rounded-xl p-8 text-center max-w-md w-full">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Time's Up!</h2>
          <p className="text-gray-300 mb-4">
            The test time has expired. Your answers are being submitted
            automatically.
          </p>
          <div className="animate-spin w-8 h-8 border-4 border-alien-green border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-royal-black">
      {/* Header */}
      <div className="border-b border-smoke-light bg-smoke-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg sm:text-xl font-bold text-white">
                Certificate Test
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>
                  Question {currentQuestionIndex + 1} of {test.questions.length}
                </span>
                <span>•</span>
                <span>{currentQuestion.marks} marks</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Auto-save status */}
              <div className="flex items-center space-x-2 text-sm">
                <Save
                  className={`w-4 h-4 ${
                    autoSaveStatus === "saved"
                      ? "text-green-400"
                      : autoSaveStatus === "saving"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                />
                <span
                  className={
                    autoSaveStatus === "saved"
                      ? "text-green-400"
                      : autoSaveStatus === "saving"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }
                >
                  {autoSaveStatus === "saved"
                    ? "Saved"
                    : autoSaveStatus === "saving"
                    ? "Saving..."
                    : "Error"}
                </span>
              </div>

              {/* Timer */}
              <div
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  timeRemaining < 600
                    ? "bg-red-900/20 border border-red-500/30"
                    : "bg-royal-black"
                }`}
              >
                <Timer
                  className={`w-5 h-5 ${
                    timeRemaining < 600 ? "text-red-400" : "text-alien-green"
                  }`}
                />
                <span
                  className={`font-mono text-lg ${
                    timeRemaining < 600 ? "text-red-400" : "text-alien-green"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-smoke-gray rounded-lg p-4 sticky top-6">
              <h3 className="font-semibold text-white mb-4">Questions</h3>
              <div className="grid grid-cols-4 lg:grid-cols-1 gap-2">
                {test.questions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => handleQuestionNavigation(index)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      index === currentQuestionIndex
                        ? "bg-alien-green text-royal-black"
                        : answers[question.id]
                        ? "bg-green-600/20 text-green-400 border border-green-500/30"
                        : "bg-royal-black text-gray-400 hover:text-white border border-smoke-light"
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>{index + 1}</span>
                      {answers[question.id] && (
                        <CheckCircle className="w-3 h-3" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-alien-green rounded"></div>
                  <span className="text-gray-400">Current</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-600/20 border border-green-500/30 rounded"></div>
                  <span className="text-gray-400">Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-royal-black border border-smoke-light rounded"></div>
                  <span className="text-gray-400">Not answered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-smoke-gray rounded-lg p-6">
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex items-start space-x-3">
                  {getQuestionIcon(currentQuestion.type)}
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Question {currentQuestionIndex + 1}
                    </h2>
                    <div className="flex items-center space-x-4 mt-1 text-sm">
                      <span className="text-gray-400">
                        Type:{" "}
                        <span className="capitalize">
                          {currentQuestion.type.replace("_", " ")}
                        </span>
                      </span>
                      <span className="text-gray-400">
                        Topic: {currentQuestion.topic}
                      </span>
                      <span
                        className={`font-medium ${getDifficultyColor(
                          currentQuestion.difficulty
                        )}`}
                      >
                        {currentQuestion.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-royal-black px-3 py-2 rounded-lg">
                  <span className="text-alien-green font-semibold">
                    {currentQuestion.marks} marks
                  </span>
                </div>
              </div>

              {/* Question Content */}
              <div className="mb-8">
                <div className="bg-royal-black rounded-lg p-4 mb-6">
                  <MarkdownRenderer content={currentQuestion.question} />
                </div>

                {renderQuestionContent()}
              </div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-smoke-light">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors duration-300 flex items-center justify-center space-x-2"
                >
                  <ArrowLeft size={20} />
                  <span>Previous</span>
                </button>

                <div className="flex space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => setShowWarning(true)}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-6 py-3 bg-alien-green text-royal-black rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Send size={20} />
                    <span>Submit Test</span>
                  </button>

                  {!isLastQuestion && (
                    <button
                      onClick={handleNextQuestion}
                      className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-300 flex items-center justify-center space-x-2"
                    >
                      <span>Next</span>
                      <ArrowRight size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-smoke-gray rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                Submit Test?
              </h3>
              <p className="text-gray-300 mb-4">
                Are you sure you want to submit your test? This action cannot be
                undone.
              </p>
              {test.questions.filter(
                (q) => !answers[q.id] || answers[q.id] === ""
              ).length > 0 && (
                <p className="text-yellow-400 text-sm mb-4">
                  You have{" "}
                  {
                    test.questions.filter(
                      (q) => !answers[q.id] || answers[q.id] === ""
                    ).length
                  }{" "}
                  unanswered questions.
                </p>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowWarning(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitTest(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-alien-green text-royal-black rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submitting Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-smoke-gray rounded-xl p-8 text-center max-w-md w-full mx-4">
            <div className="animate-spin w-12 h-12 border-4 border-alien-green border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-white mb-2">
              Submitting Your Test
            </h3>
            <p className="text-gray-300">
              Please wait while we evaluate your answers...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPage;
