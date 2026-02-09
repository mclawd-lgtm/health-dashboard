#!/usr/bin/env node
/**
 * Supabase Migration Runner
 * Run: node scripts/migrate.js [migration-file]
 * 
 * Example: node scripts/migrate.js 002_simplified_schema.sql
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load credentials from .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  const migrationFile = process.argv[2] || '002_simplified_schema.sql';
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    console.log('Available migrations:');
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    if (fs.existsSync(migrationsDir)) {
      fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .forEach(f => console.log(`  - ${f}`));
    }
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`🚀 Running migration: ${migrationFile}`);
  console.log('=' .repeat(60));

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const shortStmt = statement.substring(0, 50).replace(/\s+/g, ' ');
    
    process.stdout.write(`[${i + 1}/${statements.length}] ${shortStmt}... `);

    try {
      // Execute SQL via Supabase REST API
      const { error } = await supabase.rpc('exec_sql', { 
        query: statement + ';' 
      });

      if (error) {
        // If exec_sql doesn't exist, try alternative approach
        if (error.message?.includes('Could not find the function')) {
          // Use raw SQL via REST API (limited but works for simple statements)
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'tx=rollback' // Rollback on error
            },
            body: JSON.stringify({ query: statement })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
        } else {
          throw error;
        }
      }

      console.log('✅');
      successCount++;
    } catch (err) {
      console.log('❌');
      console.error(`   Error: ${err.message}`);
      errorCount++;
      
      // Continue with next statement unless it's critical
      if (statement.toLowerCase().includes('drop database')) {
        console.error('   Critical error, stopping migration');
        break;
      }
    }
  }

  console.log('=' .repeat(60));
  console.log(`\n📊 Migration Complete:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  if (errorCount > 0) {
    console.log('\n⚠️  Some statements failed. Check errors above.');
    console.log('💡 Tip: Run remaining statements manually in Supabase SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql`);
    process.exit(1);
  } else {
    console.log('\n🎉 All migrations completed successfully!');
  }
}

// Alternative: Use Supabase CLI if available
async function runWithCLI() {
  console.log('💡 Note: For full SQL support, install Supabase CLI:');
  console.log('   npm install -g supabase');
  console.log('   supabase link --project-ref <your-project-ref>');
  console.log('   supabase db push\n');
  
  await runMigration();
}

runWithCLI().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
