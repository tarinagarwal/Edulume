import React from "react";

const ConfirmDeleteModal: React.FC<{ open: boolean; onClose: () => void; onConfirm: () => void }> = ({ open, onClose, onConfirm }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-[#071122] p-6 rounded w-80">
        <div className="text-lg text-slate-200 mb-3">Confirm Delete</div>
        <div className="text-sm text-slate-300 mb-4">Are you sure you want to delete this item? This action cannot be undone.</div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 border rounded" onClick={onClose}>Cancel</button>
          <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
