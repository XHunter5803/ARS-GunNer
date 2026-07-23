export async function GET() {
  const requestId = crypto.randomUUID();

  return Response.json(
    {
      data: {
        status: "ok",
        service: "ARS GunNer API",
        version: "0.7.0",
      },
      requestId,
    },
    {
      headers: {
        "cache-control": "no-store",
        "x-request-id": requestId,
      },
    },
  );
}
