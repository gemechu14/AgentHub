"use client";

interface DeleteAgentModalProps {
  isOpen: boolean;
  agentName: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteAgentModal({
  isOpen,
  agentName,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteAgentModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-2xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Content */}
          <div className="px-6 pt-6 pb-4">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Delete agent?
            </h2>
            <p className="mb-1 text-sm text-slate-600">
              This will delete <strong>{agentName}</strong>.
            </p>
            <p className="mb-0 text-xs text-slate-500">
              This action cannot be undone.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200"></div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

