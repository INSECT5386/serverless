export default async function handler(req, res) {
  // CORS 헤더 설정
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',  // 모든 출처에서의 요청 허용
    'Access-Control-Allow-Methods': 'POST, OPTIONS',  // 허용되는 HTTP 메소드
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',  // 허용되는 헤더
  };

  // OPTIONS 요청에 대한 처리 (CORS preflight 요청)
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  // POST 요청 처리
  if (req.method === 'POST') {
    try {
      const requestBody = req.body || {};
      const userInput = requestBody.inputs && requestBody.inputs.trim() !== "" ? requestBody.inputs : "입력값을 제공해주세요.";
      const MAX_INPUT_LENGTH = 1000; // 입력 길이 제한
      const trimmedInput = userInput.length > MAX_INPUT_LENGTH ? userInput.slice(0, MAX_INPUT_LENGTH) : userInput;
      const apiUrl = 'https://api-inference.huggingface.co/models/gpt2';  // Hugging Face API URL
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request Timeout')), 60000)); // 타임아웃 처리
      const apiToken = process.env.API_TOKEN;  // 환경 변수로 API 토큰 관리

      const fetchRequest = fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: trimmedInput,
          max_length: 150,  // 출력 길이 제한
          temperature: 0.7,  // 무작위성 정도
          top_p: 0.9,  // nucleus sampling 비율
        }),
      });

      const response = await Promise.race([fetchRequest, timeout]);

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: "API 호출 실패", details: errorText });
      }

      const responseBody = await response.json();
      return res.status(200).json(responseBody);  // API 응답 반환
    } catch (error) {
      return res.status(500).json({ error: '서버 내부 오류', details: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }
}
