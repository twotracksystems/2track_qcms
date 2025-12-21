import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Custom hook to handle Escape key navigation
 * @param backPath - The path to navigate to when Escape is pressed
 */
export function useEscapeNavigation(backPath: string) {
  const router = useRouter();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.push(backPath);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [router, backPath]);
}



