/**
 * Test PostgreSQL database connection
 * 
 * Usage:
 *   tsx scripts/test_db_connection.ts
 * 
 * Or with connection string:
 *   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME" tsx scripts/test_db_connection.ts
 */

import { Client } from 'pg';

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL environment variable is not set');
    console.log('\nPlease set it using one of these methods:');
    console.log('1. Export as environment variable:');
    console.log('   export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME"');
    console.log('2. Or pass it directly:');
    console.log('   DATABASE_URL="postgresql://..." tsx scripts/test_db_connection.ts');
    console.log('\nFor Supabase, get the connection string from:');
    console.log('   Settings → Database → Connection string');
    process.exit(1);
  }

  // Parse connection string to show what we're connecting to (without password)
  try {
    const url = new URL(connectionString);
    console.log('🔌 Attempting to connect to:');
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || '5432 (default)'}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    console.log(`   User: ${url.username}`);
    console.log('');
  } catch (e) {
    console.error('❌ Invalid connection string format');
    process.exit(1);
  }

  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false // For Supabase and most cloud providers
    }
  });

  try {
    console.log('⏳ Connecting...');
    await client.connect();
    console.log('✅ Successfully connected to database!');
    
    // Test query
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log('\n📊 Database Information:');
    console.log(`   PostgreSQL Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    console.log(`   Current Database: ${result.rows[0].current_database}`);
    console.log(`   Current User: ${result.rows[0].current_user}`);
    
    // Test table access (optional - adjust query as needed)
    try {
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        LIMIT 5
      `);
      if (tablesResult.rows.length > 0) {
        console.log(`\n📋 Sample tables (showing first 5):`);
        tablesResult.rows.forEach((row, i) => {
          console.log(`   ${i + 1}. ${row.table_name}`);
        });
      }
    } catch (e) {
      console.log('\n⚠️  Could not list tables (may not have permissions)');
    }
    
  } catch (error: any) {
    console.error('\n❌ Connection failed!');
    console.error(`\nError: ${error.message}`);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Tip: Check your password. Special characters may need URL encoding:');
      console.error('   @ → %40');
      console.error('   # → %23');
      console.error('   % → %25');
      console.error('   & → %26');
    } else if (error.message.includes('does not exist')) {
      console.error('\n💡 Tip: Check the database name in your connection string');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Tip: Check your host and port. Make sure the database is accessible');
    } else if (error.message.includes('SSL')) {
      console.error('\n💡 Tip: Try adding ?sslmode=require to your connection string');
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Connection closed');
  }
}

testConnection();


