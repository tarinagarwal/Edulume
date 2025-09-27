import React from "react";
import { CheckCircle, XCircle, Award, ArrowLeft, Download } from "lucide-react";

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

interface TestResultsPageProps {
  result: TestResult;
  onBackToCourse: () => void;
  onDownloadCertificate: () => void;
}

const TestResultsPage: React.FC<TestResultsPageProps> = ({
  result,
  onBackToCourse,
  onDownloadCertificate,
}) => {
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

  return (
    <div className="min-h-screen bg-royal-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBackToCourse}
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
                onClick={onDownloadCertificate}
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
              ({result.evaluationResults.length} questions)
            </span>
          </h2>

          <div className="space-y-4">
            {result.evaluationResults.map((evaluation, index) => (
              <div
                key={evaluation.questionId}
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
                    <div className="text-sm text-gray-400 mb-1">Feedback:</div>
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

export default TestResultsPage;
