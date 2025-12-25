/**
 * Type Guards and Utility Types
 * 
 * Provides runtime type checking and utility types for better type safety.
 */

import { PasswordEntry, Category } from "../types";

/**
 * Type guard to check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type guard to check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

/**
 * Type guard to check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Type guard to check if value is an object (not null, not array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Type guard to check if value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if value is a valid PasswordEntry
 */
export function isPasswordEntry(value: unknown): value is PasswordEntry {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.title) &&
    (value.username === undefined || isString(value.username)) &&
    (value.password === undefined || isString(value.password)) &&
    (value.url === undefined || isString(value.url)) &&
    (value.notes === undefined || isString(value.notes)) &&
    (value.category === undefined || isString(value.category)) &&
    (value.createdAt instanceof Date || isString(value.createdAt)) &&
    (value.updatedAt instanceof Date || isString(value.updatedAt))
  );
}

/**
 * Type guard to check if value is a valid Category
 */
export function isCategory(value: unknown): value is Category {
  if (!isObject(value)) return false;

  return (
    isString(value.id) &&
    isString(value.name) &&
    isString(value.color) &&
    isString(value.icon)
  );
}

/**
 * Type guard to check if value is a valid array of PasswordEntry
 */
export function isPasswordEntryArray(value: unknown): value is PasswordEntry[] {
  if (!isArray(value)) return false;
  return value.every((item) => isPasswordEntry(item));
}

/**
 * Type guard to check if value is a valid array of Category
 */
export function isCategoryArray(value: unknown): value is Category[] {
  if (!isArray(value)) return false;
  return value.every((item) => isCategory(item));
}

/**
 * Utility type: Make all properties optional except specified ones
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Utility type: Make all properties required except specified ones
 */
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>;

/**
 * Utility type: Extract promise type
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Utility type: Deep readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Utility type: Non-nullable
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Assert that value is not null/undefined
 */
export function assertNotNull<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || "Value is null or undefined");
  }
}

/**
 * Assert that value is a string
 */
export function assertString(value: unknown, message?: string): asserts value is string {
  if (!isString(value)) {
    throw new Error(message || "Value is not a string");
  }
}

/**
 * Assert that value is a number
 */
export function assertNumber(value: unknown, message?: string): asserts value is number {
  if (!isNumber(value)) {
    throw new Error(message || "Value is not a number");
  }
}

/**
 * Safe parse JSON with type guard
 */
export function safeParseJSON<T>(json: string, guard?: (value: unknown) => value is T): T | null {
  try {
    const parsed = JSON.parse(json);
    if (guard && !guard(parsed)) {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

