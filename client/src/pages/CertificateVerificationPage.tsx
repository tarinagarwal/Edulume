import React, { useState, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { getCertificateVerification } from "../utils/api";
import SEO from '../components/seo/SEO';

interface VerificationData {
  isValid: boolean;
  certificateDetails?: {
    studentName: string;
    courseName: string;
    instructorName: string;
    completionDate: string;
    certificateId: string;
    score: number;
    totalMarks: number;
    marksObtained: number;
    issueDate: string;
  };
  error?: string;
}

const CertificateVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [verificationData, setVerificationData] =
    useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const certificateId = searchParams.get("id");
  const source = searchParams.get("source");

  useEffect(() => {
    const verifyCertificate = async () => {
      if (!certificateId) {
        setError("Certificate ID is required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await getCertificateVerification(certificateId);

        if (response.success) {
          setVerificationData(response);
        } else {
          setError(response.error || "Certificate verification failed");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError("Failed to verify certificate. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyCertificate();
  }, [certificateId]);

  // Redirect if not accessed from QR code
  if (source !== "qr") {
    return <Navigate to="/404" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Verifying Certificate
            </h2>
            <p className="text-gray-400">
              Please wait while we verify the certificate...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!verificationData?.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Invalid Certificate
            </h2>
            <p className="text-gray-400 mb-4">
              This certificate could not be verified. It may be forged or
              invalid.
            </p>
            <p className="text-sm text-gray-500">
              Certificate ID: {certificateId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { certificateDetails } = verificationData;

  return (
    <>
    <SEO
        title="Certificate Verification"
        description="Verify the authenticity of Edulume certificates easily and securely."
        canonicalUrl="https://edulume.site/verify-certificate"
    />
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-green-500 mb-2">
            Certificate Verified
          </h1>
          <p className="text-gray-400">
            This certificate has been successfully verified and is authentic.
          </p>
        </div>

        {/* Certificate Details */}
        {certificateDetails && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
              Certificate Details
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Student Name
                  </label>
                  <p className="text-white font-semibold">
                    {certificateDetails.studentName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Course Name
                  </label>
                  <p className="text-white font-semibold">
                    {certificateDetails.courseName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Instructor
                  </label>
                  <p className="text-white">
                    {certificateDetails.instructorName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Completion Date
                  </label>
                  <p className="text-white">
                    {certificateDetails.completionDate}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Final Score
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl font-bold text-green-500">
                      {certificateDetails.score}%
                    </div>
                    <div className="text-gray-400">
                      ({certificateDetails.marksObtained}/
                      {certificateDetails.totalMarks} marks)
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Certificate ID
                  </label>
                  <p className="text-white font-mono text-sm bg-gray-700 p-2 rounded">
                    {certificateDetails.certificateId}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Issue Date
                  </label>
                  <p className="text-white">{certificateDetails.issueDate}</p>
                </div>

                <div className="flex items-center space-x-2 text-green-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span className="font-semibold">Verified & Authentic</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Institution Info */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <img
              src="/logo.png"
              alt="Edulume"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            <div>
              <h3 className="text-lg font-semibold text-green-500">Edulume</h3>
              <p className="text-gray-400">
                Professional Certification Authority
              </p>
              <p className="text-sm text-gray-500">
                Advancing Digital Excellence Through Innovation
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            This verification is valid at the time of scanning. For any
            questions about this certificate, please contact Edulume.
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default CertificateVerificationPage;
