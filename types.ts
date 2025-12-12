export enum UserRole {
  ADMIN = 'ADMIN',
  PARTICIPANT = 'PARTICIPANT'
}

export interface User {
  id: string;
  username: string;
  password?: string; // Optional for safety when passing around UI, but stored in DB
  role: UserRole;
  wishlist?: string;
  assignedToId?: string | null; // The ID of the person this user must buy a gift for
}

export interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
}

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'password123'
};