export async function sendEmail({ apiKey, from, to, subject, html, text }) {
  const recipients = to.split(",").map((entry) => entry.trim()).filter(Boolean);
  if (recipients.length === 0) throw new Error("EMAIL_TO enthält keinen Empfänger.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to: recipients, subject, html, text })
  });

  if (!response.ok) {
    throw new Error(`Resend API ${response.status}: ${(await response.text()).slice(0, 700)}`);
  }
  return response.json();
}
