import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  Download,
  Eye,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface PdfViewerProps {
  pdfUrl: string;
  fileName: string;
  className?: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfUrl,
  fileName,
  className = "",
}) => {
  const [viewMode, setViewMode] = useState<
    "embed" | "iframe" | "google" | "link"
  >("google"); // Start with Google viewer as it's most reliable
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Auto-hide loading after a timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 second timeout

    return () => clearTimeout(timer);
  }, [viewMode]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    console.log("PDF viewer error, trying fallback...");
    setIsLoading(false);
    setHasError(true);

    // Try different fallback methods
    if (viewMode === "google" && retryCount === 0) {
      setViewMode("iframe");
      setIsLoading(true);
      setHasError(false);
      setRetryCount(1);
    } else if (viewMode === "iframe" && retryCount === 1) {
      setViewMode("embed");
      setIsLoading(true);
      setHasError(false);
      setRetryCount(2);
    }
  };

  const retryViewer = () => {
    setViewMode("google");
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
  };

  const openInNewTab = () => {
    window.open(pdfUrl, "_blank");
  };

  const downloadPdf = async () => {
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback to direct link
      window.open(pdfUrl, "_blank");
    }
  };

  return (
    <div className={`bg-smoke-light rounded-lg overflow-hidden ${className}`}>
      {/* Controls */}

      {/* PDF Viewer */}
      <div className="relative h-96 bg-gray-900 rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gray-900/80">
            <div className="w-8 h-8 border-2 border-alien-green border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-gray-300 text-sm">Loading PDF...</p>
          </div>
        )}

        {hasError && retryCount >= 2 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-gray-900">
            <AlertCircle size={48} className="text-yellow-500 mb-4" />
            <h3 className="text-white font-medium mb-2">
              Preview Not Available
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              This PDF cannot be previewed in the browser. You can still
              download it or open it in a new tab.
            </p>
            <div className="flex gap-2">
              <button
                onClick={openInNewTab}
                className="px-4 py-2 bg-alien-green text-royal-black rounded-lg hover:bg-alien-green/80 transition-colors flex items-center gap-2"
              >
                <ExternalLink size={16} />
                Open in New Tab
              </button>
              <button
                onClick={downloadPdf}
                className="px-4 py-2 bg-smoke-gray border border-smoke-light text-gray-300 rounded-lg hover:bg-smoke-light transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        ) : (
          <>
            {viewMode === "google" && (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                  pdfUrl
                )}&embedded=true`}
                width="100%"
                height="100%"
                onLoad={handleLoad}
                className="border-0 w-full h-full"
                title={fileName}
                sandbox="allow-scripts allow-same-origin"
              />
            )}

            {viewMode === "iframe" && (
              <iframe
                src={pdfUrl}
                width="100%"
                height="100%"
                onLoad={handleLoad}
                className="border-0 w-full h-full"
                title={fileName}
              />
            )}

            {viewMode === "embed" && (
              <embed
                src={pdfUrl}
                type="application/pdf"
                width="100%"
                height="100%"
                className="w-full h-full"
              />
            )}

            {/* Viewer mode indicator */}
            <div className="absolute top-2 right-2 z-20">
              <div className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <Eye size={12} />
                {viewMode === "google" && "Google Viewer"}
                {viewMode === "iframe" && "Direct View"}
                {viewMode === "embed" && "Native View"}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fallback message */}
      <div className="p-3 text-xs text-gray-500 text-center border-t border-smoke-light">
        Having trouble viewing? Try{" "}
        <button
          onClick={downloadPdf}
          className="text-alien-green hover:underline"
        >
          downloading the file
        </button>
        .
      </div>
    </div>
  );
};
