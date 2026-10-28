# 외부 코드와 콘텐츠 고지

루트 MIT는 자체 application 코드와 이 source에 포함된 서사·직업·단어·적 data에 적용합니다. 외부 패키지와 복사한 UI 코드의 권리를 대체하지 않습니다.

- `src/app/components/ui/`는 shadcn/ui 기반 코드입니다. Copyright (c) 2023 shadcn의 [MIT 원문](THIRD_PARTY_LICENSES/shadcn-ui/LICENSE.md)을 보존합니다.
- React·Zustand·Radix UI·Motion·Lucide·Zod와 runtime 의존성의 실제 설치 version·license metadata·원문 파일은 [inventory](third-party-inventory.json)와 `THIRD_PARTY_LICENSES/`에 있습니다. 개발 의존성은 각 npm 배포물의 고지를 따릅니다.
- Tailwind CSS 4.3.3은 생성된 CSS에 사용합니다. Copyright (c) Tailwind Labs, Inc.의 [MIT 원문](public/THIRD_PARTY_LICENSES/tailwindcss-4.3.3/LICENSE)을 보존하며, 정적 build에도 `THIRD_PARTY_LICENSES/tailwindcss-4.3.3/LICENSE`로 포함합니다. 자체 application의 MIT와 별개입니다.
- `react-remove-scroll-bar` 2.3.8의 npm 배포물은 MIT를 선언하지만 license 파일이 빠져 있습니다. npm gitHead가 공개 upstream에서 확인되지 않아, 기록한 현재 upstream commit의 MIT 원문을 포함했습니다. 이 범위는 inventory에 명시했습니다.
- 기존 source의 서사와 일반적인 한국어 단어 목록을 유지했습니다. 외부 문학·기사 corpus를 수집하거나 추가하지 않았습니다.
- 원본 export의 일반 Unsplash 고지를 확인했으며, 이 사본에는 외부 사진·음원·raster 이미지가 없습니다. 사용하지 않는 이미지 fallback helper를 제외했습니다. 시스템 글꼴을 사용하고 font 파일이나 CDN 요청을 포함하지 않습니다.

이 사본에는 운영 설정이나 외부 host의 SDK를 포함하지 않습니다. 제외한 코드에 MIT를 새로 적용하지 않습니다.
