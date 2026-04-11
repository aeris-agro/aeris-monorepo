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

export const listingsApi = {
  list: (params?: URLSearchParams) =>
    request(`/listings${params ? `?${params}` : ""}`),
  get: (id: string) => request(`/listings/${id}`),
  create: (data: unknown) =>
    request("/listings", { method: "POST", body: data }),
  update: (id: string, data: unknown) =>
    request(`/listings/${id}`, { method: "PATCH", body: data }),
};

export const ordersApi = {
  list: () => request("/orders"),
  get: (id: string) => request(`/orders/${id}`),
  create: (data: unknown) =>
    request("/orders", { method: "POST", body: data }),
  cancel: (id: string) =>
    request(`/orders/${id}/cancel`, { method: "POST" }),
};

export const contractsApi = {
  list: () => request("/contracts"),
  get: (id: string) => request(`/contracts/${id}`),
  sign: (id: string) =>
    request(`/contracts/${id}/sign`, { method: "POST" }),
};

export const paymentsApi = {
  initiateMomo: (data: unknown) =>
    request("/payments/momo/initiate", { method: "POST", body: data }),
  initiateAirtel: (data: unknown) =>
    request("/payments/airtel/initiate", { method: "POST", body: data }),
  checkStatus: (txId: string) => request(`/payments/status/${txId}`),
};

export const pricesApi = {
  getCurrent: (commodity: string) => request(`/prices/${commodity}`),
  getHistory: (commodity: string, params?: URLSearchParams) =>
    request(`/prices/${commodity}/history${params ? `?${params}` : ""}`),
};

export const transportApi = {
  list: () => request("/transport"),
  requestQuote: (data: unknown) =>
    request("/transport/quotes", { method: "POST", body: data }),
};

export const healthApi = {
  check: () => request("/health"),
};
