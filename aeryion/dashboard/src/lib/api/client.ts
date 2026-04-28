const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function request<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, { signal });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  health:        ()  => request<{ status: string }>("/health"),
  ndviLatest:    ()  => request<NdviReading[]>("/v1/ndvi/latest"),
  rainfallCurrent: () => request<RainfallReading[]>("/v1/rainfall/current"),
  alertsActive:  ()  => request<Alert[]>("/v1/alerts/active"),
  forecast7day:  (sub_county: string) =>
    request<ForecastDay[]>(`/v1/forecast/7day?sub_county=${sub_county}`),
};

export interface NdviReading {
  sub_county: string;
  observed_date: string;
  ndvi_mean: number;
  ndvi_min: number;
  ndvi_max: number;
  red_edge_mean: number;
  vegetation_status: string;
  data_source: string;
}

export interface RainfallReading {
  sub_county: string;
  observation_date: string;
  period_days: number;
  rainfall_mm: number;
  anomaly_pct: number;
  drought_flag: boolean;
  flood_flag: boolean;
}

export interface Alert {
  id: string;
  severity: string;
  category: string;
  title: string;
  district: string;
  sub_county: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface ForecastDay {
  date: string;
  rainfall_mm: number;
  confidence_pct: number;
}
