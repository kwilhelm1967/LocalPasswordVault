/**
 * Dashboard Component
 * 
 * Overview page with stats, recent activity, and quick actions.
 */

import React, { useMemo, useState } from "react";
import {
  Shield,
  Key,
  Lock,
  AlertTriangle,
  TrendingUp,
  Plus,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  FileText,
  CalendarClock,
  Clock,
} from "lucide-react";
import { PasswordEntry, Category } from "../types";
import { CategoryIcon } from "./CategoryIcon";

// Refined color palette
const colors = {
  steelBlue600: "#4A6FA5",
  steelBlue500: "#5B82B8",
  steelBlue400: "#7A9DC7",
  mutedSky: "#93B4D1",
  warmIvory: "#F3F4F6",
};

interface DashboardProps {
  entries: PasswordEntry[];
  categories: Category[];
  onAddEntry: () => void;
  onViewCategory: (categoryId: string) => void;
  onViewEntry: (entry: PasswordEntry) => void;
  onEditEntry: (entry: PasswordEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onViewWeakPasswords?: () => void;
  onViewReusedPasswords?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  entries,
  categories,
  onAddEntry,
  onViewCategory,
  onViewEntry,
  onEditEntry,
  onDeleteEntry,
  onViewWeakPasswords,
  onViewReusedPasswords,
}) => {
  // State for expanded cards and visible passwords
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  // Calculate statistics
  const stats = useMemo(() => {
    const totalAccounts = entries.length;
    
    // Count by category
    const categoryCounts: Record<string, number> = {};
    entries.forEach((entry) => {
      categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
    });

    // Password strength analysis (simplified)
    let weakPasswords = 0;
    let strongPasswords = 0;
    
    entries.forEach((entry) => {
      const pwd = entry.password;
      const hasUpper = /[A-Z]/.test(pwd);
      const hasLower = /[a-z]/.test(pwd);
      const hasNumber = /[0-9]/.test(pwd);
      const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
      const isLong = pwd.length >= 12;
      
      const strength = [hasUpper, hasLower, hasNumber, hasSymbol, isLong].filter(Boolean).length;
      
      if (strength <= 2) weakPasswords++;
      else if (strength >= 4) strongPasswords++;
    });

    // Recently added (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentlyAdded = entries.filter(
      (e) => new Date(e.createdAt) > weekAgo
    ).length;

    // Recently updated (last 30 days)
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const recentlyUpdated = entries.filter(
      (e) => new Date(e.updatedAt) > monthAgo
    ).length;

    // Count reused passwords
    const passwordCounts: Record<string, number> = {};
    entries.forEach((entry) => {
      if (entry.password && entry.entryType !== "secure_note") {
        passwordCounts[entry.password] = (passwordCounts[entry.password] || 0) + 1;
      }
    });
    const reusedPasswords = Object.values(passwordCounts).filter(count => count > 1).reduce((sum, count) => sum + count, 0);

    // Count old passwords (>90 days)
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oldPasswords = entries.filter((entry) => {
      if (entry.entryType === "secure_note") return false;
      const changeDate = entry.passwordChangedAt || entry.createdAt;
      return new Date(changeDate) < ninetyDaysAgo;
    }).length;

    return {
      totalAccounts,
      categoryCounts,
      weakPasswords,
      strongPasswords,
      recentlyAdded,
      recentlyUpdated,
      reusedPasswords,
      oldPasswords,
    };
  }, [entries]);

  // Get recent entries (last 5)
  const recentEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [entries]);

  // Security score (0-100)
  const securityScore = useMemo(() => {
    if (entries.length === 0) return 100;
    
    const strongRatio = stats.strongPasswords / entries.length;
    const weakPenalty = (stats.weakPasswords / entries.length) * 30;
    const reusedPenalty = (stats.reusedPasswords / entries.length) * 20;
    const oldPenalty = (stats.oldPasswords / entries.length) * 10;
    
    return Math.max(0, Math.min(100, Math.round(strongRatio * 100 - weakPenalty - reusedPenalty - oldPenalty)));
  }, [entries.length, stats.strongPasswords, stats.weakPasswords, stats.reusedPasswords, stats.oldPasswords]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.warmIvory }}>Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Your password vault overview
          </p>
        </div>
        <button
          onClick={onAddEntry}
          className="px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          style={{ backgroundColor: colors.steelBlue600 }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.steelBlue500}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.steelBlue600}
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Add Account
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <div className="bouncy-card py-3.5 px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Accounts</p>
              <p className="text-[1.625rem] font-bold mt-1" style={{ color: colors.warmIvory }}>{stats.totalAccounts}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.steelBlue600}15` }}>
              <Key className="w-6 h-6" strokeWidth={1.5} style={{ color: colors.brandGold }} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
            <span className="text-emerald-400">{stats.recentlyAdded}</span>
            <span className="text-slate-500">added this week</span>
          </div>
        </div>

        {/* Security Score */}
        <div className="bouncy-card py-3.5 px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Security Score</p>
              <p className={`text-[1.625rem] font-bold mt-1 ${getScoreColor(securityScore)}`}>{securityScore}%</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <Lock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
            <span className={getScoreColor(securityScore)}>{getScoreLabel(securityScore)}</span>
          </div>
        </div>

        {/* Strong Passwords */}
        <div className="bouncy-card py-3.5 px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Strong Passwords</p>
              <p className="text-[1.625rem] font-bold mt-1" style={{ color: colors.warmIvory }}>{stats.strongPasswords}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.mutedSky}15` }}>
              <Lock className="w-6 h-6" strokeWidth={1.5} style={{ color: colors.mutedSky }} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">
              {entries.length > 0 
                ? `${Math.round((stats.strongPasswords / entries.length) * 100)}% of total`
                : "No accounts yet"}
            </span>
          </div>
        </div>

        {/* Weak Passwords */}
        <div 
          className={`bouncy-card py-3.5 px-4 ${stats.weakPasswords > 0 ? "bouncy-card-clickable" : ""}`}
          style={stats.weakPasswords > 0 ? { borderColor: 'rgba(251, 191, 36, 0.4)' } : {}}
          onClick={stats.weakPasswords > 0 ? onViewWeakPasswords : undefined}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Weak Passwords</p>
              <p className={`text-[1.625rem] font-bold mt-1 ${stats.weakPasswords > 0 ? "text-amber-400" : ""}`} style={stats.weakPasswords === 0 ? { color: colors.warmIvory } : {}}>
                {stats.weakPasswords}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              stats.weakPasswords > 0 ? "bg-amber-500/10" : "bg-slate-700/50"
            }`}>
              <AlertTriangle className={`w-6 h-6 ${stats.weakPasswords > 0 ? "text-amber-400" : "text-slate-500"}`} strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {stats.weakPasswords > 0 ? (
              <span className="text-amber-400 flex items-center gap-1">
                Click to view & update
                <ChevronRight className="w-3 h-3" strokeWidth={2} />
              </span>
            ) : stats.totalAccounts === 0 ? (
              <span className="text-slate-500">No passwords yet</span>
            ) : (
              <span className="text-emerald-400">All passwords are secure!</span>
            )}
          </div>
        </div>

        {/* Reused Passwords */}
        <div 
          className={`bouncy-card py-3.5 px-4 ${stats.reusedPasswords > 0 ? "bouncy-card-clickable" : ""}`}
          style={stats.reusedPasswords > 0 ? { borderColor: 'rgba(201, 174, 102, 0.4)' } : {}}
          onClick={stats.reusedPasswords > 0 ? onViewReusedPasswords : undefined}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Reused Passwords</p>
              <p 
                className="text-[1.625rem] font-bold mt-1"
                style={stats.reusedPasswords > 0 ? { color: '#C9AE66' } : { color: colors.warmIvory }}
              >
                {stats.reusedPasswords}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={stats.reusedPasswords > 0 ? { backgroundColor: 'rgba(201, 174, 102, 0.15)' } : { backgroundColor: 'rgb(51 65 85 / 0.5)' }}
            >
              <AlertTriangle 
                className="w-6 h-6" 
                strokeWidth={1.5} 
                style={stats.reusedPasswords > 0 ? { color: '#C9AE66' } : { color: 'rgb(100 116 139)' }}
              />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {stats.reusedPasswords > 0 ? (
              <span style={{ color: '#C9AE66' }} className="flex items-center gap-1">
                Click to view & update
                <ChevronRight className="w-3 h-3" strokeWidth={2} />
              </span>
            ) : stats.totalAccounts === 0 ? (
              <span className="text-slate-500">No passwords yet</span>
            ) : (
              <span className="text-emerald-400">All passwords are unique!</span>
            )}
          </div>
        </div>

        {/* Old Passwords (>90 days) */}
        <div className="bouncy-card py-3.5 px-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Old Passwords</p>
              <p className={`text-[1.625rem] font-bold mt-1 ${stats.oldPasswords > 0 ? "text-orange-400" : ""}`} style={stats.oldPasswords === 0 ? { color: colors.warmIvory } : {}}>
                {stats.oldPasswords}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              stats.oldPasswords > 0 ? "bg-orange-500/10" : "bg-slate-700/50"
            }`}>
              <CalendarClock className={`w-6 h-6 ${stats.oldPasswords > 0 ? "text-orange-400" : "text-slate-500"}`} strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {stats.oldPasswords > 0 ? (
              <span className="text-orange-400">{stats.oldPasswords} over 90 days old</span>
            ) : stats.totalAccounts === 0 ? (
              <span className="text-slate-500">No passwords yet</span>
            ) : (
              <span className="text-emerald-400">All passwords are fresh!</span>
            )}
          </div>
        </div>

      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={onAddEntry}
          className="bg-slate-800/30 border border-[#5B82B8]/40 rounded-xl p-5 hover:bg-slate-800/50 hover:border-[#5B82B8]/60 transition-all group text-left"
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.steelBlue500}15` }}
            >
              <Plus className="w-6 h-6" strokeWidth={1.5} style={{ color: colors.brandGold }} />
            </div>
            <div>
              <h3 style={{ color: colors.warmIvory }} className="font-semibold mb-0.5">Add Account</h3>
              <p className="text-slate-500 text-xs">Store a new password</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onViewCategory("all")}
          className="bg-slate-800/30 border border-[#5B82B8]/40 rounded-xl p-5 hover:bg-slate-800/50 hover:border-[#5B82B8]/60 transition-all group text-left"
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.steelBlue500}15` }}
            >
              <Key className="w-6 h-6" strokeWidth={1.5} style={{ color: colors.brandGold }} />
            </div>
            <div>
              <h3 style={{ color: colors.warmIvory }} className="font-semibold mb-0.5">View All Accounts</h3>
              <p className="text-slate-500 text-xs">{entries.length} {entries.length === 1 ? 'account' : 'accounts'} stored</p>
            </div>
          </div>
        </button>

        <button
          onClick={onViewWeakPasswords}
          className="bg-slate-800/30 border border-[#5B82B8]/40 rounded-xl p-5 hover:bg-slate-800/50 hover:border-[#5B82B8]/60 transition-all group text-left"
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: stats.weakPasswords > 0 ? 'rgba(239, 68, 68, 0.15)' : `${colors.steelBlue500}15` }}
            >
              <Shield className="w-6 h-6" strokeWidth={1.5} style={{ color: stats.weakPasswords > 0 ? '#EF4444' : colors.steelBlue400 }} />
            </div>
            <div>
              <h3 style={{ color: colors.warmIvory }} className="font-semibold mb-0.5">Security Check</h3>
              <p className="text-xs" style={{ color: stats.weakPasswords > 0 ? '#EF4444' : '#64748B' }}>
                {stats.weakPasswords > 0 ? `${stats.weakPasswords} weak passwords` : 'All passwords secure'}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Security Alerts */}
      {(stats.weakPasswords > 0 || stats.reusedPasswords > 0 || stats.oldPasswords > 0) && (
        <div className="bg-slate-800/30 border border-[#5B82B8]/40 rounded-xl p-5">
          <h2 style={{ color: colors.warmIvory }} className="font-semibold mb-4">Security Alerts</h2>
          <div className="space-y-3">
            {stats.weakPasswords > 0 && (
              <button
                onClick={onViewWeakPasswords}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/30 transition-all group"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" strokeWidth={1.5} />
                  <div className="text-left">
                    <p className="text-sm text-red-400 font-medium">{stats.weakPasswords} Weak Password{stats.weakPasswords > 1 ? 's' : ''}</p>
                    <p className="text-xs text-slate-500">These passwords are easy to guess</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400/60 group-hover:text-red-400 transition-colors" strokeWidth={1.5} />
              </button>
            )}
            
            {stats.reusedPasswords > 0 && (
              <button
                onClick={onViewReusedPasswords}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/30 transition-all group"
                style={{ backgroundColor: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)' }}
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
                  <div className="text-left">
                    <p className="text-sm text-amber-400 font-medium">{stats.reusedPasswords} Reused Password{stats.reusedPasswords > 1 ? 's' : ''}</p>
                    <p className="text-xs text-slate-500">Using same password on multiple sites</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400/60 group-hover:text-amber-400 transition-colors" strokeWidth={1.5} />
              </button>
            )}
            
            {stats.oldPasswords > 0 && (
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'rgba(251, 146, 60, 0.08)', border: '1px solid rgba(251, 146, 60, 0.2)' }}
              >
                <div className="flex items-center gap-3">
                  <CalendarClock className="w-5 h-5 text-orange-400" strokeWidth={1.5} />
                  <div className="text-left">
                    <p className="text-sm text-orange-400 font-medium">{stats.oldPasswords} Old Password{stats.oldPasswords > 1 ? 's' : ''}</p>
                    <p className="text-xs text-slate-500">Haven't been changed in 90+ days</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Getting Started - Only show when no entries */}
      {entries.length === 0 && (
        <div className="bg-slate-800/30 border border-[#5B82B8]/40 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-slate-700/50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8" strokeWidth={1.5} style={{ color: colors.brandGold }} />
          </div>
          <h2 style={{ color: colors.warmIvory }} className="font-semibold mb-2">Welcome to Local Password Vault</h2>
          <p className="text-slate-500 text-sm mb-4 max-w-md mx-auto">
            Your passwords are stored locally and encrypted. Start by adding your first account or importing from another password manager.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onAddEntry}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: colors.steelBlue500 }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.steelBlue600}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.steelBlue500}
            >
              Add First Account
            </button>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div 
        className="border rounded-xl p-5"
        style={{ 
          background: `linear-gradient(135deg, ${colors.steelBlue600}10, ${colors.mutedSky}10)`,
          borderColor: `${colors.steelBlue500}30`
        }}
      >
        <div className="flex items-start gap-4">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${colors.steelBlue500}25` }}
          >
            <Shield className="w-5 h-5" strokeWidth={1.5} style={{ color: colors.brandGold }} />
          </div>
          <div>
            <h3 style={{ color: colors.warmIvory }} className="font-medium mb-1">Security Tip</h3>
            <p className="text-slate-400 text-sm">
              {stats.weakPasswords > 0 
                ? `You have ${stats.weakPasswords} weak password${stats.weakPasswords > 1 ? 's' : ''}. Consider using the password generator to create stronger, unique passwords for each account.`
                : entries.length === 0
                ? "Start by adding your most important accounts. Use unique, strong passwords for each one."
                : "Great job! Your passwords are strong. Remember to update them periodically for maximum security."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

