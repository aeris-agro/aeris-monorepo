# AERIS Database Monitoring System

This is a specialized monitoring and alerting system for the AERIS Agro platform, focused on database health and CAP-aware metrics.

## Components

1.  **Database Schema (`aeris_monitor`)**: SQL functions and `pg_cron` jobs that run every 5 minutes to capture health snapshots.
2.  **Monitoring Worker**: A FastAPI/Python service that polls snapshots and sends push notifications via **ntfy.sh**.
3.  **Monitoring Dashboard**: A standalone HTML dashboard for real-time visualization of metrics and alert logs.

## Setup Instructions

### 1. Database Migration
Run the SQL migration in your Supabase SQL Editor:
`supabase/migrations/02_monitoring_system.sql`

### 2. Environment Variables
Create a `.env` file in `services/monitor_worker` based on `.env.example`:
```env
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_KEY=your-service-role-key
NTFY_TOPIC=aeris-alerts
ALERT_COOLDOWN_MINS=30
```

### 3. Run the Worker
```bash
cd services/monitor_worker
pip install -r requirements.txt
python main.py
```

### 4. Open the Dashboard
Simply open `monitoring_dashboard.html` in your browser. Configure your Supabase credentials in the Settings modal.

## Monitored Metrics
- **DB Connection %**: Alerts if nearing max connections.
- **Slow Query Count**: Tracks queries taking > 1 second.
- **Kafka Outbox Depth**: Monitors unpublished event backlog.
- **Environmental Lag (Aeryion)**: Ingestion lag for NDVI and Rainfall.
- **Farmer Data Freshness (Coltiva)**: Registration velocity and pest cluster severity.
- **Marketplace Health (LinkTrade)**: Stuck escrow transactions and payment failure rates.
