export default async function handler(req, res) {
  // CORS 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method is allowed" });
  }

  try {
    const requestBody = req.body || {};
    const userInput =
      requestBody.inputs && requestBody.inputs.trim() !== ""
        ? requestBody.inputs
        : "입력값을 제공해주세요.";
    
    const MAX_INPUT_LENGTH = 1000;
    const trimmedInput = userInput.length > MAX_INPUT_LENGTH
      ? userInput.slice(0, MAX_INPUT_LENGTH)
      : userInput;

    const apiUrl = "https://api-inference.huggingface.co/models/gpt2";
    const apiToken = process.env.API_TOKEN;

    // Timeout 설정 (9초)
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request Timeout")), 9000)
    );

    // Hugging Face API 호출
    const fetchRequest = fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: trimmedInput,
        max_length: 150,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    const response = await Promise.race([fetchRequest, timeout]);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: "API 호출 실패", details: errorText });
    }

    const responseBody = await response.json();
    return res.status(200).json(responseBody);
  } catch (error) {
    return res.status(500).json({ error: "서버 내부 오류", details: error.message });
  }
}
