import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List

import httpx
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi import FastAPI, BackgroundTasks

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
NTFY_TOPIC = os.getenv("NTFY_TOPIC", "aeris-alerts")
ALERT_COOLDOWN_MINS = int(os.getenv("ALERT_COOLDOWN_MINS", "30"))

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aeris-monitor")

# In-memory cooldown cache: {metric_name: last_alert_time}
alert_cooldowns: Dict[str, datetime] = {}

app = FastAPI(title="AERIS Monitoring Worker")

async def send_ntfy_alert(metric: str, severity: str, value: float, details: dict = None):
    """Sends a push notification to ntfy.sh."""
    url = f"https://ntfy.sh/{NTFY_TOPIC}"
    priority = 4 if severity == "critical" else 3
    tags = "rotating_light,warning" if severity == "critical" else "warning"
    
    title = f"AERIS Alert: {metric} ({severity.upper()})"
    message = f"Metric value: {value}. Details: {details or 'N/A'}"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                content=message,
                headers={
                    "Title": title,
                    "Priority": str(priority),
                    "Tags": tags
                }
            )
            response.raise_for_status()
            logger.info(f"Alert sent for {metric}: {severity}")
    except Exception as e:
        logger.error(f"Failed to send alert to ntfy.sh: {e}")

async def process_monitoring_snapshots():
    """Polls Supabase for latest health snapshots and triggers alerts."""
    logger.info("Polling health snapshots...")
    
    try:
        # Fetch latest snapshots with severity warning or critical
        response = supabase.table("latest_snapshots")\
            .select("*")\
            .filter("severity", "in", '("warning", "critical")')\
            .execute()
        
        snapshots = response.data
        
        for snapshot in snapshots:
            metric = snapshot["metric_name"]
            severity = snapshot["severity"]
            value = snapshot["metric_value"]
            details = snapshot["details_json"]
            
            # Check cooldown
            last_alert = alert_cooldowns.get(metric)
            if last_alert and datetime.now() - last_alert < timedelta(minutes=ALERT_COOLDOWN_MINS):
                logger.debug(f"Alert for {metric} is in cooldown.")
                continue
            
            # Send alert
            await send_ntfy_alert(metric, severity, value, details)
            
            # Update cooldown
            alert_cooldowns[metric] = datetime.now()
            
            # Log to alert_log table
            supabase.table("alert_log").insert({
                "metric_name": metric,
                "severity": severity,
                "message": f"Value: {value}. Details: {details}"
            }).execute()

    except Exception as e:
        logger.error(f"Error processing snapshots: {e}")

@app.on_event("startup")
async def startup_event():
    """Start the periodic monitoring task."""
    async def run_periodically():
        while True:
            await process_monitoring_snapshots()
            await asyncio.sleep(300) # 5 minutes
            
    asyncio.create_task(run_periodically())

@app.get("/health")
def health_check():
    return {"status": "running", "timestamp": datetime.now().isoformat()}

@app.post("/check-now")
async def trigger_check(background_tasks: BackgroundTasks):
    """Manually trigger a check."""
    background_tasks.add_task(process_monitoring_snapshots)
    return {"message": "Check triggered"}

@app.post("/test-alert")
async def test_alert():
    """Send a test alert to ntfy.sh."""
    await send_ntfy_alert("test_metric", "warning", 1.0, {"test": True})
    return {"message": "Test alert sent"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
