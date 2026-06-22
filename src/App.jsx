import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './lib/firebase';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 relative">
      <div className="glass rounded-3xl p-10 max-w-md w-full text-center shadow-xl border border-white/50 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="relative">
          <div className="mb-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 inline-block rounded-full">주식 투자 게임을 통한</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-blue-700 mb-8 mt-2 tracking-tight">한국의 산업화 과정 알아보기</h1>
          
          <div className="flex flex-col gap-4">
            <Link to="/teacher" className="group relative flex justify-center items-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold py-4 px-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <span className="text-2xl">👨‍🏫</span>
              <span>선생님 대시보드 열기</span>
            </Link>
            <Link to="/student" className="group relative flex justify-center items-center gap-3 bg-white hover:bg-gray-50 text-indigo-700 font-bold py-4 px-6 rounded-2xl border-2 border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <span className="text-2xl">🧑‍🎓</span>
              <span>학생 참여 화면으로 가기</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    // 앱이 로드될 때 자동으로 익명 로그인을 수행합니다.
    signInAnonymously(auth)
      .then(() => {
        console.log('[Auth] Anonymous sign-in success');
      })
      .catch((error) => {
        console.error('[Auth] Anonymous sign-in failed:', error);
      });
  }, []);

  return (
    <HashRouter>
      {/* 글로벌 버전 표시 */}
      <div className="fixed bottom-4 right-4 z-50 bg-gray-900/80 backdrop-blur text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none border border-white/20 uppercase tracking-widest">
         App Version : v1.0.4
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teacher/*" element={<TeacherDashboard />} />
        <Route path="/student/*" element={<StudentDashboard />} />
        <Route path="/super-admin" element={<AdminDashboard />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
