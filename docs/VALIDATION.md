# 검증 범위

2026-10-28, Node.js 22.23.4와 npm 11.19.0에서 `npm ci --ignore-scripts`, typecheck, warning 없는 ESLint, 37개 회귀, production build와 npm audit를 실행했습니다. audit의 취약점은 0개였습니다.

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
```

회귀는 세 직업·슬롯 roundtrip, 손상 JSON·잘못된 shape·미지원 version·unsafe key와 층당 사건 수가 다른 미지원 저장의 원문 보존, read-denied/set-success의 write/remove 0, 확인한 raw만 삭제하는 복구, 승리 후 저장 순서, 전투 callback의 슬롯·타이틀·새 전투·취소 전환을 검사합니다. 실제 React 화면을 mount해 새 여정·직업 선택·단어 수집·손상 슬롯의 삭제 취소/확인과 전투 중 타이틀 이동을 실행합니다. 소지품·내 상태 Dialog의 접근성 이름, Tab 순환·Escape 닫기와 원래 버튼으로 focus 복귀도 검사합니다. 실제 Progress component를 SSR로 렌더링해 value/max의 접근성 전달과 표시 범위, 알 수 없는 값의 indeterminate 상태를 확인합니다. 읽기 거부로 시작한 세션이 읽기 회복 뒤에도 auto/manual save로 기존 슬롯을 덮어쓰지 않는 쓰기 barrier와 명시적 valid load·재선택 후 정상 저장도 실제 Store에서 검사합니다.

DOM·Storage adapter와 합성 입력은 `tests/`에만 있습니다. production bundle은 테스트를 import하지 않습니다. 실제 browser의 localStorage 권한·focus·pointer·반응형 화면 검증은 별도 QA이며 원격 CI·호스팅 배포 성공을 이 로컬 결과로 주장하지 않습니다.

production build는 성공합니다. 현재 Zod 원문의 PURE 주석 위치에 대해 Rollup이 annotation을 제거하는 경고가 있습니다. 원본 dependency를 바꾸거나 경고를 숨기지 않았으며 회귀 결과를 함께 확인합니다. 실제 runtime data·3직업·층·보스 규칙은 유지합니다.
