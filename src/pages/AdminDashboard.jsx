import React, { useState, useEffect } from 'react';
import useGameStore from '../store/gameStore';

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('admin_auth') === 'true'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const allRooms = useGameStore(state => state.allRooms);
  const fetchAllRooms = useGameStore(state => state.fetchAllRooms);
  const deleteRoomPermanent = useGameStore(state => state.deleteRoomPermanent);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      setError(null);
      
      // fetchAllRooms는 내부적으로 onValue 리스너를 설정하므로 직접적으로 완료를 알기는 어렵지만,
      // store의 데이터를 감시하여 로딩 상태를 해제할 수 있습니다.
      fetchAllRooms();
    }
  }, [isAuthenticated, fetchAllRooms]);

  // 데이터가 들어오면 로딩 해제
  useEffect(() => {
    if (allRooms && Object.keys(allRooms).length >= 0) {
      setLoading(false);
    }
  }, [allRooms]);

  const handleLogin = () => {
    // 슈퍼 어드민용 특수 암호
    if (password === 'admin1234') { 
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      alert('관리자 암호가 올바르지 않습니다.');
    }
  };

  const handleDeleteRoom = (code, className) => {
    if (window.confirm(`[경고] '${className}' (${code}) 방의 모든 데이터(학생 기록 포함)를 영구적으로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      deleteRoomPermanent(code);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20 max-w-sm w-full text-center">
          <div className="text-5xl mb-6">🛠️</div>
          <h2 className="text-2xl font-black text-white mb-2">시스템 관리자</h2>
          <p className="text-slate-400 text-sm mb-8 font-medium">전체 방 관리를 위해 관리자 암호를 입력하세요.</p>
          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLogin();
            }}
            className="w-full p-4 border-0 rounded-2xl mb-4 text-center font-bold tracking-widest focus:ring-2 focus:ring-blue-500 bg-white/5 shadow-inner text-white placeholder:text-slate-600"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95"
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  // null 또는 비정상적인 방 데이터 필터링 및 정렬
  const roomList = Object.entries(allRooms || {})
    .filter(([_, room]) => room && typeof room === 'object')
    .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white py-10 px-6 shadow-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">🛠️ 시스템 관리자 대시보드</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
              전체 생성된 방 ({roomList.length}개)
              {loading && <span className="ml-4 animate-pulse">데이터 불러오는 중...</span>}
            </p>
          </div>
          <button 
            onClick={() => { sessionStorage.removeItem('admin_auth'); window.location.reload(); }}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 -mt-8">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest border-b border-gray-200">
                <th className="p-6">클래스 / 코드</th>
                <th className="p-6">생성 일시</th>
                <th className="p-6">현재 상태</th>
                <th className="p-6 text-center">학생 수</th>
                <th className="p-6 text-right">제어</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-400 font-bold">데이터를 안전하게 불러오고 있습니다...</p>
                    </div>
                  </td>
                </tr>
              ) : roomList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-gray-400 font-bold italic">생성된 방이 없거나 권한이 없습니다.</p>
                      <p className="text-xs text-gray-400">Firebase 보안 규칙이 'auth != null'로 설정되어 있는지 확인해주세요.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                roomList.map(([code, room]) => {
                  const date = room.createdAt ? new Date(room.createdAt).toLocaleString() : '정보 없음';
                  const studentCount = room.students ? Object.keys(room.students).length : 0;
                  
                  return (
                    <tr key={code} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-6">
                        <div className="font-black text-gray-900 text-lg">{room.className || '이름 없음'}</div>
                        <div className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase mt-1">
                          CODE: {code}
                        </div>
                      </td>
                      <td className="p-6 text-sm text-gray-500 font-medium">
                        {date}
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                           <span className={`w-2 h-2 rounded-full ${room.isGameEnded ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`}></span>
                           <span className="font-bold text-sm text-gray-700">
                             {room.isGameEnded ? '종료됨' : `${room.currentRound}라운드 진행 중`}
                           </span>
                        </div>
                      </td>
                      <td className="p-6 text-center font-black text-gray-400">
                        {studentCount}명
                      </td>
                      <td className="p-6 text-right">
                        <button
                          onClick={() => handleDeleteRoom(code, room.className)}
                          className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-black border border-red-100 transition-all shadow-sm flex items-center gap-2 float-right"
                        >
                          <span>🗑️</span> 영구 삭제
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
