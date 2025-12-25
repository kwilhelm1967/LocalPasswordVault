import React, { useState, useEffect } from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { licenseService } from "../utils/licenseService";
import { devError } from "../utils/devLog";

const colors = {
  deepNavy: "#0F172A",
  slateBackground: "#1E293B",
  steelBlue400: "#5B82B8",
  warmIvory: "#F3F4F6",
  successGreen: "#22C55E",
  errorRed: "#EF4444",
  warningAmber: "#F59E0B",
};

interface Device {
  id: string;
  hardware_hash: string;
  device_name: string;
  last_seen_at: string;
  is_active: boolean;
  is_current_device: boolean;
}

interface DeviceManagementScreenProps {
  onBack: () => void;
  licenseKey: string;
  maxDevices: number;
}

export const DeviceManagementScreen: React.FC<DeviceManagementScreenProps> = ({
  onBack,
  licenseKey,
  maxDevices,
}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // For now, we'll show devices from local license file
      // In a full implementation, this would call an API endpoint
      // But since we're privacy-first, we only show what's in the local file
      const localLicense = licenseService.getLocalLicenseFile();
      if (localLicense) {
        // Simulate device list (in real implementation, this would come from backend)
        // For privacy-first approach, we only show current device
        const currentDevice: Device = {
          id: 'current',
          hardware_hash: localLicense.device_id,
          device_name: getDeviceName(),
          last_seen_at: new Date().toISOString(),
          is_active: true,
          is_current_device: true,
        };
        setDevices([currentDevice]);
      }
    } catch (err) {
      devError('Failed to load devices:', err);
      setError('Failed to load device list');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceName = (): string => {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows Device';
    if (ua.includes('Mac')) return 'Mac Device';
    if (ua.includes('Linux')) return 'Linux Device';
    return 'Unknown Device';
  };

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('phone') || name.includes('mobile')) {
      return <Smartphone className="w-5 h-5" />;
    }
    if (name.includes('tablet')) {
      return <Tablet className="w-5 h-5" />;
    }
    if (name.includes('laptop')) {
      return <Laptop className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const handleDeactivateDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to deactivate this device? You will need to reactivate it to use the license on this device again.')) {
      return;
    }

    setDeactivatingId(deviceId);
    try {
      // In a full implementation, this would call backend API
      // For privacy-first approach, we only manage local device
      if (deviceId === 'current') {
        // Deactivating current device means removing license
        licenseService.removeLicense();
        onBack();
      } else {
        // Remove from list
        setDevices(devices.filter(d => d.id !== deviceId));
      }
    } catch (err) {
      devError('Failed to deactivate device:', err);
      setError('Failed to deactivate device');
    } finally {
      setDeactivatingId(null);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: colors.deepNavy }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
            style={{ color: colors.warmIvory }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.warmIvory }}>
              Device Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage devices for your Family Plan license
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div
          className="mb-6 p-4 rounded-lg border"
          style={{
            backgroundColor: 'rgba(91, 130, 184, 0.1)',
            borderColor: 'rgba(91, 130, 184, 0.3)',
          }}
        >
          <div className="flex items-start gap-3">
            <Monitor className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.steelBlue400 }} />
            <div>
              <p className="text-sm font-medium" style={{ color: colors.warmIvory }}>
                Family Plan: {devices.length} / {maxDevices} devices
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You can activate this license on up to {maxDevices} devices. Each device must be activated separately.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 p-4 rounded-lg border flex items-start gap-3"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.errorRed }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: colors.errorRed }}>
                Error
              </p>
              <p className="text-xs text-slate-300 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: colors.steelBlue400 }} />
            <span className="ml-3 text-slate-400">Loading devices...</span>
          </div>
        ) : devices.length === 0 ? (
          <div
            className="p-8 rounded-lg border text-center"
            style={{
              backgroundColor: colors.slateBackground,
              borderColor: 'rgba(148, 163, 184, 0.2)',
            }}
          >
            <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: colors.warmIvory }} />
            <p className="text-slate-400 mb-2">No devices found</p>
            <p className="text-xs text-slate-500">
              Activate this license on a device to see it here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: colors.slateBackground,
                  borderColor: device.is_current_device
                    ? 'rgba(34, 197, 94, 0.3)'
                    : 'rgba(148, 163, 184, 0.2)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: device.is_current_device
                          ? 'rgba(34, 197, 94, 0.1)'
                          : 'rgba(91, 130, 184, 0.1)',
                        color: device.is_current_device
                          ? colors.successGreen
                          : colors.steelBlue400,
                      }}
                    >
                      {getDeviceIcon(device.device_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm" style={{ color: colors.warmIvory }}>
                          {device.device_name}
                        </p>
                        {device.is_current_device && (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: 'rgba(34, 197, 94, 0.2)',
                              color: colors.successGreen,
                            }}
                          >
                            Current Device
                          </span>
                        )}
                        {!device.is_active && (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: 'rgba(148, 163, 184, 0.2)',
                              color: '#94A3B8',
                            }}
                          >
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-1">
                        Last seen: {formatDate(device.last_seen_at)}
                      </p>
                      <p className="text-xs font-mono text-slate-500 truncate">
                        {device.hardware_hash.substring(0, 16)}...
                      </p>
                    </div>
                  </div>
                  {!device.is_current_device && (
                    <button
                      onClick={() => handleDeactivateDevice(device.id)}
                      disabled={deactivatingId === device.id}
                      className="p-2 rounded-lg hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      style={{ color: colors.errorRed }}
                      title="Deactivate device"
                    >
                      {deactivatingId === device.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Text */}
        <div
          className="mt-6 p-4 rounded-lg border"
          style={{
            backgroundColor: 'rgba(148, 163, 184, 0.05)',
            borderColor: 'rgba(148, 163, 184, 0.2)',
          }}
        >
          <p className="text-xs text-slate-400">
            <strong className="text-slate-300">Note:</strong> Device management is currently limited to local devices only.
            To activate this license on additional devices, enter the license key on each device.
            Each device must activate separately using the same license key.
          </p>
        </div>
      </div>
    </div>
  );
};

