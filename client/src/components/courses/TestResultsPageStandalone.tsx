import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Award,
  ArrowLeft,
  Download,
  Loader2,
} from "lucide-react";
import { getCertificateTestResult } from "../../utils/api";

interface TestResult {
  id: string;
  courseTitle: string;
  score: number;
  marksObtained: number;
  totalMarks: number;
  hasPassed: boolean;
  passingScore: number;
  evaluationResults: any[];
  submittedAt: string;
  timeLimit: number;
}

const TestResultsPageStandalone: React.FC = () => {
  const { courseId, testId } = useParams<{
    courseId: string;
    testId: string;
  }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestResult = async () => {
      if (!courseId || !testId) return;

      try {
        setLoading(true);
        const response = await getCertificateTestResult(courseId, testId);
        console.log("Test result response:", response);
        console.log("Evaluation results:", response.result.evaluationResults);
        setResult(response.result);
      } catch (error) {
        console.error("Error fetching test result:", error);
        setError("Failed to load test results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    // Security: Prevent back navigation to test/processing pages
    window.history.pushState(null, "", window.location.href);
    
    const handlePopState = (e: PopStateEvent) => {
      // Allow normal navigation but prevent going back to test pages
      const currentPath = window.location.pathname;
      if (currentPath.includes('/test/') && !currentPath.includes('/results')) {
        e.preventDefault();
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);

    fetchTestResult();

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [courseId, testId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 80) return "text-blue-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "mcq":
        return "bg-blue-600";
      case "true_false":
        return "bg-green-600";
      case "short_answer":
        return "bg-purple-600";
      case "coding":
        return "bg-orange-600";
      case "situational":
        return "bg-pink-600";
      default:
        return "bg-gray-600";
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "mcq":
        return "Multiple Choice";
      case "true_false":
        return "True/False";
      case "short_answer":
        return "Short Answer";
      case "coding":
        return "Coding";
      case "situational":
        return "Situational";
      default:
        return type;
    }
  };

  const handleBackToCourse = () => {
    navigate(`/courses/${courseId}`, { replace: true });
  };

  const handleDownloadCertificate = () => {
    // TODO: Implement certificate download functionality
    alert("Certificate download functionality will be implemented soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-royal-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-alien-green" />
          <p className="text-gray-400">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-royal-black text-white flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Results</h2>
          <p className="text-gray-400 mb-6">
            {error || "Test results not found."}
          </p>
          <button
            onClick={handleBackToCourse}
            className="bg-alien-green text-royal-black px-6 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-royal-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackToCourse}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Course</span>
          </button>
          <h1 className="text-2xl font-bold">Test Results</h1>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>

        {/* Results Summary */}
        <div className="bg-smoke-gray rounded-lg p-6 mb-8">
          <div className="text-center mb-6">
            <div
              className={`text-6xl font-bold mb-2 ${getScoreColor(
                result.score
              )}`}
            >
              {result.score}%
            </div>
            <div
              className={`text-2xl font-semibold mb-4 ${
                result.hasPassed ? "text-green-400" : "text-red-400"
              }`}
            >
              {result.hasPassed ? "PASSED" : "FAILED"}
            </div>
            <div className="text-gray-400">
              {result.marksObtained} out of {result.totalMarks} marks
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-smoke-light">
            <div className="text-center">
              <div className="text-xl font-semibold text-white">
                {result.courseTitle}
              </div>
              <div className="text-sm text-gray-400">Course</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-white">
                {result.passingScore}%
              </div>
              <div className="text-sm text-gray-400">Passing Score</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-white">
                {Math.floor(result.timeLimit / 60)}h {result.timeLimit % 60}m
              </div>
              <div className="text-sm text-gray-400">Time Limit</div>
            </div>
          </div>

          {result.hasPassed && (
            <div className="mt-6 pt-6 border-t border-smoke-light text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Award className="text-alien-green" size={24} />
                <span className="text-lg font-semibold text-alien-green">
                  Congratulations! You are eligible for the certificate.
                </span>
              </div>
              <button
                onClick={handleDownloadCertificate}
                className="bg-alien-green text-royal-black px-6 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors shadow-alien-glow flex items-center space-x-2 mx-auto"
              >
                <Download size={20} />
                <span>Download Certificate</span>
              </button>
            </div>
          )}
        </div>

        {/* Question-wise Results */}
        <div className="bg-smoke-gray rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
            <span>Question-wise Analysis</span>
            <span className="text-sm text-gray-400">
              ({result.evaluationResults?.length || 0} questions)
            </span>
          </h2>

          {result.evaluationResults && result.evaluationResults.length > 0 ? (
            <div className="space-y-4">
              {result.evaluationResults.map((evaluation, index) => (
                <div
                  key={evaluation.questionId || index}
                  className="border border-smoke-light rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-alien-green text-royal-black rounded-full font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getTypeColor(
                          evaluation.type
                        )}`}
                      >
                        {getTypeName(evaluation.type)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">
                        {evaluation.marksAwarded}/{evaluation.maxMarks}
                      </span>
                      {evaluation.marksAwarded === evaluation.maxMarks ? (
                        <CheckCircle className="text-green-400" size={20} />
                      ) : evaluation.marksAwarded > 0 ? (
                        <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-xs text-royal-black font-bold">
                            P
                          </span>
                        </div>
                      ) : (
                        <XCircle className="text-red-400" size={20} />
                      )}
                    </div>
                  </div>

                  {evaluation.question && (
                    <div className="mb-3">
                      <div className="text-sm text-gray-400 mb-1">
                        Question:
                      </div>
                      <div className="bg-royal-black p-3 rounded border-l-4 border-gray-500">
                        <p className="text-gray-300 text-sm">
                          {evaluation.question}
                        </p>
                      </div>
                    </div>
                  )}

                  {evaluation.userAnswer && (
                    <div className="mb-3">
                      <div className="text-sm text-gray-400 mb-1">
                        Your Answer:
                      </div>
                      <div className="bg-royal-black p-3 rounded border-l-4 border-blue-500">
                        <p className="text-gray-300 text-sm">
                          {evaluation.userAnswer}
                        </p>
                      </div>
                    </div>
                  )}

                  {evaluation.correctAnswer && evaluation.type === "mcq" && (
                    <div className="mb-3">
                      <div className="text-sm text-gray-400 mb-1">
                        Correct Answer:
                      </div>
                      <div className="bg-royal-black p-3 rounded border-l-4 border-green-500">
                        <p className="text-green-300 text-sm">
                          {evaluation.correctAnswer}
                        </p>
                      </div>
                    </div>
                  )}

                  {evaluation.feedback && (
                    <div>
                      <div className="text-sm text-gray-400 mb-1">
                        Feedback:
                      </div>
                      <div className="bg-royal-black p-3 rounded border-l-4 border-alien-green">
                        <p className="text-gray-300 text-sm">
                          {evaluation.feedback}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                No question analysis available
              </div>
              <div className="text-sm text-gray-500">
                The evaluation data might still be processing or there was an
                issue retrieving the detailed results.
              </div>
            </div>
          )}
        </div>

        {/* Test Information */}
        <div className="mt-6 bg-smoke-gray rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Test Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Submitted on:</span>
              <span className="ml-2 font-medium">
                {formatDate(result.submittedAt)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Test ID:</span>
              <span className="ml-2 font-mono text-xs">{result.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResultsPageStandalone;
