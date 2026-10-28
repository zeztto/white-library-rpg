# 유지관리

- UI는 한국어로 유지하고 실제 플레이·저장 경로를 보존합니다.
- 손상·미지원·읽기 거부 상태를 빈 슬롯으로 취급하거나 원문을 자동 덮어쓰지 않습니다.
- 전투 예약 동작에는 세션 전환 guard를 유지하고 승리 후 저장 순서를 검사합니다.
- 합성 data와 adapter는 tests에만 두고 production에 가져오지 않습니다.
- `npm ci --ignore-scripts`, `npm run check`, `npm audit --audit-level=low`를 실행합니다.
- 제품 동작·실행 조건이 바뀌면 README와 CHANGELOG를 함께 갱신합니다.
