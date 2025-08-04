export async function createPaymentToken(baseUrl = "http://localhost:4000") {
  const response = await fetch(`${baseUrl}/payment-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      card_number: "4111111111111111",
      cvv: "123",
      expiration: "11/29",
    }),
  });

  const data = (await response.json()) as { payment_token: string };
  return data.payment_token;
}
