import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => Promise<void>;
    isLoading: boolean;
}

const REPORT_REASONS = [
    "Spam or misleading",
    "Harassment or bullying",
    "Inappropriate content",
    "Hate speech",
    "Self-harm",
    "Other",
];

const ReportModal: React.FC<ReportModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
}) => {
    const [selectedReason, setSelectedReason] = useState("");
    const [otherReason, setOtherReason] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const reason = selectedReason === "Other" ? otherReason : selectedReason;
        if (reason.trim()) {
            onSubmit(reason.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-space-dark border border-smoke-light rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative smoke-effect animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-alien font-bold text-white flex items-center">
                            <AlertTriangle className="text-yellow-500 mr-2" size={24} />
                            Report Content
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                            disabled={isLoading}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-gray-300 text-sm mb-4">
                            Why are you reporting this content?
                        </p>

                        <div className="space-y-2">
                            {REPORT_REASONS.map((reason) => (
                                <label
                                    key={reason}
                                    className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name="reportReason"
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                        className="form-radio text-alien-green bg-transparent border-white/20 focus:ring-alien-green focus:ring-offset-space-dark"
                                    />
                                    <span className="text-gray-200">{reason}</span>
                                </label>
                            ))}
                        </div>

                        {selectedReason === "Other" && (
                            <div className="mt-4">
                                <textarea
                                    value={otherReason}
                                    onChange={(e) => setOtherReason(e.target.value)}
                                    placeholder="Please provide more details..."
                                    className="alien-input w-full h-24 resize-none"
                                    required
                                />
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    isLoading ||
                                    !selectedReason ||
                                    (selectedReason === "Other" && !otherReason.trim())
                                }
                                className="alien-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-red-100 bg-red-600/30 hover:bg-red-600/50 border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                            >
                                {isLoading ? "Submitting..." : "Submit Report"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
