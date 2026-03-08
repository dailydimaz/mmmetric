import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface KeyboardShortcutsOptions {
  onDateRangeChange?: (range: string) => void;
}

export function useKeyboardShortcuts(options?: KeyboardShortcutsOptions) {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      // Cmd/Ctrl + K → Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        return;
      }

      // ? → Show shortcuts help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toast.info("⌨️ Keyboard Shortcuts", {
          description: "T → Today · D → 7 days · W → 30 days · M → 90 days · G+D → Dashboard · G+S → Settings · ? → Help · / → Search",
          duration: 5000,
        });
        return;
      }

      // Date range shortcuts (single key, no modifier)
      if (!e.metaKey && !e.ctrlKey && !e.altKey && options?.onDateRangeChange) {
        switch (e.key.toLowerCase()) {
          case "t":
            e.preventDefault();
            options.onDateRangeChange("today");
            toast.success("📅 Today");
            return;
          case "d":
            e.preventDefault();
            options.onDateRangeChange("7d");
            toast.success("📅 Last 7 days");
            return;
          case "w":
            e.preventDefault();
            options.onDateRangeChange("30d");
            toast.success("📅 Last 30 days");
            return;
          case "m":
            e.preventDefault();
            options.onDateRangeChange("90d");
            toast.success("📅 Last 90 days");
            return;
        }
      }

      // / → Focus search
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        searchInput?.focus();
        return;
      }

      // G then D → Go to dashboard, G then S → Settings
      if (e.key === "g") {
        const waitForNext = (e2: KeyboardEvent) => {
          if (e2.key === "d") { navigate("/dashboard"); toast.success("📊 Dashboard"); }
          if (e2.key === "s") { navigate("/dashboard/settings"); toast.success("⚙️ Settings"); }
          if (e2.key === "h") { navigate("/"); toast.success("🏠 Home"); }
          document.removeEventListener("keydown", waitForNext);
        };
        document.addEventListener("keydown", waitForNext, { once: true });
        setTimeout(() => document.removeEventListener("keydown", waitForNext), 1000);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigate, options?.onDateRangeChange]);
}
