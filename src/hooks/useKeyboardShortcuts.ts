"use client";

import { useEffect } from "react";
import { useEvents } from "@/store/useEvents";

/**
 * Global keyboard shortcuts matching the legacy system:
 * - ESC: Close modals
 * - N: Open new event form (when no modal is open)
 * - ← / →: Navigate between views (handled via callback)
 * - /: Focus search
 */
export function useKeyboardShortcuts(options?: {
  onViewChange?: (direction: "prev" | "next") => void;
}) {
  const { selectedEvent, setSelectedEvent, setIsEditingEvent, isEditingEvent } = useEvents();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // ESC: Close modals
      if (e.key === "Escape") {
        if (isEditingEvent) {
          setIsEditingEvent(false);
        } else if (selectedEvent) {
          setSelectedEvent(null);
        }
        return;
      }

      // Don't trigger shortcuts if a modal is open
      if (selectedEvent || isEditingEvent) return;

      // N: New event
      if (e.key === "n" || e.key === "N") {
        setSelectedEvent(null);
        setIsEditingEvent(true);
        return;
      }

      // Arrow keys: Navigate views
      if (e.key === "ArrowRight" && !e.altKey) {
        options?.onViewChange?.("next");
      }
      if (e.key === "ArrowLeft" && !e.altKey) {
        options?.onViewChange?.("prev");
      }

      // / : Focus search
      if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedEvent, isEditingEvent, setSelectedEvent, setIsEditingEvent, options]);
}
