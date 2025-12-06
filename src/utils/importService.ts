import { PasswordEntry } from "../types";

// Supported CSV headers (must match export format)
const CSV_HEADERS = [
  "Account Name",
  "Username",
  "Password",
  "Category",
  "Account Details",
  "Notes",
  "Created Date",
  "Updated Date",
];

// Valid categories fallback mapping (mirror UI categories)
const VALID_CATEGORIES = new Set<string>([
  "all",
  "banking",
  "shopping",
  "entertainment",
  "business",
  "email",
  "work",
  "other",
]);

export interface ImportResult {
  entries: PasswordEntry[];
  warnings: string[];
  format: "csv" | "json";
}

// Raw entry format from JSON import (unknown structure)
interface RawImportEntry {
  id?: string;
  accountName?: string;
  username?: string;
  password?: string;
  category?: string;
  balance?: string;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

function normalizeCategory(raw: string): string {
  if (!raw) return "other";
  const val = raw.trim().toLowerCase();
  if (VALID_CATEGORIES.has(val)) return val;
  // Friendly name mapping
  if (val.includes("bank")) return "banking";
  if (val.includes("shop")) return "shopping";
  if (val.includes("entertain")) return "entertainment";
  if (val.includes("work")) return "work";
  if (val.includes("mail")) return "email";
  if (val.includes("biz") || val.includes("business")) return "business";
  return "other";
}

function parseDate(value: string | undefined): Date {
  if (!value) return new Date();
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

function parseCsv(content: string): ImportResult {
  const warnings: string[] = [];
  const lines = content
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { entries: [], warnings: ["Empty file"], format: "csv" };
  }
  const headerLine = lines[0];
  const headers = headerLine
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));
  const headerMismatch = CSV_HEADERS.some((h, i) => headers[i] !== h);
  if (headerMismatch) {
    warnings.push("Header mismatch – attempting best-effort parse");
  }

  const entries: PasswordEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;

    // CSV basic splitter respecting quotes
    const cols: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let c = 0; c < raw.length; c++) {
      const ch = raw[c];
      if (ch === '"') {
        if (inQuotes && raw[c + 1] === '"') {
          // escaped quote
          cur += '"';
          c++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cols.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur);

    while (cols.length < CSV_HEADERS.length) cols.push("");

    const [
      accountName,
      username,
      password,
      category,
      balance,
      notes,
      createdAt,
      updatedAt,
    ] = cols.map((c) => c.replace(/^"|"$/g, ""));
    if (!accountName && !username && !password) {
      warnings.push(`Skipped empty row ${i + 1}`);
      continue;
    }
    if (!password) {
      warnings.push(`Row ${i + 1} missing password – skipped`);
      continue;
    }

    const entry: PasswordEntry = {
      id: crypto.randomUUID(),
      accountName: accountName || "(no name)",
      username: username || "",
      password,
      category: normalizeCategory(category),
      balance: balance || undefined,
      notes: notes || undefined,
      createdAt: parseDate(createdAt),
      updatedAt: parseDate(updatedAt),
    };
    entries.push(entry);
  }
  return { entries, warnings, format: "csv" };
}

function parseJson(content: string): ImportResult {
  const warnings: string[] = [];
  try {
    const data = JSON.parse(content);
    // Accept either { entries: [...] } or direct array
    const rawEntries = Array.isArray(data)
      ? data
      : Array.isArray(data.entries)
      ? data.entries
      : [];
    if (!rawEntries.length) {
      return {
        entries: [],
        warnings: ["No entries found in JSON"],
        format: "json",
      };
    }
    const entries: PasswordEntry[] = (rawEntries as RawImportEntry[])
      .map((e, idx) => {
        if (!e.password)
          warnings.push(`Entry ${idx + 1} missing password – skipped`);
        return {
          id: e.id && typeof e.id === "string" ? e.id : crypto.randomUUID(),
          accountName: e.accountName || "(no name)",
          username: e.username || "",
          password: e.password || "",
          category: normalizeCategory(e.category || "other"),
          balance: e.balance || undefined,
          notes: e.notes || undefined,
          createdAt: parseDate(e.createdAt),
          updatedAt: parseDate(e.updatedAt),
        } as PasswordEntry;
      })
      .filter((e) => !!e.password);
    return { entries, warnings, format: "json" };
  } catch (err) {
    return { entries: [], warnings: ["Invalid JSON file"], format: "json" };
  }
}

export const importService = {
  importContent(content: string): ImportResult {
    // Detect format
    const trimmed = content.trim();
    if (!trimmed)
      return { entries: [], warnings: ["Empty file"], format: "csv" };
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      return parseJson(content);
    }
    return parseCsv(content);
  },
};
