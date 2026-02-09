// Migrations - disabled for offline mode
export async function runMigrations(): Promise<{ success: boolean; applied: number; errors: string[] }> {
  return { success: true, applied: 0, errors: [] };
}

export function getCurrentSchemaVersion(): number {
  return 1;
}

export const migrationUtils = {
  getCurrentSchemaVersion,
};
