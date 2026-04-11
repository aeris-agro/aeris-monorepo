import { NextResponse } from "next/server";

export async function GET() {
  const backendUrl =
    process.env.NEXT_PUBLIC_LINKTRADE_API_URL ?? "http://localhost:8002";

  let backendStatus = "unreachable";
  try {
    const res = await fetch(`${backendUrl}/api/v1/health`, {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = await res.json();
      backendStatus = data.status;
    }
  } catch {
    backendStatus = "unreachable";
  }

  return NextResponse.json({
    frontend: "healthy",
    backend: backendStatus,
    service: "linktrade-web",
    timestamp: new Date().toISOString(),
  });
}
