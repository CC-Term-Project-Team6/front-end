# Cloud Computing Term Project
피싱 문자 판별
Smishing Message Detection

사용자로부터 문자 메시지의 텍스트나 이미지를 입력받아 AI 파이프라인을 통한 피싱 메시지 판별 서비스

## Front-end
React(v19.2.6) + Vite(v8.0.12)

React 채용 이유:
컴포넌트 단위로 UI 설계 가능

Vite 채용 이유:
CRA(Create React APP)방식은 프로젝트 수정 사항이 반영되기까지 약간의 딜레이 존재했음. 
Vite는 브라우저가 직접 모듈을 요청(Native ESM)과 Rust 기반 엔진을 사용해 코드 저장 후 반영 시간이 짧음. -> 생산성 증가
React 공식 문서에서 Vite 사용 권장

## UI

### 기능
* 텍스트 입력 + 이미지 업로드 : 버튼으로 텍스트<->이미지 전환 가능
* 사이드 바 분석 이력 조회 : 이력 클릭 시 상세 정보 조회 가능
* 결과 표시 : 신뢰도 수치에 맞춘 바 형식의 결과 표시 + Back-end에서 받은 이유 나열

### 디자인
* favicon : https://www.flaticon.com

## 배포

Azure Static Web Apps 이용 예정