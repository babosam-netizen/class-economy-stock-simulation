# 📈 대한민국 경제 성장 주식 시뮬레이션

초등학교 사회과 수업용 실시간 주식 투자 시뮬레이션입니다.  
1960년대부터 현대까지 대한민국의 경제 성장 과정을 체험합니다.

---

## 🚀 시작하기 (처음 설치하는 선생님)

### 1단계 - 코드 다운로드
```bash
git clone https://github.com/[저장소주소]/economy-stock.git
cd economy-stock
npm install
```

### 2단계 - Firebase 프로젝트 만들기

1. [Firebase 콘솔](https://console.firebase.google.com/)에 Google 계정으로 로그인
2. **새 프로젝트 추가** 클릭 → 프로젝트 이름 입력 (예: `my-economy-class`)
3. 프로젝트 생성 완료 후, **프로젝트 설정** → **일반** 탭 → 하단 **앱 추가 (웹)** 클릭
4. 앱 등록 → **Firebase SDK 구성** 섹션에서 값들을 복사해둠

5. 좌측 메뉴 **빌드 → Realtime Database** 클릭
6. **데이터베이스 만들기** → 지역 선택 (아시아: `asia-southeast1` 권장) → **테스트 모드로 시작**

### 3단계 - 환경변수 설정
```bash
# .env.example 파일을 복사하여 .env 파일 생성
cp .env.example .env
```

`.env` 파일을 열어 Firebase에서 복사한 값들을 입력:
```
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="my-project.firebaseapp.com"
VITE_FIREBASE_DATABASE_URL="https://my-project-default-rtdb.asia-southeast1.firebasedatabase.app/"
VITE_FIREBASE_PROJECT_ID="my-project"
VITE_FIREBASE_STORAGE_BUCKET="my-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abc123"
```

### 4단계 - 로컬 실행 테스트
```bash
npm run dev
```
브라우저에서 `http://localhost:5173` 접속하여 정상 동작 확인

### 5단계 - 배포 (Firebase Hosting 사용 시)
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 로그인
firebase login

# Firebase 프로젝트 연결
firebase use --add
# 목록에서 본인 프로젝트 선택

# 빌드 및 배포
npm run build
firebase deploy --only hosting
```

배포 완료 후 `https://[프로젝트ID].web.app` 주소로 접속 가능합니다.

---

## ⚙️ 수업 시작 전 설정 (교사)

### 교사 대시보드 접속
- 주소 끝에 `#/teacher` 입력 또는 교사 버튼 클릭
- **교사 암호 설정**: 최초 접속 시 교사용 암호를 직접 설정할 수 있습니다. 설정된 암호는 Firebase 실시간 데이터베이스(`/settings/teacherPassword`)에 저장되어 여러 교사(또는 여러 기기)가 동일한 암호로 안전하게 공유하여 사용합니다.
- **안내**: 한 번 설정된 암호는 무단 변경을 방지하기 위해 대시보드 내에서 임의로 변경할 수 없습니다. 만약 암호 초기화가 필요한 경우 Firebase 콘솔에서 `settings/teacherPassword` 노드를 직접 삭제해야 합니다.

### 신문 링크 설정
- 교사 대시보드 로그인 후 **방 만들기 화면** 하단 **"📰 수업용 신문 링크 설정"** 입력란에  
  학생들에게 나눠줄 신문 파일의 구글 드라이브 공유 링크를 입력합니다.
- 입력 즉시 자동 저장되며, 대시보드에서 **📰 신문다운QR** 버튼으로 학생들에게 배포할 수 있습니다.

---

## 📁 프로젝트 구조
```
src/
├── lib/firebase.js        # Firebase 연결 설정 (.env에서 읽음)
├── store/gameStore.js     # Zustand 전역 상태관리
├── data/stocks.js         # 시대별 주식 데이터 (수정 가능)
├── pages/
│   ├── TeacherDashboard.jsx  # 교사용 제어판
│   └── StudentDashboard.jsx  # 학생용 화면
└── components/
    └── AnalysisTab.jsx       # 누적 분석 탭
```

---

## 📊 주식 데이터 수정 방법

`src/data/stocks.js` 파일에서 시대별 기업과 주가를 수정할 수 있습니다.

---

## 🆓 무료 사용 가능 범위 (Firebase Spark 플랜)

| 서비스 | 무료 한도 |
|--------|----------|
| Hosting 저장 공간 | 10 GB |
| Hosting 월 트래픽 | 10 GB |
| Realtime Database | 1 GB |
| 동시 접속 | 100개 |

학급 단위(30명) 수업에는 충분합니다.
