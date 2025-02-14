export default async function handler(req, res) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',  // CORS 처리
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // OPTIONS 요청은 204 상태 코드로 처리하여 CORS 프리플라이트 요청을 처리합니다.
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  // POST 요청 처리
  if (req.method === 'POST') {
    try {
      const requestBody = req.body || {};
      
      // 입력값을 가져옵니다. 만약 빈 값이거나 공백만 있다면 기본값 사용
      const userInput = requestBody.inputs && requestBody.inputs.trim() !== "" 
        ? requestBody.inputs 
        : "입력값을 제공해주세요.";

      // 너무 긴 입력은 잘라서 처리 (최대 1000자)
      const MAX_INPUT_LENGTH = 1000;
      const trimmedInput = userInput.length > MAX_INPUT_LENGTH ? userInput.slice(0, MAX_INPUT_LENGTH) : userInput;

      const apiUrl = 'https://api-inference.huggingface.co/models/gpt2';  // Hugging Face API 모델 URL

      // 타임아웃 설정 (60초)
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request Timeout')), 60000));

      const apiToken = process.env.API_TOKEN;  // 환경 변수로 API 토큰 관리

      // Hugging Face API 호출
      const fetchRequest = fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: trimmedInput,
          max_length: 150,  // 출력 길이 제한
          temperature: 0.7,  // 출력의 무작위성
          top_p: 0.9,  // nucleus sampling 비율
        }),
      });

      // API 호출이 완료될 때까지 기다림 (타임아웃 처리)
      const response = await Promise.race([fetchRequest, timeout]);

      // 응답이 실패한 경우 처리
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: "API 호출 실패", details: errorText });
      }

      // 성공적인 응답 처리
      const responseBody = await response.json();
      return res.status(200).json(responseBody);

    } catch (error) {
      return res.status(500).json({ error: '서버 내부 오류', details: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }
}
