FROM node:18-alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 의존성 설치
COPY package.json ./
RUN npm install

# 애플리케이션 코드 복사
COPY . .

# Prisma 클라이언트 생성은 엔트리포인트에서 실행

# 엔트리포인트 복사 및 실행 권한 추가
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# 포트 노출
EXPOSE ${BACKEND_PORT}

# 컨테이너 시작 시 엔트리포인트 스크립트 실행
ENTRYPOINT ["./docker-entrypoint.sh"] 