// Simple localStorage-based storage (no Supabase, no IndexedDB)

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  order_index: number;
  is_two_step: boolean;
  created_at: string;
  updated_at: string;
  schema_version: number;
}

export interface HabitEntry {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  value: number;
  fasting_hours?: number;
  note?: string;
  updated_at: string;
}

const STORAGE_KEY = 'master-mausam-data';

interface StorageData {
  habits: Habit[];
  entries: HabitEntry[];
}

function getStorage(): StorageData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { habits: [], entries: [] };
  } catch {
    return { habits: [], entries: [] };
  }
}

function setStorage(data: StorageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Generate a deterministic ID for entries (user_id + habit_id + date)
export function generateEntryId(userId: string, habitId: string, date: string): string {
  return `${userId}:${habitId}:${date}`;
}

// Parse entry ID back to components
export function parseEntryId(entryId: string): { userId: string; habitId: string; date: string } {
  const parts = entryId.split(':');
  return {
    userId: parts[0] || '',
    habitId: parts[1] || '',
    date: parts[2] || '',
  };
}

// Get habits from localStorage
export async function getHabits(userId: string): Promise<Habit[]> {
  const data = getStorage();
  return data.habits.filter(h => h.user_id === userId).sort((a, b) => a.order_index - b.order_index);
}

export async function getHabit(userId: string, habitId: string): Promise<Habit | undefined> {
  const data = getStorage();
  return data.habits.find(h => h.id === habitId && h.user_id === userId);
}

export async function saveHabit(userId: string, habit: Partial<Habit> & { id: string }): Promise<Habit> {
  const data = getStorage();
  const now = new Date().toISOString();
  
  const existing = data.habits.find(h => h.id === habit.id);
  
  const fullHabit: Habit = {
    user_id: userId,
    name: habit.name || existing?.name || 'New Habit',
    icon: habit.icon || existing?.icon || '⭐',
    color: habit.color || existing?.color || '#3b82f6',
    order_index: habit.order_index ?? existing?.order_index ?? data.habits.length,
    is_two_step: habit.is_two_step ?? existing?.is_two_step ?? false,
    created_at: existing?.created_at || now,
    updated_at: now,
    schema_version: habit.schema_version ?? existing?.schema_version ?? 1,
    ...habit,
  } as Habit;

  // Replace or add
  const idx = data.habits.findIndex(h => h.id === habit.id);
  if (idx >= 0) {
    data.habits[idx] = fullHabit;
  } else {
    data.habits.push(fullHabit);
  }
  
  setStorage(data);
  return fullHabit;
}

export async function deleteHabit(userId: string, habitId: string): Promise<void> {
  const data = getStorage();
  data.habits = data.habits.filter(h => !(h.id === habitId && h.user_id === userId));
  data.entries = data.entries.filter(e => !(e.habit_id === habitId && e.user_id === userId));
  setStorage(data);
}

export async function reorderHabits(userId: string, habitIds: string[]): Promise<void> {
  const data = getStorage();
  const now = new Date().toISOString();
  
  habitIds.forEach((id, index) => {
    const habit = data.habits.find(h => h.id === id && h.user_id === userId);
    if (habit) {
      habit.order_index = index;
      habit.updated_at = now;
    }
  });
  
  setStorage(data);
}

export async function getHabitEntries(userId: string, options?: { habitId?: string; date?: string }): Promise<HabitEntry[]> {
  const data = getStorage();
  let entries = data.entries.filter(e => e.user_id === userId);
  
  if (options?.habitId) {
    entries = entries.filter(e => e.habit_id === options.habitId);
  }
  if (options?.date) {
    entries = entries.filter(e => e.date === options.date);
  }
  
  return entries;
}

export async function getHabitEntry(userId: string, habitId: string, date: string): Promise<HabitEntry | undefined> {
  const entryId = generateEntryId(userId, habitId, date);
  const data = getStorage();
  return data.entries.find(e => e.id === entryId && e.user_id === userId);
}

export async function saveHabitEntry(
  userId: string,
  habitId: string,
  date: string,
  entryData: { value: number; fasting_hours?: number; note?: string }
): Promise<HabitEntry> {
  const data = getStorage();
  const entryId = generateEntryId(userId, habitId, date);
  const now = new Date().toISOString();
  
  const entry: HabitEntry = {
    id: entryId,
    user_id: userId,
    habit_id: habitId,
    date,
    value: entryData.value,
    fasting_hours: entryData.fasting_hours,
    note: entryData.note,
    updated_at: now,
  };

  // Replace or add
  const idx = data.entries.findIndex(e => e.id === entryId);
  if (idx >= 0) {
    data.entries[idx] = entry;
  } else {
    data.entries.push(entry);
  }
  
  setStorage(data);
  return entry;
}

export async function deleteHabitEntry(userId: string, habitId: string, date: string): Promise<void> {
  const entryId = generateEntryId(userId, habitId, date);
  const data = getStorage();
  data.entries = data.entries.filter(e => e.id !== entryId);
  setStorage(data);
}

// Dummy functions for compatibility
export async function performSync(): Promise<{ success: boolean; errors: string[] }> {
  return { success: true, errors: [] };
}

export async function pullFromServer(_userId: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function fullSync(_userId: string): Promise<{ success: boolean; errors: string[] }> {
  return { success: true, errors: [] };
}

export function triggerBackgroundSync(): void {
  // No-op
}

export async function getSettings(_userId: string): Promise<null> {
  return null;
}

export async function saveSettings(_userId: string, _settings: unknown): Promise<null> {
  return null;
}
