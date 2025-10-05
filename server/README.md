# Collaboration Server (구현 예정)

## 개요
실시간 협업을 위한 WebSocket 기반 서버입니다.

## 필요 패키지

```bash
npm install express socket.io yjs y-websocket ioredis cors
npm install -D @types/express @types/cors typescript ts-node
```

## 구조

```
server/
├── collaboration-server.ts    # 메인 서버
├── services/
│   ├── DocumentService.ts     # 문서 관리
│   ├── PresenceService.ts     # 사용자 presence 관리
│   └── ConflictResolver.ts    # 충돌 해결
├── config/
│   └── redis.ts               # Redis 설정
└── types/
    └── index.ts               # TypeScript 타입
```

## 실행 방법 (구현 후)

```bash
# 개발 모드
npm run server:dev

# 프로덕션
npm run server:start
```

## 주요 기능

1. **WebSocket 연결 관리**
   - Socket.io를 통한 실시간 통신
   - 연결/연결 해제 이벤트 처리

2. **문서 동기화**
   - Yjs CRDT를 통한 충돌 없는 병합
   - 의존성 기반 수식 재계산

3. **Presence 관리**
   - Redis를 통한 활성 사용자 추적
   - 실시간 커서 위치 공유

4. **데이터 영속성**
   - Redis를 통한 세션 데이터 저장
   - 24시간 자동 삭제

## 배포

Heroku, Railway, Render 등에 배포 가능합니다.

환경 변수:
- `PORT`: 서버 포트 (기본: 3002)
- `REDIS_URL`: Redis 연결 URL
- `CLIENT_URL`: CORS를 위한 클라이언트 URL
