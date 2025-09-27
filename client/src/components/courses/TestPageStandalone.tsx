"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { submitCertificateTest, validateTestAccess } from "../../utils/api";

interface Question {
  id: string;
  type: "mcq" | "true_false" | "short_answer" | "coding" | "situational";
  question: string;
  options?: string[];
  marks: number;
}

interface TestData {
  id: string;
  questions: Question[];
  instructions: any;
  timeLimit: number;
  passingScore: number;
  totalMarks: number;
  createdAt: string;
}

const TestPageStandalone: React.FC = () => {
  const { courseId, testId } = useParams<{
    courseId: string;
    testId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [testData, setTestData] = useState<TestData | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Security: Validate test access on component mount
  useEffect(() => {
    const validateAccess = async () => {
      if (!courseId || !testId) {
        setAccessDenied(true);
        setAccessError("Invalid test parameters");
        setLoading(false);
        return;
      }

      try {
        console.log("🔐 Validating test access...");
        await validateTestAccess(courseId, testId);
        console.log("✅ Test access validated");
      } catch (error: any) {
        console.error("❌ Test access denied:", error);

        // Clear any stored test data for security
        localStorage.removeItem(`test_${testId}`);
        localStorage.removeItem(`test_answers_${testId}`);

        setAccessDenied(true);
        setAccessError(
          error.response?.data?.error || "Access denied to this test"
        );
        setLoading(false);
        return;
      }

      // If validation passes, load test data
      loadTestData();
    };

    const loadTestData = () => {
      let data: TestData | null = null;

      if (location.state?.testData) {
        data = location.state.testData;
      } else if (testId) {
        const stored = localStorage.getItem(`test_${testId}`);
        if (stored) {
          try {
            data = JSON.parse(stored);
          } catch (error) {
            console.error("Failed to parse stored test data:", error);
          }
        }
      }

      if (data) {
        // Ensure each question has an ID - this is critical for state management
        if (data.questions && Array.isArray(data.questions)) {
          data.questions = data.questions.map((question, index) => {
            if (!question.id) {
              return {
                ...question,
                id: `question_${index}_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              };
            }
            return question;
          });
        }

        setTestData(data);
        setTimeRemaining(data.timeLimit * 60);
        const savedAnswers = localStorage.getItem(`test_answers_${testId}`);
        if (savedAnswers) {
          try {
            setAnswers(JSON.parse(savedAnswers));
          } catch (error) {
            console.error("Failed to parse saved answers:", error);
          }
        }
      } else {
        navigate(`/courses/${courseId}`);
        return;
      }

      setLoading(false);
    };

    validateAccess();
  }, [testId, location.state, navigate, courseId]);

  useEffect(() => {
    if (testId && Object.keys(answers).length > 0) {
      localStorage.setItem(`test_answers_${testId}`, JSON.stringify(answers));
    }
  }, [answers, testId]);

  useEffect(() => {
    if (timeRemaining <= 0 || !testData) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, testData]);

  // Security: Prevent navigation away from test (back button, etc.)
  useEffect(() => {
    if (!testData || accessDenied) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      handleSubmitTest(true);
      return "";
    };

    const handleUnload = () => {
      handleSubmitTest(true);
    };

    // Prevent back button navigation
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      const confirmExit = window.confirm(
        "Are you sure you want to leave the test? Your answers will be submitted automatically."
      );
      if (confirmExit) {
        handleSubmitTest(true);
      } else {
        // Push current state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
      }
    };

    // Add an extra history entry to prevent easy back navigation
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [testData, accessDenied]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitTest = async (isAutoSubmit = false) => {
    if (isSubmitting) return;

    if (!isAutoSubmit) {
      const confirmed = window.confirm(
        "Are you sure you want to submit your test? This action cannot be undone."
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);

    try {
      if (!courseId || !testId || !testData) {
        throw new Error("Missing course, test ID, or test data");
      }

      // Convert answers object to array format expected by server
      const answersArray = testData.questions.map((question, index) => {
        const questionId = question.id || `fallback_${index}_${Date.now()}`;
        return answers[questionId] || null; // Use null for unanswered questions
      });

      await submitCertificateTest(courseId, testId, answersArray);

      localStorage.removeItem(`test_${testId}`);
      localStorage.removeItem(`test_answers_${testId}`);

      // Use replace to prevent back navigation to test page
      navigate(`/courses/${courseId}/test/${testId}/processing`, {
        replace: true,
      });
    } catch (error) {
      console.error("Error submitting test:", error);
      setIsSubmitting(false);
      alert("Failed to submit test. Please try again.");
    }
  };

  const handleExitTest = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    handleSubmitTest(true);
  };

  const renderQuestion = (question: Question, index: number) => {
    // Ensure question has an ID - fallback if somehow it's still missing
    const questionId = question.id || `fallback_${index}_${Date.now()}`;

    // Get answer specifically for this question ID
    const currentAnswer = answers[questionId];

    switch (question.type) {
      case "mcq":
        return (
          <div className="space-y-3">
            {question.options?.map((option, optIndex) => (
              <label
                key={`${questionId}-mcq-${optIndex}-${option}`}
                className="flex items-start space-x-3 p-3 rounded-lg border border-smoke-light hover:bg-smoke-gray/50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name={`question_${questionId}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) =>
                    handleAnswerChange(questionId, e.target.value)
                  }
                  className="mt-0.5 w-4 h-4 text-alien-green border-gray-300 focus:ring-alien-green focus:ring-2 flex-shrink-0"
                  id={`${questionId}-mcq-${optIndex}`}
                />
                <span className="text-gray-300 text-sm sm:text-base break-words">
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case "true_false":
        return (
          <div className="space-y-3">
            {["True", "False"].map((option, optIndex) => (
              <label
                key={`${questionId}-tf-${optIndex}-${option}`}
                className="flex items-center space-x-3 p-3 rounded-lg border border-smoke-light hover:bg-smoke-gray/50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name={`question_${questionId}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) =>
                    handleAnswerChange(questionId, e.target.value)
                  }
                  className="w-4 h-4 text-alien-green border-gray-300 focus:ring-alien-green focus:ring-2 flex-shrink-0"
                  id={`${questionId}-tf-${optIndex}`}
                />
                <span className="text-gray-300 text-sm sm:text-base">
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case "short_answer":
      case "situational":
        return (
          <textarea
            key={`${questionId}-textarea`}
            value={currentAnswer || ""}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            placeholder="Enter your answer here..."
            className="w-full h-32 sm:h-40 p-3 bg-smoke-gray border border-smoke-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-alien-green resize-none text-sm sm:text-base"
            id={`${questionId}-textarea`}
          />
        );

      case "coding":
        return (
          <textarea
            key={`${questionId}-coding`}
            value={currentAnswer || ""}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            placeholder="Write your code here..."
            className="w-full h-48 sm:h-64 p-3 bg-smoke-gray border border-smoke-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-alien-green font-mono text-xs sm:text-sm resize-none"
            id={`${questionId}-coding`}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-royal-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-alien-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Validating test access...</p>
        </div>
      </div>
    );
  }

  // Security: Show access denied screen
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-royal-black text-white flex items-center justify-center p-4">
        <div className="smoke-card p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-alien font-bold mb-4 text-red-400">
            Access Denied
          </h2>
          <p className="text-gray-300 mb-6">
            {accessError || "You don't have permission to access this test."}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="w-full bg-alien-green text-royal-black px-6 py-2 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors"
            >
              Return to Course
            </button>
            <button
              onClick={() => navigate("/courses")}
              className="w-full px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="min-h-screen bg-royal-black text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Test Not Found</h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">
            The test you're looking for could not be loaded.
          </p>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="bg-alien-green text-royal-black px-6 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors text-sm sm:text-base"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  const currentQ = testData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / testData.questions.length) * 100;
  const answeredQuestions = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-royal-black text-white">
      <div className="sticky top-0 bg-smoke-gray border-b border-smoke-light z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <button
                onClick={handleExitTest}
                className="p-2 hover:bg-royal-black rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg font-semibold truncate">
                  Certificate Test
                </h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  Question {currentQuestion + 1} of {testData.questions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-6 flex-shrink-0">
              <div
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg ${
                  timeRemaining < 600
                    ? "bg-red-600/20 text-red-400"
                    : "bg-alien-green/20 text-alien-green"
                }`}
              >
                <Clock size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="font-mono font-semibold text-xs sm:text-sm">
                  {formatTime(timeRemaining)}
                </span>
              </div>

              <div className="hidden xs:flex items-center space-x-2">
                <span className="text-xs sm:text-sm text-gray-400">
                  Progress:
                </span>
                <span className="text-xs sm:text-sm font-semibold">
                  {answeredQuestions}/{testData.questions.length}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 sm:mt-3">
            <div className="w-full bg-royal-black rounded-full h-1.5 sm:h-2">
              <div
                className="bg-alien-green h-1.5 sm:h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="bg-smoke-gray rounded-lg p-4 sm:p-6">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-alien-green text-royal-black px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                    Question {currentQuestion + 1}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-400">
                    ({currentQ.marks} mark{currentQ.marks !== 1 ? "s" : ""})
                  </span>
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                    {currentQ.type.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-white leading-relaxed break-words">
                  {currentQ.question}
                </h2>
              </div>
              {answers[currentQ.id] && (
                <CheckCircle
                  className="text-alien-green flex-shrink-0 ml-2 sm:ml-4"
                  size={18}
                />
              )}
            </div>

            <div key={`question-${currentQ.id}`}>
              {renderQuestion(currentQ, currentQuestion)}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-smoke-light">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <button
                onClick={() =>
                  setCurrentQuestion(Math.max(0, currentQuestion - 1))
                }
                disabled={currentQuestion === 0}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg transition-colors text-sm"
              >
                <ArrowLeft size={14} />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setShowQuestionNav(!showQuestionNav)}
                className="sm:hidden flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-sm"
              >
                <Menu size={14} />
                <span>Questions</span>
              </button>

              {currentQuestion < testData.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-alien-green text-royal-black hover:bg-alien-green/90 rounded-lg transition-colors font-semibold text-sm"
                >
                  <span>Next</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => handleSubmitTest(false)}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-4 sm:px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors font-semibold text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      <span>Submit Test</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center space-x-1 max-w-md overflow-x-auto">
              {testData.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-8 h-8 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${
                    index === currentQuestion
                      ? "bg-alien-green text-royal-black"
                      : answers[
                          testData.questions[index].id ||
                            `fallback_${index}_navigation`
                        ]
                      ? "bg-green-600 text-white"
                      : "bg-gray-600 hover:bg-gray-500 text-gray-300"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {showQuestionNav && (
            <div className="sm:hidden mt-4 p-4 bg-royal-black rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Questions</h3>
                <button
                  onClick={() => setShowQuestionNav(false)}
                  className="p-1 hover:bg-smoke-gray rounded"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {testData.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentQuestion(index);
                      setShowQuestionNav(false);
                    }}
                    className={`w-10 h-10 rounded-full text-sm font-semibold transition-colors ${
                      index === currentQuestion
                        ? "bg-alien-green text-royal-black"
                        : answers[
                            testData.questions[index].id ||
                              `fallback_${index}_mobile_navigation`
                          ]
                        ? "bg-green-600 text-white"
                        : "bg-gray-600 hover:bg-gray-500 text-gray-300"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 sm:mt-6 bg-smoke-gray rounded-lg p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
            <div className="flex justify-between sm:block">
              <span className="text-gray-400">Total Questions:</span>
              <span className="ml-2 font-semibold">
                {testData.questions.length}
              </span>
            </div>
            <div className="flex justify-between sm:block">
              <span className="text-gray-400">Total Marks:</span>
              <span className="ml-2 font-semibold">{testData.totalMarks}</span>
            </div>
            <div className="flex justify-between sm:block">
              <span className="text-gray-400">Passing Score:</span>
              <span className="ml-2 font-semibold">
                {testData.passingScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {showExitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-smoke-gray rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle
                className="text-yellow-400 flex-shrink-0"
                size={20}
              />
              <h3 className="text-lg font-semibold">Exit Test?</h3>
            </div>
            <p className="text-gray-300 mb-6 text-sm sm:text-base">
              If you exit now, your test will be automatically submitted with
              your current answers. This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-sm sm:text-base"
              >
                Continue Test
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm sm:text-base"
              >
                Exit & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPageStandalone;
