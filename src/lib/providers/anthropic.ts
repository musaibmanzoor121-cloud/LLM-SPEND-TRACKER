// Anthropic's Usage API returns tokens, so we need approximate rates to calculate cost.
// Rates as of early 2024 (per 1M tokens, in USD)
const MODEL_RATES: Record<string, { input: number, output: number }> = {
  'claude-3-opus-20240229': { input: 15, output: 75 },
  'claude-3-sonnet-20240229': { input: 3, output: 15 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'claude-3-5-sonnet-20240620': { input: 3, output: 15 }
};

export async function fetchAnthropicUsage(apiKey: string, date: string) {
  // date is YYYY-MM-DD
  const url = `https://api.anthropic.com/v1/organizations/usage_report/messages?start_date=${date}&end_date=${date}`;
  
  const res = await fetch(url, {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Anthropic API Error: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  // Anthropic's response structure usually gives an array of usages.
  let totalCostUsd = 0;
  let totalInput = 0;
  let totalOutput = 0;
  
  if (data.data && Array.isArray(data.data)) {
    data.data.forEach((item: any) => {
      const input = item.input_tokens || 0;
      const output = item.output_tokens || 0;
      totalInput += input;
      totalOutput += output;
      
      const model = item.model || '';
      const rate = MODEL_RATES[model] || { input: 3, output: 15 }; // Default to Sonnet rates if unknown
      
      totalCostUsd += (input / 1000000) * rate.input + (output / 1000000) * rate.output;
    });
  }

  return {
    cost_usd: totalCostUsd,
    input_tokens: totalInput,
    output_tokens: totalOutput,
    raw_response: data
  };
}
