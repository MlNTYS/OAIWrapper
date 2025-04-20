# OAIWarpper

Monorepo 구조로 Backend(Node.js+Express+Prisma), Frontend(Next.js), DB(PostgreSQL), Reverse Proxy(Traefik) 설정.

## 설치
1. 루트 디렉토리에서 의존성 설치: npm install
2. Docker Compose로 서비스 시작: docker-compose up --build

## 서비스 접속
- Frontend: http://localhost
- Backend Health: http://localhost/api/health

## User API
```http
GET    /api/users          # 관리자만 가능
GET    /api/users/:id      # 관리자 또는 본인
POST   /api/users          # 관리자만 가능
PATCH  /api/users/:id      # 관리자 또는 본인
DELETE /api/users/:id      # 관리자만 가능
```
요청/응답 포맷:
- 요청 Body (POST/PATCH):
  ```json
  {
    "email": "user@example.com",     // valid email
    "password": "min6chars",         // min length 6
    "role_id": "USER" | "ADMIN",    // ADMIN only on PATCH
    "is_verified": true | false        // ADMIN only on PATCH
  }
  ```
- 응답 Body:
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "role_id": "USER",
    "is_verified": false,
    "current_credit": 0,
    "created_at": "2023-07-01T12:34:56.789Z"
  }
  ```