// InquiryMate 서버 프록시 — API Key는 Vercel 환경변수(ANTHROPIC_API_KEY)에만 존재
import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_PROJECT_ID = 'inquirymate-65e89';
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 허용됩니다' });
  }

  // 1. Firebase 구글 로그인 토큰 검증 — 로그인한 사용자만 통과
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }
  try {
    await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
  } catch (e) {
    return res.status(401).json({ error: '로그인 인증에 실패했습니다. 다시 로그인해 주세요.' });
  }

  // 2. 요청 검증 — 모델·토큰 한도는 서버가 강제 (악용 방지)
  const { system, user, tokens } = req.body || {};
  if (!system || !user || typeof user !== 'string') {
    return res.status(400).json({ error: '잘못된 요청입니다' });
  }
  const maxTokens = Math.min(Number(tokens) || 900, 2000);

  // 3. Anthropic API 호출 (키는 서버에만 존재)
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
      model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    const d = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: d.error?.message || `AI 호출 오류 (${r.status})` });
    }
    return res.status(200).json({ text: d.content?.[0]?.text || '' });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}
