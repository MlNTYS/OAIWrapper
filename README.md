# OAIWrapper

## 한국어

### 프로젝트 개요

**OAIWrapper**는 OpenAI의 API를 래핑한 자체 호스팅 가능한 웹 기반 대화형 AI 서비스입니다. 사용자 계정 관리, 대화 기록 저장 및 크레딧 기반 사용량 제어가 지원됩니다.

### 설치 및 설정 방법

1. **저장소 복제**

```bash
git clone https://github.com/YourUsername/OAIWrapper.git
cd OAIWrapper
```

2. **환경 설정**

`.env.example` 파일을 복사하여 `.env` 파일 생성 후 설정:

* `OPENAI_API_KEY` (필수)
* JWT 비밀 키 설정 (`JWT_ACCESS_TOKEN_SECRET`, `JWT_REFRESH_TOKEN_SECRET`)

3. **의존성 설치**

Docker 및 Docker Compose가 설치되어 있어야 합니다.

```bash
npm install
```

4. **애플리케이션 실행**

```bash
docker-compose up --build
```

웹 UI는 `http://localhost`에서 접근 가능합니다.

**기본 관리자 계정:**

* 이메일: `admin@example.com`
* 비밀번호: `admin123`

(로그인 직후 기본 비밀번호를 변경하세요.)

### 사용 예시

* **사용자 채팅:** AI와 실시간 스트리밍 대화 가능.
* **관리자 대시보드:** 사용자 관리, 크레딧 관리 및 대화 로그 확인 (`http://localhost/admin`).

### 기술 스택

* **백엔드:** Node.js, Express, Prisma, PostgreSQL
* **프론트엔드:** Next.js, Mantine UI, React Query, Tailwind CSS
* **보안:** JWT 인증, Argon2 암호화, CSRF 보호
* **AI 연동:** OpenAI API, SSE(실시간 응답 스트리밍)
* **배포:** Docker Compose, Traefik 리버스 프록시

### API 예시

```http
GET /api/users             # 사용자 조회 (관리자 전용)
POST /api/users            # 사용자 생성 (관리자 전용)
PATCH /api/users/{id}      # 사용자 정보 수정
DELETE /api/users/{id}     # 사용자 삭제 (관리자 전용)
```

### 프로젝트 유지보수 상태 ⚠️

본 프로젝트는 **더 이상 유지보수되지 않습니다**. 마지막 업데이트(2025년 4월 20일) 이후 발견된 취약점이나 이슈는 수정되지 않으니, 사용에 주의하시기 바랍니다.

### 라이선스

**MIT 라이선스**로 배포됩니다. 상세 내용은 `LICENSE` 파일을 참고하세요.

---

## English

### Project Overview

**OAIWrapper** is a self-hosted, web-based conversational AI application that wraps the OpenAI API, providing a ChatGPT-like experience. It supports user account management, conversational history, and usage control through a credit-based system.

### Installation and Setup

1. **Clone Repository**

```bash
git clone https://github.com/YourUsername/OAIWrapper.git
cd OAIWrapper
```

2. **Environment Setup**

Copy `.env.example` to `.env` and set:

* `OPENAI_API_KEY` (required)
* JWT secrets (`JWT_ACCESS_TOKEN_SECRET`, `JWT_REFRESH_TOKEN_SECRET`)

3. **Install Dependencies**

Ensure Docker and Docker Compose are installed:

```bash
npm install
```

4. **Run Application**

```bash
docker-compose up --build
```

Access the web UI at `http://localhost`.

**Admin Account:**

* Email: `admin@example.com`
* Password: `admin123`

(Change the default password immediately after logging in.)

### Usage Examples

* **User Chat:** Start conversations, receive streaming AI responses.
* **Admin Dashboard:** Manage users, credits, and view conversation logs (`http://localhost/admin`).

### Tech Stack

* **Backend:** Node.js, Express, Prisma, PostgreSQL
* **Frontend:** Next.js, Mantine UI, React Query, Tailwind CSS
* **Security:** JWT, Argon2, CSRF protection
* **AI Integration:** OpenAI API, SSE (streaming responses)
* **Deployment:** Docker Compose, Traefik reverse proxy

### API Example

```http
GET /api/users             # (Admin only)
POST /api/users            # Create user (Admin only)
PATCH /api/users/{id}      # Update user
DELETE /api/users/{id}     # Delete user (Admin only)
```

### Project Status ⚠️

This repository is **no longer maintained**. Vulnerabilities and issues discovered after the final update (April 20, 2025) will not be fixed. Use at your own risk.

### License

Distributed under the **MIT License**. See `LICENSE` for details.
