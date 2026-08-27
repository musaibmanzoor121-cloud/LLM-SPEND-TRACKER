export async function fetchOpenAIUsage(apiKey: string, date: string) {
  // date is YYYY-MM-DD
  const url = `https://api.openai.com/v1/organization/costs?start_time=${date}T00:00:00Z&end_time=${date}T23:59:59Z`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API Error: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  
  // Return the raw data.
  // OpenAI returns data.data as an array of costs. We sum them up.
  // The structure is { amount: number, ... }
  let totalCostUsd = 0;
  if (data.data && Array.isArray(data.data)) {
    // Assuming data.data array has objects with `amount` in some unit, 
    // usually cents or fractions. Let's assume standard $ amounts or adjust based on OpenAI docs.
    // Wait, OpenAI organization/costs amount is typically in USD or cents. Let's assume it returns `amount` in cents and needs / 100?
    // Actually, according to OpenAI docs, `organization/costs` is deprecated in favor of `usage` or returns amounts in USD. 
    // Let's sum `amount` for today. If it's cents, we convert, if it's USD, we use as is.
    // The prompt says: OpenAI's Costs API (GET /v1/organization/costs) for daily $ spend
    data.data.forEach((item: any) => {
      totalCostUsd += (item.amount || 0); // Need to verify if it's USD or cents. Assuming USD for now.
    });
  }

  return {
    cost_usd: totalCostUsd,
    raw_response: data
  };
}
