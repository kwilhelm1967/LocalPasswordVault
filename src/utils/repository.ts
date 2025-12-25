/**
 * Repository Pattern
 * 
 * Provides abstraction layer for data access operations.
 * Separates business logic from data storage implementation.
 */

import { PasswordEntry } from "../types";

/**
 * Base repository interface
 */
export interface Repository<T, ID = string> {
  findAll(): Promise<T[]>;
  findById(id: ID): Promise<T | null>;
  create(entity: T): Promise<T>;
  update(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
  exists(id: ID): Promise<boolean>;
}

/**
 * Password entry repository interface
 */
export interface IPasswordEntryRepository extends Repository<PasswordEntry> {
  findByCategory(category: string): Promise<PasswordEntry[]>;
  search(query: string): Promise<PasswordEntry[]>;
  saveAll(entries: PasswordEntry[]): Promise<void>;
}

/**
 * Storage-based password entry repository implementation
 */
export class PasswordEntryRepository implements IPasswordEntryRepository {
  constructor(
    private storageService: {
      loadEntries: () => Promise<PasswordEntry[]>;
      saveEntries: (entries: PasswordEntry[]) => Promise<void>;
    }
  ) {}

  async findAll(): Promise<PasswordEntry[]> {
    return this.storageService.loadEntries();
  }

  async findById(id: string): Promise<PasswordEntry | null> {
    const entries = await this.findAll();
    return entries.find((entry) => entry.id === id) || null;
  }

  async create(entity: PasswordEntry): Promise<PasswordEntry> {
    const entries = await this.findAll();
    const updated = [...entries, entity];
    await this.storageService.saveEntries(updated);
    return entity;
  }

  async update(entity: PasswordEntry): Promise<PasswordEntry> {
    const entries = await this.findAll();
    const updated = entries.map((e) => (e.id === entity.id ? entity : e));
    await this.storageService.saveEntries(updated);
    return entity;
  }

  async delete(id: string): Promise<void> {
    const entries = await this.findAll();
    const filtered = entries.filter((e) => e.id !== id);
    await this.storageService.saveEntries(filtered);
  }

  async exists(id: string): Promise<boolean> {
    const entry = await this.findById(id);
    return entry !== null;
  }

  async findByCategory(category: string): Promise<PasswordEntry[]> {
    const entries = await this.findAll();
    if (category === "all") {
      return entries;
    }
    return entries.filter((entry) => entry.category === category);
  }

  async search(query: string): Promise<PasswordEntry[]> {
    const entries = await this.findAll();
    const lowerQuery = query.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.username?.toLowerCase().includes(lowerQuery) ||
        entry.url?.toLowerCase().includes(lowerQuery) ||
        entry.notes?.toLowerCase().includes(lowerQuery)
    );
  }

  async saveAll(entries: PasswordEntry[]): Promise<void> {
    await this.storageService.saveEntries(entries);
  }
}

/**
 * Factory function to create repository instances
 */
export function createPasswordEntryRepository(
  storageService: {
    loadEntries: () => Promise<PasswordEntry[]>;
    saveEntries: (entries: PasswordEntry[]) => Promise<void>;
  }
): IPasswordEntryRepository {
  return new PasswordEntryRepository(storageService);
}

