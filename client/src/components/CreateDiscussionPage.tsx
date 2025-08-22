import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Image,
  X,
  Upload,
  AlertCircle,
  Tag,
  Plus,
} from "lucide-react";
import { createDiscussion, uploadImage } from "../utils/api";
import { DISCUSSION_CATEGORIES } from "../types/discussions";

const CreateDiscussionPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setImageUploading(true);
    setError("");

    try {
      const result = await uploadImage(file, `discussion-${Date.now()}`);
      setImages([...images, result.url]);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !category) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await createDiscussion({
        title: title.trim(),
        content: content.trim(),
        category,
        tags: tags.length > 0 ? tags : undefined,
        images: images.length > 0 ? images : undefined,
      });

      setSuccess("Discussion created successfully!");

      // Add a small delay to ensure the discussion is fully created
      setTimeout(() => {
        navigate(`/discussions/${result.id}`);
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create discussion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate("/discussions")}
            className="flex items-center space-x-2 text-gray-400 hover:text-alien-green transition-colors duration-300 mr-6"
          >
            <ArrowLeft size={20} />
            <span>Back to Discussions</span>
          </button>
          <div>
            <h1 className="text-3xl font-alien font-bold glow-text">
              Ask a Question
            </h1>
            <p className="text-gray-400 mt-1">
              Share your question with the community
            </p>
          </div>
        </div>

        <div className="smoke-card p-8 relative smoke-effect">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Question Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="alien-input w-full"
                placeholder="What's your question? Be specific and clear..."
                maxLength={200}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {title.length}/200 characters
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="alien-input w-full"
                required
              >
                <option value="">Select a category</option>
                {DISCUSSION_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Question Details *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="alien-input w-full h-40 resize-none"
                placeholder="Provide more details about your question. Include what you've tried, what you expect, and any relevant context..."
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                Be specific and provide context to get better answers
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags (Optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-alien-green/20 text-alien-green px-3 py-1 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-2 hover:text-red-400 transition-colors duration-300"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  className="alien-input flex-1"
                  placeholder="Add tags (press Enter or comma to add)"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim() || tags.length >= 5}
                  className="px-4 py-2 bg-smoke-light border border-smoke-light rounded-lg text-gray-400 hover:border-alien-green hover:text-alien-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Add up to 5 tags to help others find your question
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Images (Optional)
              </label>

              {/* Upload Button */}
              <div className="mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading || images.length >= 3}
                  className="flex items-center space-x-2 px-4 py-2 border border-smoke-light rounded-lg text-gray-400 hover:border-alien-green hover:text-alien-green disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {imageUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-alien-green border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Image size={16} />
                      <span>Add Image</span>
                    </>
                  )}
                </button>
                <div className="text-xs text-gray-500 mt-1">
                  Upload up to 3 images (max 5MB each)
                </div>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-smoke-light"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle className="mr-2 flex-shrink-0" size={20} />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/discussions")}
                className="px-6 py-3 border border-smoke-light text-gray-400 rounded-lg hover:border-alien-green hover:text-alien-green transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  loading || !title.trim() || !content.trim() || !category
                }
                className="alien-button px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Post Question"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateDiscussionPage;
