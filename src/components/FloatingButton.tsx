import React, { useState, useEffect, useRef, useCallback } from "react";
import { Shield, Lock, GripVertical } from "lucide-react";

// Brand colors
const colors = {
  steelBlue600: "#4A6FA5",
  steelBlue500: "#5B82B8",
  brandGold: "#C9AE66",
  deepNavy: "#0F172A",
};

export const FloatingButton: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, clientX: 0, clientY: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const dragTimeoutRef = useRef<NodeJS.Timeout>();
  const isDragHandle = useRef(false);
  const DRAG_THRESHOLD = 5;
  const lastClickTsRef = useRef(0);
  const CLICK_THROTTLE_MS = 250;

  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  const handleDragMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    isDragHandle.current = true;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      dragStartPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        clientX: e.clientX,
        clientY: e.clientY,
      };
    }

    e.preventDefault();
    e.stopPropagation();
  };

  const handleMenuClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProcessing || isDragging) return;

    const now = Date.now();
    if (now - lastClickTsRef.current < CLICK_THROTTLE_MS) return;
    lastClickTsRef.current = now;

    setIsProcessing(true);

    try {
      const isUnlocked = window.electronAPI?.isVaultUnlocked
        ? await window.electronAPI.isVaultUnlocked()
        : false;

      if (isUnlocked && window.electronAPI) {
        const isFloatingPanelOpen = window.electronAPI.isFloatingPanelOpen
          ? await window.electronAPI.isFloatingPanelOpen()
          : false;

        if (isFloatingPanelOpen) {
          window.electronAPI.restoreMainWindow();
          window.electronAPI.hideFloatingPanel();
        } else {
          window.electronAPI.showFloatingPanel();
          void (window.electronAPI.hideMainWindow?.() ?? window.electronAPI.minimizeMainWindow?.());
        }
      } else if (!isUnlocked && window.electronAPI?.showMainWindow) {
        window.electronAPI.showMainWindow();
      }
    } catch (error) {
      console.error("Failed to toggle floating panel:", error);
    } finally {
      setTimeout(() => setIsProcessing(false), 120);
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStartPos.current.clientX || !isDragHandle.current) return;

      const dx = Math.abs(e.clientX - dragStartPos.current.clientX);
      const dy = Math.abs(e.clientY - dragStartPos.current.clientY);

      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        setIsDragging(true);
      }

      if (!isDragging) return;

      const buttonSize = 52;
      const newX = Math.max(
        0,
        Math.min(
          window.screen.availWidth - buttonSize,
          e.screenX - dragStartPos.current.x
        )
      );
      const newY = Math.max(
        0,
        Math.min(
          window.screen.availHeight - buttonSize,
          e.screenY - dragStartPos.current.y
        )
      );

      if (window.electronAPI?.moveFloatingButton) {
        window.electronAPI.moveFloatingButton(newX, newY);
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(
    async (e: MouseEvent) => {
      if (!isDragHandle.current) return;

      isDragHandle.current = false;

      if (isDragging) {
        const buttonSize = 52;
        const snapThreshold = 100;

        let newX = Math.max(
          0,
          Math.min(
            window.screen.availWidth - buttonSize,
            e.screenX - dragStartPos.current.x
          )
        );
        let newY = Math.max(
          0,
          Math.min(
            window.screen.availHeight - buttonSize,
            e.screenY - dragStartPos.current.y
          )
        );

        const distanceToLeft = newX;
        const distanceToRight = window.screen.availWidth - newX - buttonSize;
        const distanceToTop = newY;
        const distanceToBottom = window.screen.availHeight - buttonSize - newY;

        if (distanceToLeft < snapThreshold || distanceToRight < snapThreshold) {
          newX =
            distanceToLeft < distanceToRight
              ? 10
              : window.screen.availWidth - buttonSize - 10;
        }

        if (distanceToTop < snapThreshold || distanceToBottom < snapThreshold) {
          newY =
            distanceToTop < distanceToBottom
              ? 10
              : window.screen.availHeight - buttonSize - 10;
        }

        if (window.electronAPI?.saveFloatingButtonPosition) {
          await window.electronAPI.saveFloatingButtonPosition(newX, newY);
        }
      }

      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }

      dragTimeoutRef.current = setTimeout(() => {
        setIsDragging(false);
      }, 100);

      dragStartPos.current = { x: 0, y: 0, clientX: 0, clientY: 0 };
    },
    [isDragging]
  );

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragHandle.current) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragHandle.current) {
        handleMouseUp(e);
      }
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    if (isDragging) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={buttonRef}
      className="fixed z-[9999]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Button Container */}
      <div
        className="relative w-[52px] h-[52px] rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.steelBlue500} 0%, ${colors.steelBlue600} 100%)`,
          boxShadow: isHovered
            ? `0 8px 32px rgba(74, 111, 165, 0.5), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 0 20px rgba(201, 174, 102, 0.3)`
            : `0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset`,
          transform: isHovered && !isDragging ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.2s ease, box-shadow 0.3s ease',
        }}
      >
        {/* Glossy overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%)',
          }}
        />

        {/* Gold accent line at top */}
        <div 
          className="absolute top-0 left-2 right-2 h-[2px] rounded-full"
          style={{ 
            background: `linear-gradient(90deg, transparent, ${colors.brandGold}, transparent)`,
            opacity: isHovered ? 1 : 0.6,
            transition: 'opacity 0.3s ease',
          }}
        />

        <div className="flex h-full">
          {/* Drag Handle */}
          <div
            ref={dragHandleRef}
            onMouseDown={handleDragMouseDown}
            className={`w-[14px] h-full flex items-center justify-center transition-all duration-200 ${
              isDragging ? "cursor-grabbing bg-black/20" : "cursor-grab hover:bg-black/10"
            }`}
            title="Drag to move"
          >
            <GripVertical 
              className="w-3 h-3 text-white/60" 
              strokeWidth={2.5}
            />
          </div>

          {/* Subtle divider */}
          <div className="w-[1px] h-full bg-white/10" />

          {/* Menu Toggle */}
          <div
            onClick={handleMenuClick}
            className={`flex-1 h-full flex items-center justify-center transition-all duration-200 ${
              isProcessing ? "cursor-wait" : "cursor-pointer hover:bg-white/5"
            }`}
            title={isProcessing ? "Processing..." : "Toggle Local Password Vault"}
          >
            {isProcessing ? (
              <div 
                className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"
              />
            ) : (
              <div className="relative">
                {/* Shield icon with lock */}
                <Shield 
                  className="w-6 h-6 text-white drop-shadow-sm" 
                  strokeWidth={1.8}
                  fill="rgba(255,255,255,0.1)"
                />
                <Lock 
                  className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-[1px]" 
                  strokeWidth={2.5}
                />
                
                {/* Pulse ring on hover */}
                {isHovered && !isProcessing && (
                  <div 
                    className="absolute inset-0 -m-1 rounded-full animate-ping"
                    style={{
                      background: `radial-gradient(circle, ${colors.brandGold}40 0%, transparent 70%)`,
                      animationDuration: '1.5s',
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom shine */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          }}
        />
      </div>

      {/* Drag tooltip */}
      {isDragging && (
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap z-[10001] animate-fadeIn"
          style={{
            background: `linear-gradient(135deg, ${colors.deepNavy} 0%, #1e293b 100%)`,
            border: `1px solid ${colors.brandGold}40`,
            borderRadius: '8px',
            padding: '6px 12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          <span 
            className="text-xs font-medium"
            style={{ color: colors.brandGold }}
          >
            Release to snap to edge
          </span>
        </div>
      )}
    </div>
  );
};
