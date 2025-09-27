import React from "react";
import {
  X,
  Clock,
  AlertTriangle,
  Award,
  CheckCircle,
  Info,
} from "lucide-react";

interface TestInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTest: () => void;
  instructions: {
    title?: string;
    duration?: string;
    totalQuestions?: number;
    totalMarks?: number;
    passingScore?: number;
    rules?: string[];
    questionTypes?: {
      multipleChoice?: string;
      trueOrFalse?: string;
      shortAnswer?: string;
      coding?: string;
      situational?: string;
    };
  };
  courseTitle: string;
  questions?: Array<{
    type: string;
    marks: number;
    question: string;
  }>;
}

const TestInstructionsModal: React.FC<TestInstructionsModalProps> = ({
  isOpen,
  onClose,
  onStartTest,
  instructions,
  courseTitle,
  questions,
}) => {
  if (!isOpen) return null;

  // Provide default values to prevent undefined errors
  const safeInstructions = {
    title: instructions?.title || "Course Certificate Test",
    duration: instructions?.duration || "3 hours",
    totalQuestions: instructions?.totalQuestions || 10,
    totalMarks: instructions?.totalMarks || 100,
    passingScore: instructions?.passingScore || 80,
    rules: instructions?.rules || [
      "Read each question carefully before selecting your answer.",
      "You have 3 hours to complete this test.",
      "Each question carries equal marks.",
      "You need to score at least 80% to pass.",
      "Once submitted, you cannot change your answers.",
      "Make sure you have a stable internet connection.",
    ],
    questionTypes: instructions?.questionTypes || {},
  };

  const questionTypesList = Object.entries(safeInstructions.questionTypes || {})
    .filter(([_, description]) => description)
    .map(([type, description]) => ({
      type: type
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase()),
      description,
    }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-smoke-gray rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-smoke-light">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {safeInstructions.title}
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-1">
              Course: {courseTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-royal-black transition-colors duration-200"
          >
            <X className="text-gray-400 hover:text-white" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Test Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-royal-black rounded-lg p-4 text-center">
              <Clock className="text-alien-green w-6 h-6 mx-auto mb-2" />
              <h3 className="font-semibold text-white text-sm">Duration</h3>
              <p className="text-alien-green font-bold">
                {safeInstructions.duration}
              </p>
            </div>
            <div className="bg-royal-black rounded-lg p-4 text-center">
              <Info className="text-blue-400 w-6 h-6 mx-auto mb-2" />
              <h3 className="font-semibold text-white text-sm">Questions</h3>
              <p className="text-blue-400 font-bold">
                {safeInstructions.totalQuestions}
              </p>
            </div>
            <div className="bg-royal-black rounded-lg p-4 text-center">
              <Award className="text-yellow-400 w-6 h-6 mx-auto mb-2" />
              <h3 className="font-semibold text-white text-sm">Total Marks</h3>
              <p className="text-yellow-400 font-bold">
                {safeInstructions.totalMarks}
              </p>
            </div>
            <div className="bg-royal-black rounded-lg p-4 text-center">
              <CheckCircle className="text-green-400 w-6 h-6 mx-auto mb-2" />
              <h3 className="font-semibold text-white text-sm">
                Passing Score
              </h3>
              <p className="text-green-400 font-bold">
                {safeInstructions.passingScore}%
              </p>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="text-red-400 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-400 text-sm sm:text-base">
                  Important Notice
                </h3>
                <p className="text-red-300 text-xs sm:text-sm mt-1">
                  Once you start the test, it cannot be paused. Make sure you
                  have a stable internet connection and enough time to complete
                  the test.
                </p>
              </div>
            </div>
          </div>

          {/* Test Rules */}
          <div className="bg-royal-black rounded-lg p-4 sm:p-6">
            <h3 className="font-semibold text-white text-lg mb-4 flex items-center">
              <CheckCircle className="text-alien-green w-5 h-5 mr-2" />
              Test Rules & Guidelines
            </h3>
            <ul className="space-y-3">
              {safeInstructions.rules.map((rule, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-alien-green rounded-full flex-shrink-0 mt-2"></div>
                  <span className="text-gray-300 text-sm sm:text-base">
                    {rule}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Question Types */}
          {questionTypesList.length > 0 && (
            <div className="bg-royal-black rounded-lg p-4 sm:p-6">
              <h3 className="font-semibold text-white text-lg mb-4 flex items-center">
                <Info className="text-blue-400 w-5 h-5 mr-2" />
                Question Types
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {questionTypesList.map((questionType, index) => (
                  <div
                    key={index}
                    className="border border-smoke-light rounded-lg p-3"
                  >
                    <h4 className="font-semibold text-alien-green text-sm mb-1">
                      {questionType.type}
                    </h4>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      {questionType.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mark Distribution Info */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Award className="text-blue-400 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-400 text-sm sm:text-base">
                  Mark Distribution
                </h3>
                <p className="text-blue-300 text-xs sm:text-sm mt-1">
                  Each question has specific weightage. Marks for each question
                  will be displayed during the test. Focus on understanding and
                  accuracy rather than speed.
                </p>
                {questions && questions.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-blue-300 mb-2">
                      Question Breakdown:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                      {questions.map((q, index) => (
                        <div
                          key={index}
                          className="bg-royal-black/50 rounded px-2 py-1 text-xs"
                        >
                          <span className="text-gray-400">Q{index + 1}:</span>
                          <span className="text-blue-300 font-semibold ml-1">
                            {q.marks}pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Certificate Eligibility */}
          <div className="bg-alien-green/10 border border-alien-green/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Award className="text-alien-green w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-alien-green text-sm sm:text-base">
                  Certificate Eligibility
                </h3>
                <p className="text-gray-300 text-xs sm:text-sm mt-1">
                  You need to score at least {safeInstructions.passingScore}% to
                  be eligible for the course completion certificate. The
                  certificate will be available for download immediately after
                  passing the test.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 border-t border-smoke-light">
          <div className="text-center sm:text-left">
            <p className="text-gray-400 text-xs sm:text-sm">
              Make sure you're ready before proceeding. Good luck!
            </p>
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors duration-300 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={onStartTest}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-alien-green text-royal-black rounded-lg font-semibold hover:bg-alien-green/90 transition-colors duration-300 shadow-alien-glow text-sm sm:text-base"
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInstructionsModal;
