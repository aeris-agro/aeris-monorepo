-- AERIS Database Monitoring System Migration
-- Schema: aeris_monitor
-- Dependencies: postgis, pg_cron, pg_stat_statements

-- 0. Extensions Setup
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 1. Schema Creation
CREATE SCHEMA IF NOT EXISTS aeris_monitor;

-- 2. Monitoring Tables
CREATE TABLE IF NOT EXISTS aeris_monitor.monitoring_configs (
    metric_name TEXT PRIMARY KEY,
    warning_threshold NUMERIC,
    critical_threshold NUMERIC,
    enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aeris_monitor.health_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC,
    severity TEXT CHECK (severity IN ('healthy', 'warning', 'critical')),
    details_json JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aeris_monitor.alert_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Views
CREATE OR REPLACE VIEW aeris_monitor.latest_snapshots AS
SELECT DISTINCT ON (metric_name) *
FROM aeris_monitor.health_snapshots
ORDER BY metric_name, created_at DESC;

-- 4. Initial Configs
INSERT INTO aeris_monitor.monitoring_configs (metric_name, warning_threshold, critical_threshold)
VALUES 
    ('db_connection_pct', 70, 90),
    ('slow_query_count', 5, 20),
    ('kafka_outbox_depth', 100, 500),
    ('aeryion_ndvi_lag_hours', 24, 48),
    ('aeryion_forecast_freshness_hours', 12, 24),
    ('aeryion_rainfall_lag_hours', 24, 48),
    ('coltiva_registration_velocity', 50, 100),
    ('coltiva_pest_clusters', 5, 15),
    ('linktrade_stuck_escrow', 10, 50),
    ('linktrade_payment_failure_rate', 0.05, 0.15),
    ('aeryion_lstm_inference_latency_ms', 500, 2000),
    ('coltiva_chatbot_error_rate', 0.05, 0.20)
ON CONFLICT (metric_name) DO NOTHING;

-- 5. Check Functions

-- 5.1 DB Size & Connections
CREATE OR REPLACE FUNCTION aeris_monitor.check_db_health() 
RETURNS void AS $$
DECLARE
    conn_pct NUMERIC;
    db_size_mb NUMERIC;
    sev TEXT := 'healthy';
BEGIN
    SELECT (count(*) * 100.0 / current_setting('max_connections')::int) INTO conn_pct FROM pg_stat_activity;
    SELECT pg_database_size(current_database()) / (1024*1024) INTO db_size_mb;
    
    IF conn_pct > (SELECT critical_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'db_connection_pct') THEN
        sev := 'critical';
    ELSIF conn_pct > (SELECT warning_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'db_connection_pct') THEN
        sev := 'warning';
    END IF;

    INSERT INTO aeris_monitor.health_snapshots (metric_name, metric_value, severity, details_json)
    VALUES ('db_connection_pct', conn_pct, sev, jsonb_build_object('db_size_mb', db_size_mb));
END;
$$ LANGUAGE plpgsql;

-- 5.2 Slow Queries
CREATE OR REPLACE FUNCTION aeris_monitor.check_slow_queries() 
RETURNS void AS $$
DECLARE
    slow_count INT;
    sev TEXT := 'healthy';
BEGIN
    SELECT count(*) INTO slow_count FROM pg_stat_statements WHERE mean_exec_time > 1000; -- > 1s
    
    IF slow_count > (SELECT critical_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'slow_query_count') THEN
        sev := 'critical';
    ELSIF slow_count > (SELECT warning_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'slow_query_count') THEN
        sev := 'warning';
    END IF;

    INSERT INTO aeris_monitor.health_snapshots (metric_name, metric_value, severity)
    VALUES ('slow_query_count', slow_count, sev);
END;
$$ LANGUAGE plpgsql;

-- 5.3 Kafka Outbox Depth
CREATE OR REPLACE FUNCTION aeris_monitor.check_kafka_outbox() 
RETURNS void AS $$
DECLARE
    depth INT := 0;
    sev TEXT := 'healthy';
BEGIN
    -- Check if table exists before querying
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'outbox_events') THEN
        SELECT count(*) INTO depth FROM public.outbox_events WHERE kafka_published = false;
    END IF;
    
    IF depth > (SELECT critical_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'kafka_outbox_depth') THEN
        sev := 'critical';
    ELSIF depth > (SELECT warning_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'kafka_outbox_depth') THEN
        sev := 'warning';
    END IF;

    INSERT INTO aeris_monitor.health_snapshots (metric_name, metric_value, severity)
    VALUES ('kafka_outbox_depth', depth, sev);
END;
$$ LANGUAGE plpgsql;

-- 5.4 Aeryion: NDVI Lag
CREATE OR REPLACE FUNCTION aeris_monitor.check_aeryion_ndvi_lag() 
RETURNS void AS $$
DECLARE
    lag_hours INT := 0;
    sev TEXT := 'healthy';
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'aeryion' AND table_name = 'ndvi_observations') THEN
        SELECT EXTRACT(EPOCH FROM (NOW() - MAX(observed_date)))/3600 INTO lag_hours FROM aeryion.ndvi_observations;
    END IF;
    
    IF lag_hours IS NULL OR lag_hours > (SELECT critical_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'aeryion_ndvi_lag_hours') THEN
        sev := 'critical';
    ELSIF lag_hours > (SELECT warning_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'aeryion_ndvi_lag_hours') THEN
        sev := 'warning';
    END IF;

    INSERT INTO aeris_monitor.health_snapshots (metric_name, metric_value, severity)
    VALUES ('aeryion_ndvi_lag_hours', COALESCE(lag_hours, 999), sev);
END;
$$ LANGUAGE plpgsql;

-- 5.5 Aeryion: Forecast Freshness
CREATE OR REPLACE FUNCTION aeris_monitor.check_aeryion_forecast_freshness() 
RETURNS void AS $$
DECLARE
    lag_hours INT := 0;
    sev TEXT := 'healthy';
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'aeryion' AND table_name = 'forecasts') THEN
        SELECT EXTRACT(EPOCH FROM (NOW() - MAX(forecast_date)))/3600 INTO lag_hours FROM aeryion.forecasts;
    END IF;
    
    IF lag_hours IS NULL OR lag_hours > (SELECT critical_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'aeryion_forecast_freshness_hours') THEN
        sev := 'critical';
    ELSIF lag_hours > (SELECT warning_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'aeryion_forecast_freshness_hours') THEN
        sev := 'warning';
    END IF;

    INSERT INTO aeris_monitor.health_snapshots (metric_name, metric_value, severity)
    VALUES ('aeryion_forecast_freshness_hours', COALESCE(lag_hours, 999), sev);
END;
$$ LANGUAGE plpgsql;

-- 5.6 Aeryion: Rainfall Lag
CREATE OR REPLACE FUNCTION aeris_monitor.check_aeryion_rainfall_lag() 
RETURNS void AS $$
DECLARE
    lag_hours INT := 0;
    sev TEXT := 'healthy';
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'aeryion' AND table_name = 'rainfall_observations') THEN
        SELECT EXTRACT(EPOCH FROM (NOW() - MAX(observation_date)))/3600 INTO lag_hours FROM aeryion.rainfall_observations;
    END IF;
    
    IF lag_hours IS NULL OR lag_hours > (SELECT critical_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'aeryion_rainfall_lag_hours') THEN
        sev := 'critical';
    ELSIF lag_hours > (SELECT warning_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'aeryion_rainfall_lag_hours') THEN
        sev := 'warning';
    END IF;

    INSERT INTO aeris_monitor.health_snapshots (metric_name, metric_value, severity)
    VALUES ('aeryion_rainfall_lag_hours', COALESCE(lag_hours, 999), sev);
END;
$$ LANGUAGE plpgsql;

-- 5.7 Coltiva: Registration Velocity
CREATE OR REPLACE FUNCTION aeris_monitor.check_coltiva_registration_velocity() 
RETURNS void AS $$
DECLARE
    reg_count INT := 0;
    sev TEXT := 'healthy';
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'coltiva' AND table_name = 'farmer_profiles') THEN
        SELECT count(*) INTO reg_count FROM coltiva.farmer_profiles WHERE created_at > NOW() - INTERVAL '1 hour';
    END IF;
    
    -- Alert if velocity is unusually HIGH (possible bot) or LOW (system down)
    -- Here we just monitor high velocity for simplicity
    IF reg_count > (SELECT critical_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'coltiva_registration_velocity') THEN
        sev := 'critical';
    ELSIF reg_count > (SELECT warning_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'coltiva_registration_velocity') THEN
        sev := 'warning';
    END IF;

    INSERT INTO aeris_monitor.health_snapshots (metric_name, metric_value, severity)
    VALUES ('coltiva_registration_velocity', reg_count, sev);
END;
$$ LANGUAGE plpgsql;

-- 5.8 Coltiva: Pest Clusters
CREATE OR REPLACE FUNCTION aeris_monitor.check_coltiva_pest_clusters() 
RETURNS void AS $$
DECLARE
    cluster_count INT := 0;
    sev TEXT := 'healthy';
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'coltiva' AND table_name = 'pest_outbreak_clusters') THEN
        SELECT count(*) INTO cluster_count FROM coltiva.pest_outbreak_clusters WHERE severity = 'critical';
    END IF;
    
    IF cluster_count > (SELECT critical_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'coltiva_pest_clusters') THEN
        sev := 'critical';
    ELSIF cluster_count > (SELECT warning_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'coltiva_pest_clusters') THEN
        sev := 'warning';
    END IF;

    INSERT INTO aeris_monitor.health_snapshots (metric_name, metric_value, severity)
    VALUES ('coltiva_pest_clusters', cluster_count, sev);
END;
$$ LANGUAGE plpgsql;

-- 5.9 LinkTrade: Stuck Escrow
CREATE OR REPLACE FUNCTION aeris_monitor.check_linktrade_stuck_escrow() 
RETURNS void AS $$
DECLARE
    stuck_count INT := 0;
    sev TEXT := 'healthy';
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'linktrade' AND table_name = 'escrow_transactions') THEN
        SELECT count(*) INTO stuck_count FROM linktrade.escrow_transactions WHERE status = 'initiated' AND created_at < NOW() - INTERVAL '24 hours';
    END IF;
    
    IF stuck_count > (SELECT critical_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'linktrade_stuck_escrow') THEN
        sev := 'critical';
    ELSIF stuck_count > (SELECT warning_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'linktrade_stuck_escrow') THEN
        sev := 'warning';
    END IF;

    INSERT INTO aeris_monitor.health_snapshots (metric_name, metric_value, severity)
    VALUES ('linktrade_stuck_escrow', stuck_count, sev);
END;
$$ LANGUAGE plpgsql;

-- 5.10 LinkTrade: Payment Failures
CREATE OR REPLACE FUNCTION aeris_monitor.check_linktrade_payment_failures() 
RETURNS void AS $$
DECLARE
    fail_rate NUMERIC := 0;
    total_count INT := 0;
    fail_count INT := 0;
    sev TEXT := 'healthy';
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'linktrade' AND table_name = 'payment_events') THEN
        SELECT count(*) INTO total_count FROM linktrade.payment_events WHERE created_at > NOW() - INTERVAL '1 hour';
        SELECT count(*) INTO fail_count FROM linktrade.payment_events WHERE created_at > NOW() - INTERVAL '1 hour' AND status = 'failed';
        
        IF total_count > 0 THEN
            fail_rate := fail_count::numeric / total_count;
        END IF;
    END IF;
    
    IF fail_rate > (SELECT critical_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'linktrade_payment_failure_rate') THEN
        sev := 'critical';
    ELSIF fail_rate > (SELECT warning_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'linktrade_payment_failure_rate') THEN
        sev := 'warning';
    END IF;

    INSERT INTO aeris_monitor.health_snapshots (metric_name, metric_value, severity)
    VALUES ('linktrade_payment_failure_rate', fail_rate, sev);
END;
$$ LANGUAGE plpgsql;

-- 5.11 Future: Aeryion LSTM Health
CREATE OR REPLACE FUNCTION aeris_monitor.check_aeryion_lstm_health() 
RETURNS void AS $$
DECLARE
    latency NUMERIC := 0;
    sev TEXT := 'healthy';
BEGIN
    -- This targets future LSTM inference log tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'aeryion' AND table_name = 'lstm_logs') THEN
        SELECT AVG(latency_ms) INTO latency FROM aeryion.lstm_logs WHERE created_at > NOW() - INTERVAL '1 hour';
    END IF;
    
    IF latency > (SELECT critical_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'aeryion_lstm_inference_latency_ms') THEN
        sev := 'critical';
    ELSIF latency > (SELECT warning_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'aeryion_lstm_inference_latency_ms') THEN
        sev := 'warning';
    END IF;

    INSERT INTO aeris_monitor.health_snapshots (metric_name, metric_value, severity)
    VALUES ('aeryion_lstm_inference_latency_ms', latency, sev);
END;
$$ LANGUAGE plpgsql;

-- 5.12 Future: Coltiva Chatbot Health
CREATE OR REPLACE FUNCTION aeris_monitor.check_coltiva_chatbot_health() 
RETURNS void AS $$
DECLARE
    err_rate NUMERIC := 0;
    sev TEXT := 'healthy';
BEGIN
    -- This targets future Chatbot interaction tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'coltiva' AND table_name = 'chatbot_interactions') THEN
        SELECT (count(CASE WHEN status = 'error' THEN 1 END)::numeric / count(*)) INTO err_rate 
        FROM coltiva.chatbot_interactions WHERE created_at > NOW() - INTERVAL '1 hour';
    END IF;
    
    IF err_rate > (SELECT critical_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'coltiva_chatbot_error_rate') THEN
        sev := 'critical';
    ELSIF err_rate > (SELECT warning_threshold FROM aeris_monitor.monitoring_configs WHERE metric_name = 'coltiva_chatbot_error_rate') THEN
        sev := 'warning';
    END IF;

    INSERT INTO aeris_monitor.health_snapshots (metric_name, metric_value, severity)
    VALUES ('coltiva_chatbot_error_rate', err_rate, sev);
END;
$$ LANGUAGE plpgsql;

-- 6. Master Runner
CREATE OR REPLACE FUNCTION aeris_monitor.run_all_checks() 
RETURNS void AS $$
BEGIN
    PERFORM aeris_monitor.check_db_health();
    PERFORM aeris_monitor.check_slow_queries();
    PERFORM aeris_monitor.check_kafka_outbox();
    PERFORM aeris_monitor.check_aeryion_ndvi_lag();
    PERFORM aeris_monitor.check_aeryion_forecast_freshness();
    PERFORM aeris_monitor.check_aeryion_rainfall_lag();
    PERFORM aeris_monitor.check_coltiva_registration_velocity();
    PERFORM aeris_monitor.check_coltiva_pest_clusters();
    PERFORM aeris_monitor.check_linktrade_stuck_escrow();
    PERFORM aeris_monitor.check_linktrade_payment_failures();
    PERFORM aeris_monitor.check_aeryion_lstm_health();
    PERFORM aeris_monitor.check_coltiva_chatbot_health();
EXCEPTION WHEN OTHERS THEN
    INSERT INTO aeris_monitor.alert_log (metric_name, severity, message)
    VALUES ('master_runner', 'critical', 'Global monitoring runner failed: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 7. Scheduling
SELECT cron.schedule('aeris-global-check', '*/5 * * * *', 'SELECT aeris_monitor.run_all_checks();');
