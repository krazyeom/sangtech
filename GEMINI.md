# Development Rules & Workflows

## Mandatory Completion Workflow (작업 완료 후 필수 절차)

기능 개발, 버그 수정, UI 변경 등 모든 코드 작업이 완료되면 사용자 요청이 별도로 없더라도 **반드시 다음 순서대로 작업을 완수**해야 합니다:

1. **프로젝트 빌드 검증**
   - 명령: `npm run build`
   - 빌드 실패나 타입 에러가 발생하는지 확인하고 해결합니다.

2. **서버 재시작 (PM2)**
   - 명령: `pm2 reload deptgift` (또는 `pm2 restart deptgift`)
   - 운영 서버에 최신 변경 사항이 반영되도록 서비스를 리로드합니다.

3. **Git 커밋 및 원격 푸시**
   - 변경 사항을 스테이징하고 직관적인 커밋 메시지로 커밋합니다.
   - 명령: `git push origin main` (또는 해당 작업 브랜치)
   - 원격 저장소에 최종 푸시까지 정상 완료되었는지 확인합니다.
