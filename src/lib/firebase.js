import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// ✅ .env 파일의 환경변수를 읽어옵니다.
// 다른 선생님이 이 프로젝트를 사용하려면 .env.example을 복사하여
// .env 파일을 만들고 본인의 Firebase 프로젝트 값을 입력하세요.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 앱 초기화 및 인스턴스 내보내기
export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
