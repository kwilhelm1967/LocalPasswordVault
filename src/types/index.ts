export type EntryType = "password" | "secure_note";

export interface PasswordEntry {
  id: string;
  entryType?: EntryType; // defaults to "password" for backwards compatibility
  accountName: string;
  username: string;
  password: string;
  website?: string;
  notes?: string;
  balance?: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  isFavorite?: boolean;
  passwordChangedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}