# OAIWarpper

Monorepo 구조로 Backend(Node.js+Express+Prisma), Frontend(Next.js), DB(PostgreSQL), Reverse Proxy(Traefik) 설정.

## 설치
1. 루트 디렉토리에서 의존성 설치: npm install
2. Docker Compose로 서비스 시작: docker-compose up --build

## 서비스 접속
- Frontend: http://localhost
- Backend Health: http://localhost/api/health