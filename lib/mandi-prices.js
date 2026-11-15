
export async function getMandiPrices() {
  const apiKey = process.env.DATA_GOV_API_KEY;
  const resourceId = process.env.DATA_GOV_RESOURCE_ID;

  if (!apiKey || !resourceId) {
    return {
      success: false,
      total: null,
      records: [],
      error: "Missing government API configuration.",
    };
  }

  const url = new URL(
    `https://api.data.gov.in/resource/${encodeURIComponent(resourceId)}`
  );

  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "10");
  url.searchParams.set("filters[State]", "Punjab");
  url.searchParams.set("sort[Arrival_Date]", "desc");

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || data.status === "error") {
      console.error("Mandi API error:", {
        httpStatus: response.status,
        message: data.message,
      });

      return {
        success: false,
        total: null,
        records: [],
        error: "Government market prices are temporarily unavailable.",
      };
    }

    if (!Array.isArray(data.records)) {
      return {
        success: false,
        total: null,
        records: [],
        error: "The government API returned an unexpected response.",
      };
    }

    return {
      success: true,
      total: data.total ?? null,
      records: data.records,
      error: null,
    };
  } catch (error) {
    console.error("Mandi API connection error:", error.message);

    return {
      success: false,
      total: null,
      records: [],
      error: "Unable to connect to the government mandi data service.",
    };
  }
}
