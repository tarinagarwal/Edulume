import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { getTestStatus } from "../../utils/api";

const TestProcessingPage: React.FC = () => {
  const { courseId, testId } = useParams<{
    courseId: string;
    testId: string;
  }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"processing" | "completed" | "error">(
    "processing"
  );
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Check test status periodically
  const checkTestStatus = async () => {
    if (!courseId || !testId) return;

    try {
      const response = await getTestStatus(courseId, testId);
      console.log("Test status check:", response);

      if (response.status === "completed") {
        setStatus("completed");
        // Build result object from status response
        setResult({
          score: response.score || 0,
          marksObtained: response.marksObtained || 0,
          totalMarks: response.totalMarks || 100,
          hasPassed: response.hasPassed || false,
          passingScore: 80,
          submittedAt: response.submittedAt,
        });
      } else if (response.status === "evaluation_failed") {
        setStatus("error");
        setError("Test evaluation failed. Please contact support.");
      }
      // If still processing, keep checking
    } catch (error) {
      console.error("Error checking test status:", error);
      setError("Failed to check test status. Please try again.");
      setStatus("error");
    }
  };

  // Start checking status
  useEffect(() => {
    if (!courseId || !testId) return;

    // Security: Prevent back navigation during processing
    window.history.pushState(null, "", window.location.href);
    
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);

    // Check immediately
    checkTestStatus();

    // Set up polling every 5 seconds
    const interval = setInterval(() => {
      if (status === "processing") {
        checkTestStatus();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [courseId, testId, status]);

  // Time elapsed counter
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleBackToCourse = () => {
    navigate(`/courses/${courseId}`, {
      replace: true, // Prevent back navigation
      state: { showTestResults: true, testResult: result },
    });
  };

  const handleViewResults = () => {
    navigate(`/courses/${courseId}/test/${testId}/results`, {
      replace: true, // Prevent back navigation
    });
  };

  if (status === "error") {
    return (
      <div className="min-h-screen bg-royal-black text-white">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="mb-6">
              <AlertCircle className="mx-auto text-red-400" size={64} />
            </div>
            <h1 className="text-2xl font-bold mb-4">Evaluation Error</h1>
            <p className="text-gray-400 mb-8">
              {error ||
                "An error occurred while evaluating your test. Please try again or contact support."}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/courses/${courseId}`)}
                className="w-full bg-alien-green text-royal-black px-6 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors"
              >
                Back to Course
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "completed" && result) {
    return (
      <div className="min-h-screen bg-royal-black text-white">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="mb-6">
              <CheckCircle
                className={`mx-auto ${
                  result.hasPassed ? "text-green-400" : "text-red-400"
                }`}
                size={64}
              />
            </div>

            <h1 className="text-2xl font-bold mb-2">
              Test Evaluation Complete!
            </h1>
            <p className="text-gray-400 mb-8">
              Your certificate test has been evaluated and results are ready.
            </p>

            {/* Quick Results Summary */}
            <div className="bg-smoke-gray rounded-lg p-6 mb-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-2xl font-bold text-alien-green">
                    {result.score}%
                  </div>
                  <div className="text-sm text-gray-400">Final Score</div>
                </div>
                <div>
                  <div
                    className={`text-2xl font-bold ${
                      result.hasPassed ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {result.hasPassed ? "PASSED" : "FAILED"}
                  </div>
                  <div className="text-sm text-gray-400">Result</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-smoke-light">
                <div className="text-sm text-gray-400">
                  {result.marksObtained} out of {result.totalMarks} marks
                  <span className="mx-2">•</span>
                  Passing score: {result.passingScore}%
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleViewResults}
                className="w-full bg-alien-green text-royal-black px-6 py-3 rounded-lg font-semibold hover:bg-alien-green/90 transition-colors"
              >
                View Detailed Results
              </button>
              <button
                onClick={handleBackToCourse}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Back to Course
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Processing state
  return (
    <div className="min-h-screen bg-royal-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center">
          {/* Processing Animation */}
          <div className="mb-6">
            <div className="relative">
              <div className="w-16 h-16 mx-auto border-4 border-alien-green border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-alien-green rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-4">Evaluating Your Test</h1>
          <p className="text-gray-400 mb-8">
            Our AI is carefully evaluating your answers. This process may take a
            few minutes.
          </p>

          {/* Processing Steps */}
          <div className="bg-smoke-gray rounded-lg p-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle
                  className="text-green-400 flex-shrink-0"
                  size={20}
                />
                <span className="text-left">Test submitted successfully</span>
              </div>
              <div className="flex items-center space-x-3">
                <Loader2
                  className="text-alien-green animate-spin flex-shrink-0"
                  size={20}
                />
                <span className="text-left">Analyzing your answers...</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-gray-400 rounded-full flex-shrink-0"></div>
                <span className="text-left text-gray-400">
                  Calculating final score
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-gray-400 rounded-full flex-shrink-0"></div>
                <span className="text-left text-gray-400">
                  Generating detailed feedback
                </span>
              </div>
            </div>
          </div>

          {/* Time Elapsed */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400 mb-8">
            <Clock size={16} />
            <span>Processing time: {formatTime(timeElapsed)}</span>
          </div>

          {/* Information */}
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4 mb-8">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex-shrink-0 mt-0.5"></div>
              <div className="text-left">
                <p className="text-blue-300 font-medium mb-1">
                  What's happening?
                </p>
                <p className="text-sm text-gray-300">
                  Our advanced AI system is evaluating each of your answers
                  against multiple criteria including accuracy, completeness,
                  and best practices. This ensures fair and comprehensive
                  assessment.
                </p>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center space-x-2 mx-auto px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Course (results will be available there)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestProcessingPage;
