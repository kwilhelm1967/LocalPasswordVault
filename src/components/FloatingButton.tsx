import React, { useState, useEffect, useRef, useCallback } from "react";
import { Lock } from "lucide-react";

export const FloatingButton: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, clientX: 0, clientY: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragTimeoutRef = useRef<NodeJS.Timeout>();
  const isClick = useRef(true);
  const DRAG_THRESHOLD = 5; // pixels
  const lastClickTsRef = useRef(0);
  const CLICK_THROTTLE_MS = 250;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left click

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      dragStartPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        clientX: e.clientX,
        clientY: e.clientY
      };
    }
    isClick.current = true;

    e.preventDefault();
    e.stopPropagation();
  };

  const handleButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Ignore while dragging or if flagged as not a click
    if (isProcessing || isDragging || !isClick.current) {
      isClick.current = false;
      return;
    }
    // Simple throttle to avoid rapid re-triggers
    const now = Date.now();
    if (now - lastClickTsRef.current < CLICK_THROTTLE_MS) {
      return;
    }
    lastClickTsRef.current = now;
    
    setIsProcessing(true);

    try {
      // Check if vault is already unlocked
      const isUnlocked = window.electronAPI?.isVaultUnlocked ? 
        await window.electronAPI.isVaultUnlocked() : false;

      if (isUnlocked && window.electronAPI?.toggleFloatingPanelFromButton) {
        await window.electronAPI.toggleFloatingPanelFromButton();
      } else if (!isUnlocked && window.electronAPI?.showMainWindow) {
        // If vault is locked, show main window to unlock
        window.electronAPI.showMainWindow();
      }
    } catch (error) {
      console.error("Failed to toggle floating panel:", error);
    } finally {
      setTimeout(() => setIsProcessing(false), 120);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartPos.current.clientX || !isClick.current) return;
    
    // Check if mouse has moved beyond threshold to start dragging
    const dx = Math.abs(e.clientX - dragStartPos.current.clientX);
    const dy = Math.abs(e.clientY - dragStartPos.current.clientY);
    
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      isClick.current = false;
      setIsDragging(true);
    }
    
    if (!isDragging) return;

    const buttonSize = 60;
    const newX = Math.max(
      0,
      Math.min(window.screen.availWidth - buttonSize, e.screenX - dragStartPos.current.x)
    );
    const newY = Math.max(
      0,
      Math.min(window.screen.availHeight - buttonSize, e.screenY - dragStartPos.current.y)
    );

    if (window.electronAPI?.moveFloatingButton) {
      window.electronAPI.moveFloatingButton(newX, newY);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(async (e: MouseEvent) => {
    if (!isDragging && !isClick.current) return;
    
    // Reset click state after a short delay
    setTimeout(() => {
      isClick.current = true;
    }, 100);

    const buttonSize = 60;
    const snapThreshold = 100; // Distance from edge to snap

    let newX = Math.max(
      0,
      Math.min(window.screen.availWidth - buttonSize, e.screenX - dragStartPos.current.x)
    );
    let newY = Math.max(
      0,
      Math.min(window.screen.availHeight - buttonSize, e.screenY - dragStartPos.current.y)
    );

    // Snap to edges
    const distanceToLeft = newX;
    const distanceToRight = window.screen.availWidth - newX - buttonSize;
    const distanceToTop = newY;
    const distanceToBottom = window.screen.availHeight - newY - buttonSize;

    // Snap to the nearest edge if within threshold
    if (distanceToLeft < snapThreshold || distanceToRight < snapThreshold) {
      newX = distanceToLeft < distanceToRight ? 10 : window.screen.availWidth - buttonSize - 10;
    }

    if (distanceToTop < snapThreshold || distanceToBottom < snapThreshold) {
      newY = distanceToTop < distanceToBottom ? 10 : window.screen.availHeight - buttonSize - 10;
    }

    if (window.electronAPI?.saveFloatingButtonPosition) {
      await window.electronAPI.saveFloatingButtonPosition(newX, newY);
    }

    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }

    dragTimeoutRef.current = setTimeout(() => {
      setIsDragging(false);
    }, 100);
  }, [isDragging]);

  // Global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={buttonRef}
      className="fixed z-[9999] bg-transparent w-full h-full flex items-center justify-center"
    >
      <button
        onMouseDown={handleMouseDown}
        onClick={handleButtonClick}
        disabled={isProcessing}
        className={`w-14 h-14 rounded-full flex items-center justify-center
          transition-all duration-200 ease-in-out shadow-lg
          ${isProcessing 
            ? 'bg-purple-600 cursor-wait' 
            : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'}
          text-white border-2 border-white/20`}
        title={isProcessing ? "Processing..." : "Toggle Password Vault"}
      >
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Lock className="w-6 h-6" />
        )}
      </button>

      {isDragging && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2
          bg-black/90 text-white px-3 py-1.5 rounded-full text-xs font-semibold
          whitespace-nowrap backdrop-blur-md border border-white/20 z-[10001]
          shadow-lg">
          Release to snap to edge
        </div>
      )}
    </div>
  );
};
