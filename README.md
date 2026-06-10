# InquiryMate — 과제탐구 AI 길잡이

고등학생용 과제탐구 AI 웹앱. 구글 로그인 후 바로 사용 (API Key 입력 불필요).

## 구조
- `index.html` — 프론트엔드 (Firebase 구글 로그인)
- `api/claude.js` — Vercel 서버 함수 (Anthropic API Key는 환경변수에만 존재)

## 배포 (Vercel)
1. vercel.com → Add New Project → 이 GitHub 저장소 Import
2. Settings → Environment Variables → `ANTHROPIC_API_KEY` 추가 (sk-ant-...)
3. Deploy
4. Firebase 콘솔 → Authentication → Settings → 승인된 도메인에 `프로젝트명.vercel.app` 추가
