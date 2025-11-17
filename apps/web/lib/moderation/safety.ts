const apiUrl = process.env.MODERATION_API_URL;
const apiKey = process.env.MODERATION_API_KEY;

type ModerationResponse = {
  safe: boolean;
  score?: number;
  labels?: string[];
};

export const ensureSfwContent = async (buffer: Buffer, mimeType: string) => {
  if (!apiUrl || !apiKey) {
    console.warn('MODERATION_API_URL oder MODERATION_API_KEY nicht gesetzt – Upload wird ohne SFW-Check erlaubt.');
    return;
  }

  const payload = {
    mimeType,
    data: buffer.toString('base64'),
    strictness: Number(process.env.MODERATION_STRICTNESS ?? 0.6)
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Moderation API error', text);
    throw new Error('Der Inhalt konnte nicht geprüft werden.');
  }

  const result = (await response.json()) as ModerationResponse;
  if (!result.safe) {
    throw new Error('Dieser Inhalt scheint nicht jugendfrei zu sein.');
  }
};

