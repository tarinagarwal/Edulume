import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, BookOpen, AlertCircle } from "lucide-react";
import {
  generatePDFUploadUrl,
  generateEbookUploadUrl,
  storePDFMetadata,
  storeEbookMetadata,
  uploadToVercelBlob,
} from "../utils/api";

const UploadForm: React.FC = () => {
  const [uploadType, setUploadType] = useState<"pdf" | "ebook">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [semester, setSemester] = useState("");
  const [course, setCourse] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Please select a PDF file");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Step 1: Upload file directly to Vercel Blob
      const timestamp = Date.now();
      const uniqueFilename = `${uploadType}s/${timestamp}-${file.name}`;
      const blobUrl = await uploadToVercelBlob(uniqueFilename, file);

      // Step 2: Store metadata in database
      const metadata = {
        title,
        description,
        semester,
        course: course || undefined,
        department: department || undefined,
        year_of_study: yearOfStudy || undefined,
        blob_url: blobUrl,
      };

      if (uploadType === "pdf") {
        await storePDFMetadata(metadata);
      } else {
        await storeEbookMetadata(metadata);
      }

      setSuccess(`${uploadType.toUpperCase()} uploaded successfully!`);

      // Reset form
      setFile(null);
      setTitle("");
      setDescription("");
      setSemester("");
      setCourse("");
      setDepartment("");
      setYearOfStudy("");

      // Redirect after success
      setTimeout(() => {
        navigate(uploadType === "pdf" ? "/pdfs" : "/ebooks");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="smoke-card p-8 relative smoke-effect">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-alien-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-alien-glow">
              <Upload className="text-royal-black" size={32} />
            </div>
            <h1 className="text-3xl font-alien font-bold glow-text mb-2">
              Upload Resource
            </h1>
            <p className="text-gray-400">
              Share your knowledge with the community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Resource Type
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setUploadType("pdf")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
                    uploadType === "pdf"
                      ? "border-alien-green bg-alien-green/10 text-alien-green"
                      : "border-smoke-light text-gray-400 hover:border-alien-green hover:text-alien-green"
                  }`}
                >
                  <FileText size={20} />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType("ebook")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
                    uploadType === "ebook"
                      ? "border-alien-green bg-alien-green/10 text-alien-green"
                      : "border-smoke-light text-gray-400 hover:border-alien-green hover:text-alien-green"
                  }`}
                >
                  <BookOpen size={20} />
                  <span>E-book</span>
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select File *
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="alien-input w-full"
                  required
                />
              </div>
              {file && (
                <p className="text-sm text-alien-green mt-2">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                  MB)
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="alien-input w-full"
                placeholder="Enter resource title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="alien-input w-full h-24 resize-none"
                placeholder="Describe the content and what students will learn"
                required
              />
            </div>

            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="alien-input w-full"
                required
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem.toString()}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Course (Optional)
                </label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="alien-input w-full"
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Department (Optional)
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="alien-input w-full"
                  placeholder="e.g., Engineering"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Year of Study (Optional)
              </label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="alien-input w-full"
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle className="mr-2" size={20} />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="alien-button w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Uploading..." : `Upload ${uploadType.toUpperCase()}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadForm;
