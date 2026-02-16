# PostgreSQL Connection Troubleshooting Guide

## Common Connection String Errors

### 1. **Password with Special Characters**

If your password contains special characters, they must be URL-encoded:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `#` | `%23` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `=` | `%3D` |
| `?` | `%3F` |
| `/` | `%2F` |
| `:` | `%3A` |
| ` ` (space) | `%20` or `+` |

**Example:**
```
# Original password: P@ssw0rd#123
# Encoded: P%40ssw0rd%23123

postgresql://user:P%40ssw0rd%23123@host:5432/dbname
```

### 2. **Supabase Connection Strings**

For Supabase, get your connection string from:
**Settings → Database → Connection string**

#### Using Connection Pooler (Recommended):
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### Direct Connection:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

**Important:** 
- Use port `6543` for pooler (recommended)
- Use port `5432` for direct connection
- Add `?sslmode=require` if SSL is required

### 3. **Testing Connection with psql**

#### Basic syntax:
```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

#### With SSL:
```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```

#### Example for Supabase:
```bash
psql "postgresql://postgres.xxxxx:your_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
```

### 4. **Common Error Messages & Solutions**

| Error | Solution |
|-------|----------|
| `password authentication failed` | Check password encoding, verify credentials |
| `database "postgres" does not exist` | Use correct database name (check Supabase settings) |
| `connection refused` | Check host and port, verify firewall settings |
| `SSL connection required` | Add `?sslmode=require` to connection string |
| `timeout` | Check network connectivity, verify host is accessible |

### 5. **Using Environment Variables**

Create a `.env.local` file (don't commit this!):
```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Then use it:
```bash
psql "$DATABASE_URL"
```

### 6. **Quick Test Script**

Install dependencies:
```bash
npm install --save-dev pg @types/pg
```

Run the test script:
```bash
DATABASE_URL="your_connection_string" tsx scripts/test_db_connection.ts
```

## Quick Fix Checklist

- [ ] Password is URL-encoded (special characters)
- [ ] Database name is correct (not always "postgres")
- [ ] Host and port are correct
- [ ] SSL parameters added if required (`?sslmode=require`)
- [ ] Connection string is properly quoted in terminal
- [ ] Firewall/network allows connection
- [ ] Credentials are correct

## Getting Supabase Connection String

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Scroll to **Connection string**
4. Select **Connection pooling** (recommended) or **Direct connection**
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your actual database password


