"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";

interface KebabMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function KebabMenu({ onEdit, onDelete }: KebabMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate position using fixed positioning to avoid overflow issues
  useEffect(() => {
    if (isOpen && buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 160; // w-40 = 160px
      const menuHeight = 80; // Approximate height of menu with 2 items
      const spaceOnRight = window.innerWidth - buttonRect.right;
      const spaceOnLeft = buttonRect.left;
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      let left = buttonRect.right;
      let top = buttonRect.bottom + 4; // Default: below button with small gap

      // Adjust horizontal position if not enough space on right
      if (spaceOnRight < menuWidth && spaceOnLeft > menuWidth) {
        left = buttonRect.left - menuWidth;
      } else if (spaceOnRight < menuWidth) {
        // If neither side has enough space, prefer right but adjust
        left = window.innerWidth - menuWidth - 8; // 8px margin from edge
      }

      // Adjust vertical position if not enough space below
      if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
        top = buttonRect.top - menuHeight - 4; // Above button
      } else if (spaceBelow < menuHeight) {
        // If not enough space below, position at bottom of viewport
        top = window.innerHeight - menuHeight - 8; // 8px margin from edge
      }

      setMenuPosition({ top, left });
    }
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleEdit = () => {
    setIsOpen(false);
    onEdit();
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded hover:bg-slate-100"
        title="More options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to prevent interaction with table */}
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={menuRef}
            className="fixed w-40 rounded-lg border border-slate-200 bg-white shadow-xl z-[101]"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            <div className="py-1">
              <button
                onClick={handleEdit}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

