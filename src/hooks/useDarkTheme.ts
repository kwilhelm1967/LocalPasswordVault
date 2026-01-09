/**
 * useDarkTheme Hook
 * 
 * Manages dark theme preference.
 */

import { useEffect } from "react";

export const useDarkTheme = () => {
  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem("theme") || "dark";
    const isDark = savedTheme === "dark";
    
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);
};
