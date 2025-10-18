# 🚀 SkyChat Quick Start Guide

## ✅ What's Already Done

- [x] OpenFlights dataset downloaded (3 files in `/data`)
  - `airports.dat` - 7,698 airports
  - `airlines.dat` - 6,162 airlines
  - `routes.dat` - 67,663 routes
- [x] Database setup script created
- [x] Import script ready
- [x] Frontend Phase 1 complete (AI visualization)

## 🎯 Next: Set Up MariaDB (5 minutes)

### Option 1: Automated Setup (Recommended)

```bash
# Run the automated setup script
cd /Users/salilsingla/Desktop/personal/sky-Chat-mariadb
./setup_database.sh
```

This will:
1. Install MariaDB (if needed)
2. Create database and tables
3. Create user with your password
4. Generate `.env` file
5. Install Python dependencies

### Option 2: Manual Setup

Follow the detailed guide: [MARIADB_SETUP.md](MARIADB_SETUP.md)

## 📊 Import Data (2 minutes)

```bash
# After database setup
python src/database/import_data.py
```

Expected output:
```
🚀 SkyChat Data Import Starting...
============================================================
📍 Importing airports...
✅ Imported 7,698 airports
✈️  Importing airlines...
✅ Imported 6,162 airlines
🌍 Importing routes...
✅ Imported 67,663 routes
============================================================
🎉 Import Complete!
```

## 🔍 Verify Installation

```bash
# Connect to database
mariadb -u skychat_user -p skychat

# Run test queries
SELECT COUNT(*) FROM airports;  -- Should be ~7,698
SELECT COUNT(*) FROM airlines;  -- Should be ~6,162
SELECT COUNT(*) FROM routes;    -- Should be ~67,663

# Test a real query
SELECT
    a1.name as origin,
    a2.name as destination,
    al.name as airline
FROM routes r
JOIN airports a1 ON r.source_airport_id = a1.airport_id
JOIN airports a2 ON r.dest_airport_id = a2.airport_id
LEFT JOIN airlines al ON r.airline_id = al.airline_id
WHERE a1.iata = 'JFK'
LIMIT 5;
```

## 🚀 Start the Application

### Backend
```bash
python app.py
# Server runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install  # First time only
npm run dev
# App runs on http://localhost:5173
```

## 📁 Project Structure

```
sky-Chat-mariadb/
├── data/                    # ✅ Dataset files (downloaded)
│   ├── airports.dat
│   ├── airlines.dat
│   └── routes.dat
├── src/
│   ├── database/
│   │   ├── import_data.py  # ✅ Import script (ready)
│   │   ├── connection.py   # Database connection
│   │   └── schema/         # SQL schemas
│   └── services/           # Business logic
├── frontend/               # ✅ React app (Phase 1 done)
│   ├── src/
│   │   ├── components/    # AI components
│   │   └── pages/         # Chat, Home, etc.
├── app.py                 # Flask backend
├── config.py              # Configuration
├── .env                   # 🔜 Created by setup script
└── setup_database.sh      # ✅ Automated setup
```

## 🐛 Troubleshooting

### MariaDB won't start
```bash
brew services restart mariadb
```

### Import script errors
```bash
# Check if data files exist
ls -lh data/

# Check database connection
mariadb -u skychat_user -p -e "SHOW DATABASES;"
```

### Can't connect from Python
```bash
# Install MariaDB connector
pip install mariadb

# Check .env file exists
cat .env
```

## 📊 Current Database Schema

### airports
- Primary: `airport_id`
- Key fields: `iata`, `name`, `city`, `country`, `latitude`, `longitude`
- Indexes: `iata`, `country`, `city`

### airlines
- Primary: `airline_id`
- Key fields: `iata`, `name`, `country`, `active`
- Indexes: `iata`, `country`, `active`

### routes
- Primary: `route_id` (auto-increment)
- Foreign keys: `source_airport_id`, `dest_airport_id`, `airline_id`
- Indexes: Multi-column index on route pairs

## 🎯 Next Steps (Backend Development)

After setup is complete:

1. **Test basic queries** - Verify data is loaded correctly
2. **Update API endpoints** - Connect Flask to MariaDB
3. **Add natural language processing** - Implement query parsing
4. **Integrate Vector Search** - Phase 2 enhancement
5. **Add RAG with local LLM** - Llama 3.2 / Mistral

## 💡 Pro Tips

- **Backup data**: `mysqldump -u skychat_user -p skychat > backup.sql`
- **Reset database**: Drop and recreate tables, re-import
- **Monitor queries**: Use `EXPLAIN` to optimize performance
- **Check logs**: `tail -f /usr/local/var/mysql/*.err`

## 📚 Documentation

- Full setup guide: [MARIADB_SETUP.md](MARIADB_SETUP.md)
- Dataset info: [OpenFlights GitHub](https://github.com/jpatokal/openflights)
- MariaDB docs: [mariadb.com/kb](https://mariadb.com/kb/en/)

---

**Ready to start?** Run `./setup_database.sh` and you'll be up and running in 5 minutes! 🚀
