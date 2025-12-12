import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, UserRole, ADMIN_CREDENTIALS } from '../types';

// --- DEPLOYMENT CONFIGURATION ---
// FOR FRIENDS TO USE THE APP: You must paste your Supabase URL and Key here.
// If you leave these empty, every user will see a "Connect Database" screen.
const HARDCODED_SUPABASE_URL = 'https://lwthcjlilevpvmrmftwu.supabase.co'; 
const HARDCODED_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3dGhjamxpbGV2cHZtcm1mdHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTY4ODAsImV4cCI6MjA4MTA5Mjg4MH0.8_K2q3L_k8zUE_MIiV8c7sufTgmgQ09OFR2KWadWeA0';

class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private isConfigured = false;

  constructor() {
    this.initClient();
  }

  /**
   * Initialize Supabase client.
   * Priority:
   * 1. Parameters passed to initClient
   * 2. Hardcoded constants (for deployed apps)
   * 3. Environment variables (if using Vite/Build tools)
   * 4. LocalStorage (for local testing/admin setup)
   */
  initClient(url?: string, key?: string) {
    // Check for build-time env vars (Vite standard)
    // @ts-ignore - import.meta might not exist in all environments, but safe to check
    const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined;
    // @ts-ignore
    const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_KEY : undefined;

    const finalUrl = url || HARDCODED_SUPABASE_URL || envUrl || localStorage.getItem('ss_sb_url');
    const finalKey = key || HARDCODED_SUPABASE_KEY || envKey || localStorage.getItem('ss_sb_key');

    if (finalUrl && finalKey && finalUrl !== 'INSERT_URL' && !finalUrl.includes('placeholder')) {
      try {
        this.supabase = createClient(finalUrl, finalKey);
        this.isConfigured = true;
        
        // Only persist to localStorage if it was passed dynamically (UI input)
        // We don't want to fill localStorage if we are using hardcoded keys
        if (url && key) {
          localStorage.setItem('ss_sb_url', url);
          localStorage.setItem('ss_sb_key', key);
        }
      } catch (e) {
        console.error("Invalid Supabase URL/Key configuration", e);
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
    }
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Setup initial Admin user if table is empty
   */
  async seedAdminIfNeeded(): Promise<void> {
    if (!this.supabase) return;
    
    // Check if we can connect and if table exists
    const { count, error } = await this.supabase.from('users').select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error("Database connection error. Check if table 'users' exists.", error);
        return;
    }

    if (count === 0) {
       await this.supabase.from('users').insert({
        id: 'admin-1',
        username: ADMIN_CREDENTIALS.username,
        password: ADMIN_CREDENTIALS.password,
        role: UserRole.ADMIN,
        wishlist: '',
        assigned_to_id: null,
       });
    }
  }

  async getUsers(): Promise<User[]> {
    if (!this.supabase) throw new Error("DB not connected");
    
    const { data, error } = await this.supabase
      .from('users')
      .select('*');
      
    if (error) throw error;
    
    // Map snake_case to camelCase
    return data.map((u: any) => ({
      id: u.id,
      username: u.username,
      password: u.password,
      role: u.role as UserRole,
      wishlist: u.wishlist,
      assignedToId: u.assigned_to_id
    }));
  }

  async addUser(username: string, password: string): Promise<User> {
    if (!this.supabase) throw new Error("DB not connected");

    // Check existing
    const { data: existing } = await this.supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) throw new Error('Username already exists');

    const newUser = {
      id: crypto.randomUUID(),
      username,
      password,
      role: UserRole.PARTICIPANT,
      wishlist: '',
      assigned_to_id: null
    };

    const { error } = await this.supabase.from('users').insert(newUser);
    if (error) throw error;

    return {
        ...newUser,
        role: UserRole.PARTICIPANT,
        assignedToId: null
    };
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.supabase) throw new Error("DB not connected");

    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }

  async updateUserWishlist(userId: string, wishlist: string): Promise<void> {
    if (!this.supabase) throw new Error("DB not connected");
    
    const { error } = await this.supabase
        .from('users')
        .update({ wishlist })
        .eq('id', userId);
        
    if (error) throw error;
  }

  async getUserById(id: string): Promise<User | undefined> {
    if (!this.supabase) return undefined;

    const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error || !data) return undefined;

    return {
      id: data.id,
      username: data.username,
      password: data.password,
      role: data.role as UserRole,
      wishlist: data.wishlist,
      assignedToId: data.assigned_to_id
    };
  }

  async authenticate(username: string, password: string): Promise<User | null> {
    if (!this.supabase) throw new Error("DB not connected");

    const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password) // Basic plaintext auth as requested
        .single();

    if (error || !data) return null;

    return {
      id: data.id,
      username: data.username,
      password: data.password,
      role: data.role as UserRole,
      wishlist: data.wishlist,
      assignedToId: data.assigned_to_id
    };
  }

  async isShuffled(): Promise<boolean> {
    if (!this.supabase) return false;
    
    const { data } = await this.supabase
        .from('game_state')
        .select('value')
        .eq('key', 'is_shuffled')
        .single();
        
    return data?.value === 'true';
  }

  async performShuffle(): Promise<void> {
    if (!this.supabase) throw new Error("DB not connected");
    
    const users = await this.getUsers();
    const participants = users.filter(u => u.role === UserRole.PARTICIPANT);
    
    if (participants.length < 2) {
      throw new Error("Need at least 2 participants to shuffle.");
    }

    // Fisher-Yates Shuffle in memory
    for (let i = participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [participants[i], participants[j]] = [participants[j], participants[i]];
    }

    // Prepare updates
    const updates = [];
    for (let i = 0; i < participants.length; i++) {
      const giver = participants[i];
      const receiver = participants[(i + 1) % participants.length];
      
      // We push a promise to update this specific user
      updates.push(
          this.supabase
            .from('users')
            .update({ assigned_to_id: receiver.id })
            .eq('id', giver.id)
      );
    }

    await Promise.all(updates);

    // Set game state
    await this.supabase
        .from('game_state')
        .update({ value: 'true' })
        .eq('key', 'is_shuffled');
  }
  
  async resetGame(): Promise<void> {
      if (!this.supabase) throw new Error("DB not connected");
      
      // Clear assignments
      await this.supabase
        .from('users')
        .update({ assigned_to_id: null })
        .neq('id', 'admin'); // Update all users safe check

      // Reset flag
      await this.supabase
        .from('game_state')
        .update({ value: 'false' })
        .eq('key', 'is_shuffled');
  }

  async getAssignmentFor(userId: string): Promise<User | null> {
    const currentUser = await this.getUserById(userId);
    if (!currentUser || !currentUser.assignedToId) return null;
    
    return await this.getUserById(currentUser.assignedToId) || null;
  }
}

export const db = new DatabaseService();