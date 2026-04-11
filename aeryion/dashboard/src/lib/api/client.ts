const API_BASE = "/api/v1";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, signal } = options;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new ApiError(res.status, error.detail ?? res.statusText);
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const weatherApi = {
  getForecast: (lat: number, lng: number) =>
    request(`/forecast?lat=${lat}&lng=${lng}`),
  getRainfall: (stationId: string, params?: URLSearchParams) =>
    request(`/rainfall/${stationId}${params ? `?${params}` : ""}`),
};

export const ndviApi = {
  getCurrent: (regionId: string) => request(`/ndvi/${regionId}`),
  getTimeSeries: (regionId: string, params?: URLSearchParams) =>
    request(`/ndvi/${regionId}/timeseries${params ? `?${params}` : ""}`),
};

export const soilApi = {
  getMoisture: (lat: number, lng: number) =>
    request(`/soil/moisture?lat=${lat}&lng=${lng}`),
  getNutrients: (lat: number, lng: number) =>
    request(`/soil/nutrients?lat=${lat}&lng=${lng}`),
};

export const alertsApi = {
  list: () => request("/alerts"),
  acknowledge: (id: string) =>
    request(`/alerts/${id}/acknowledge`, { method: "POST" }),
};

export const stationsApi = {
  list: () => request("/stations"),
  get: (id: string) => request(`/stations/${id}`),
  getReadings: (id: string) => request(`/stations/${id}/readings`),
};

export const fireApi = {
  getActiveFires: (params?: URLSearchParams) =>
    request(`/fire/active${params ? `?${params}` : ""}`),
  getRiskZones: () => request("/fire/risk-zones"),
};

export const healthApi = {
  check: () => request("/health"),
};
