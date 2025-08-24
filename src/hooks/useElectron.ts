import { useEffect, useState } from "react";

// Using the global ElectronAPI type from vite-env.d.ts

export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [version, setVersion] = useState<string>("");
  const [platform, setPlatform] = useState<string>("");

  useEffect(() => {
    const checkElectron = async () => {
      if (window.electronAPI) {
        setIsElectron(true);
        try {
          const appVersion = await window.electronAPI.getVersion();
          const appPlatform = await window.electronAPI.getPlatform();
          setVersion(appVersion);
          setPlatform(appPlatform);
        } catch (error) {
          console.error("Failed to get electron info:", error);
        }
      }
    };

    checkElectron();
  }, []);

  return {
    isElectron,
    version,
    platform,
    electronAPI: window.electronAPI,
  };
};
