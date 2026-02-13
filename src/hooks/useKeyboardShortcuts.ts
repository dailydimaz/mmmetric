import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {

    const handler = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      // Cmd/Ctrl + K → Command palette (already exists, but show toast)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        return; // let existing handler work
      }

      // ? → Show shortcuts help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toast.info("⌨️ Keyboard Shortcuts", {
          description: "G+D → Dashboard · G+S → Settings · ? → This help · / → Search",
          duration: 5000,
        });
        return;
      }

      // / → Focus search
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        searchInput?.focus();
        return;
      }

      // G then D → Go to dashboard
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
  }, [navigate]);
}
