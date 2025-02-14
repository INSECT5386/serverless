export default async function handler(req, res) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',  // 모든 출처에서의 요청 허용
    'Access-Control-Allow-Methods': 'POST, OPTIONS',  // 허용되는 HTTP 메소드
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',  // 허용되는 헤더
  };

  // OPTIONS 요청에 대한 처리 (CORS preflight 요청)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    return res.end();
  }

  if (req.method === 'POST') {
    try {
      const requestBody = req.body || {};
      const userInput = requestBody.inputs && requestBody.inputs.trim() !== "" ? requestBody.inputs : "입력값을 제공해주세요.";
      const MAX_INPUT_LENGTH = 1000; // 입력 길이 제한
      const trimmedInput = userInput.length > MAX_INPUT_LENGTH ? userInput.slice(0, MAX_INPUT_LENGTH) : userInput;
      const apiUrl = 'https://api-inference.huggingface.co/models/gpt2';
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request Timeout')), 60000));
      const apiToken = process.env.API_TOKEN;

      const fetchRequest = fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
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
      res.writeHead(200, headers);  // 응답 헤더 설정
      return res.status(200).json(responseBody);
    } catch (error) {
      res.writeHead(500, headers);  // 응답 헤더 설정
      return res.status(500).json({ error: '서버 내부 오류', details: error.message });
    }
  } else {
    res.writeHead(405, headers);  // 응답 헤더 설정
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }
}
