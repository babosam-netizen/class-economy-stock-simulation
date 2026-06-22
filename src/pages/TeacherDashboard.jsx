import React, { useState, useEffect } from 'react';
import { ref, update } from 'firebase/database';
import { database } from '../lib/firebase';
import useGameStore from '../store/gameStore';
import { stockData } from '../data/stocks';
import AnalysisTab from '../components/AnalysisTab';
import { QRCodeSVG } from 'qrcode.react';

const LoadingSpinner = ({ size = "w-12 h-12", color = "border-indigo-500" }) => (
  <div className={`${size} border-4 ${color} border-t-transparent rounded-full animate-[spin_3s_linear_infinite]`}></div>
);

const StudentScreenPreview = ({ isTradingOpen, isResultOpen, currentRound, currentRoundName }) => {
  return (
    <div className="bg-gray-900 rounded-[40px] p-4 sm:p-6 shadow-2xl border-[12px] border-gray-800 mx-auto w-full max-w-4xl relative transform transition-all duration-500">
      {/* 태블릿 상단 카메라/센서 */}
      <div className="absolute top-1/2 left-2 transform -translate-y-1/2 w-1 h-8 bg-gray-700 rounded-full"></div>

      <div className="bg-gray-100 rounded-[24px] overflow-hidden h-[300px] sm:h-[400px] flex flex-col relative shadow-inner border border-gray-300">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white text-[12px] font-black tracking-widest p-3 text-center uppercase shadow-md z-10 flex items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            <span>LIVE BROADCAST</span>
          </div>
          <div className="text-indigo-300 font-bold">MODE: {isResultOpen ? 'RESULT & REFLECTION' : 'PLANNING & TRADING'}</div>
        </div>

        <div className="flex-1 flex flex-row items-center justify-center p-8 gap-12 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">

          {/* 태블릿용 거대 라운드 표시 */}
          <div className="flex flex-col items-center justify-center bg-white/80 p-8 rounded-[40px] shadow-xl border-4 border-indigo-200 min-w-[240px]">
            <div className="text-sm font-black text-indigo-400 uppercase tracking-tighter mb-1">CURRENT ROUND</div>
            <div className="text-8xl font-black text-indigo-900 leading-none mb-2">{currentRound}</div>
            <div className="text-xl font-bold text-gray-500 uppercase">{currentRoundName}</div>
          </div>

          <div className="flex-1 max-w-sm">
            {/* 태블릿 모니터용 추가 정보 (이자율) */}
            <div className="mb-6 bg-white/50 backdrop-blur px-6 py-4 rounded-3xl border border-white shadow-sm">
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">CURRENT INTEREST RATE</div>
              <div className="text-3xl font-black text-indigo-900">{(stockData[currentRound]?.savingsRate * 100).toFixed(0)}%</div>
            </div>

            {!isResultOpen && (
              <div className="animate-fade-in w-full flex flex-col items-start text-left">
                <div className="mb-4">
                  <LoadingSpinner size="w-16 h-16" color="border-indigo-500" />
                </div>
                <div className="text-2xl font-black text-gray-800 mb-2">1단계: 전략 및 매매</div>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">
                  학생들이 신문을 읽고 투자 전략을 세우며 <br />
                  동시에 주식을 매매하고 있는 중입니다.
                </p>
              </div>
            )}
            {isResultOpen && (
              <div className="animate-fade-in w-full flex flex-col items-start text-left">
                <div className="text-6xl mb-4 drop-shadow-lg">🎉</div>
                <div className="text-2xl font-black text-purple-800 mb-2">2단계: 결과 성찰</div>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">
                  이번 시대의 최종 결과를 확인하고 <br />
                  자신의 선택을 되돌아보는 회고록을 씁니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const openQRWindow = (title, url) => {
  const width = 450;
  const height = 550;
  const left = (window.screen.width / 2) - (width / 2);
  const top = (window.screen.height / 2) - (height / 2);
  
  const newWin = window.open('', '_blank', `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`);
  if (newWin) {
    newWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;700;900&display=swap');
            body { 
              font-family: 'Pretendard', sans-serif; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
              background: #f1f5f9; 
            }
            .container { 
              background: white; 
              padding: 2.5rem; 
              border-radius: 3rem; 
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); 
              border: 8px solid #e0e7ff; 
              text-align: center;
              max-width: 90%;
            }
            h1 { 
              color: #312e81; 
              margin-bottom: 2rem; 
              font-size: 1.75rem; 
              font-weight: 900;
              letter-spacing: -0.025em;
            }
            #qr-container {
              background: white;
              padding: 1rem;
              border-radius: 1.5rem;
              display: inline-block;
              box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
              border: 2px solid #f8fafc;
            }
            .url { 
              color: #94a3b8; 
              font-size: 0.875rem; 
              margin-top: 2rem; 
              word-break: break-all; 
              max-width: 320px;
              font-weight: 500;
              padding: 0.75rem;
              background: #f8fafc;
              border-radius: 1rem;
            }
            canvas { max-width: 100%; height: auto; border-radius: 0.5rem; }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
        </head>
        <body>
          <div class="container">
            <h1>${title}</h1>
            <div id="qr-container">
              <canvas id="qr-canvas"></canvas>
            </div>
            <div class="url">${url}</div>
          </div>
          <script>
            setTimeout(() => {
              QRCode.toCanvas(document.getElementById('qr-canvas'), '${url}', {
                width: 300,
                margin: 2,
                color: {
                  dark: '#312e81',
                  light: '#ffffff'
                },
                errorCorrectionLevel: 'H'
              }, function (error) {
                if (error) {
                  console.error(error);
                  document.getElementById('qr-container').innerHTML = '<p style="color:red">QR 코드 생성 오류</p>';
                }
              });
            }, 100);
          </script>
        </body>
      </html>
    `);
    newWin.document.close();
  } else {
    alert('팝업 차단이 설정되어 있을 수 있습니다. 팝업을 허용해주세요.');
  }
};

export default function TeacherDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('teacherAuth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teacherPassword, setTeacherPassword] = useState(() =>
    localStorage.getItem('economyStock_teacherPassword') || ''
  );
  const [changePwInput, setChangePwInput] = useState('');
  const [changePwConfirm, setChangePwConfirm] = useState('');
  const [showChangePw, setShowChangePw] = useState(false);

  const handleLogin = () => {
    if (!teacherPassword) {
      // 최초 비밀번호 설정
      if (password.trim().length < 4) { alert('비밀번호는 4자 이상 입력해주세요.'); return; }
      if (password.trim() !== confirmPassword.trim()) { alert('비밀번호 확인이 일치하지 않습니다.'); return; }
      const newPw = password.trim();
      localStorage.setItem('economyStock_teacherPassword', newPw);
      setTeacherPassword(newPw);
      setIsAuthenticated(true);
      sessionStorage.setItem('teacherAuth', 'true');
      setPassword(''); setConfirmPassword('');
    } else {
      if (password.trim() === teacherPassword) {
        setIsAuthenticated(true);
        sessionStorage.setItem('teacherAuth', 'true');
      } else {
        alert('암호가 올바르지 않습니다.');
      }
    }
  };

  const handleChangePassword = () => {
    if (changePwInput.trim().length < 4) { alert('비밀번호는 4자 이상 입력해주세요.'); return; }
    if (changePwInput.trim() !== changePwConfirm.trim()) { alert('비밀번호 확인이 일치하지 않습니다.'); return; }
    const newPw = changePwInput.trim();
    localStorage.setItem('economyStock_teacherPassword', newPw);
    setTeacherPassword(newPw);
    setChangePwInput(''); setChangePwConfirm(''); setShowChangePw(false);
    alert('✅ 비밀번호가 변경되었습니다.');
  };
  
  const roomCode = useGameStore(state => state.roomCode);
  const initRoomInfo = useGameStore(state => state.initRoomInfo);
  const isTradingOpen = useGameStore(state => state.isTradingOpen);
  const isResultOpen = useGameStore(state => state.isResultOpen);
  const isGameEnded = useGameStore(state => state.isGameEnded);
  const students = useGameStore(state => state.students);
  const toggleTrading = useGameStore(state => state.toggleTrading);
  const toggleResult = useGameStore(state => state.toggleResult);
  const currentRound = useGameStore(state => state.currentRound);
  const advanceRound = useGameStore(state => state.advanceRound);
  const previousRound = useGameStore(state => state.previousRound);
  const leaveRoom = useGameStore(state => state.leaveRoom);
  const removeStudent = useGameStore(state => state.removeStudent);
  const roomClassName = useGameStore(state => state.roomClassName);
  const setRound = useGameStore(state => state.setRound);
  const activeRoomCode = useGameStore(state => state.activeRoomCode);
  const reflectionVersion = useGameStore(state => state.reflectionVersion);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [classNameInput, setClassNameInput] = useState('');
  const [existingCodeInput, setExistingCodeInput] = useState('');
  const [newspaperLink, setNewspaperLink] = useState(() =>
    localStorage.getItem('economyStock_newspaperLink') || ''
  );
  const [recentRooms, setRecentRooms] = useState(() => {
    try {
      const saved = localStorage.getItem('recentRooms');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const addRecentRoom = (code, name) => {
    const newRoom = { code, name, createdAt: Date.now() };
    setRecentRooms(prev => {
      const filtered = prev.filter(r => r.code !== code);
      const updated = [newRoom, ...filtered].slice(0, 10);
      localStorage.setItem('recentRooms', JSON.stringify(updated));
      return updated;
    });
  };

  const studentLink = `${window.location.origin}${window.location.pathname}#/student`;

  const exportFinalCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "학생 번호,이름,최종 소감 및 정리 메시지\n";

    Object.entries(students || {})
      .filter(([id, s]) => s !== null && s.hasSubmittedFinalReview)
      .sort((a, b) => (a[1].studentNumber || 0) - (b[1].studentNumber || 0))
      .forEach(([id, s]) => {
        const row = [
          `"${s.studentNumber}"`,
          `"${s.nickname}"`,
          `"${(s.finalReview || '').replace(/"/g, '""')}"`
        ];
        csvContent += row.join(",") + "\n";
      });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `최종_종합_소감_${roomClassName || '우리반'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (roomCode && activeRoomCode !== roomCode) {
      useGameStore.getState().attachListener(roomCode);
    }
  }, [roomCode, activeRoomCode]);

  if (!isAuthenticated) {
    const isSetup = !teacherPassword;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="glass p-10 rounded-3xl shadow-xl border border-gray-100 max-w-sm w-full text-center">
          <div className="text-5xl mb-6">{isSetup ? '🔑' : '🔐'}</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">
            {isSetup ? '비밀번호 초기 설정' : '선생님 확인'}
          </h2>
          <p className="text-gray-500 text-sm mb-8 font-medium">
            {isSetup
              ? '이 기기에서 처음 사용합니다. 교사용 비밀번호를 설정하세요.'
              : '관리자 암호를 입력하여 대시보드에 접속하세요.'}
          </p>
          <input
            type="password"
            placeholder={isSetup ? '새 비밀번호 (4자 이상)' : '암호 입력'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !isSetup) handleLogin(); }}
            className="w-full p-4 border border-gray-300 rounded-2xl mb-4 text-center font-bold tracking-widest focus:ring-2 focus:ring-indigo-500 bg-gray-50 shadow-inner"
          />
          {isSetup && (
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              className="w-full p-4 border border-gray-300 rounded-2xl mb-4 text-center font-bold tracking-widest focus:ring-2 focus:ring-indigo-500 bg-gray-50 shadow-inner"
            />
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-md hover:bg-indigo-700 transition-all hover:-translate-y-0.5"
          >
            {isSetup ? '✅ 비밀번호 설정하기' : '대시보드 접속하기'}
          </button>
        </div>
      </div>
    );
  }

  const handleCreateRoom = async () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomCode = '';
    for (let i = 0; i < 5; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const classNameStr = classNameInput.trim() || '우리반';

    initRoomInfo(randomCode);
    addRecentRoom(randomCode, classNameStr);
    
    await update(ref(database, `rooms/${randomCode}`), {
      className: classNameStr,
      createdAt: Date.now(),
      isTradingOpen: false,
      isResultOpen: false,
      isGameEnded: false,
      currentRound: 1,
      reflectionVersion: 2
    });
  };

  const handleJoinExistingRoom = () => {
    if (existingCodeInput.trim()) {
      const code = existingCodeInput.trim().toUpperCase();
      initRoomInfo(code);
      // 기존 방 이름은 일단 임의 지정, 들어갈 때 업데이트 됨
      addRecentRoom(code, '기존 접속 방'); 
    }
  };

  const finishedReasons = Object.values(students || {}).filter(s => s && s.hasSubmittedReason).length;
  const finishedTrades = Object.values(students || {}).filter(s => s && s.hasTraded).length;
  const finishedRetrospectives = Object.values(students || {}).filter(s => s && s.hasSubmittedRetrospective).length;
  const finishedFinalReviews = Object.values(students || {}).filter(s => s && s.hasSubmittedFinalReview).length;
  const totalStudents = Object.values(students || {}).filter(s => s !== null).length;

  const handleToggleTrading = () => {
    if (!isTradingOpen) {
      if (finishedReasons < totalStudents) {
        if (!window.confirm(`아직 1단계 전략 작성을 마치지 않은 학생이 ${totalStudents - finishedReasons}명 있습니다.\n그래도 강제로 2단계 거래창을 열어주시겠습니까?`)) return;
      }
    } else {
      if (finishedTrades < totalStudents) {
        if (!window.confirm(`아직 주식 매매를 완료하지 않은 학생이 ${totalStudents - finishedTrades}명 있습니다.\n그래도 매매를 강제 마감하시겠습니까?`)) return;
      }
    }
    toggleTrading(!isTradingOpen);
  };

  const handleToggleResult = () => {
    if (!isResultOpen) {
      if (finishedTrades < totalStudents) {
        if (!window.confirm(`아직 매매를 완료하지 않은 학생이 있습니다.\n강제로 결과를 공개하시겠습니까?`)) return;
      }
    }
    toggleResult(!isResultOpen);
  };

  const handleAdvanceRound = () => {
    if (finishedRetrospectives < totalStudents) {
      if (!window.confirm(`아직 3단계 성찰 회고록을 작성하지 않은 학생이 ${totalStudents - finishedRetrospectives}명 있습니다.\n작성하지 않은 학생은 빈칸으로 누적됩니다.\n그래도 다음 라운드로 진행(또는 종료)하시겠습니까?`)) return;
    }
    advanceRound();
  };

  if (!roomCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="glass p-8 rounded-3xl max-w-md w-full text-center shadow-2xl border border-gray-100">
          <h2 className="text-3xl font-black text-indigo-900 mb-8">👨‍🏫 교사용 대시보드</h2>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 flex flex-col items-center">
              <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center justify-center gap-2"><span>✨</span> 새로운 수업 방 만들기</h3>
              <div className="w-full space-y-3">
                <input
                  type="text"
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  placeholder="반 이름 (예: 6학년 9반)"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 shadow-inner text-center font-bold text-gray-700"
                />
                <button
                  onClick={handleCreateRoom}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                >
                  랜덤 참여 코드 자동 발급받기
                </button>
              </div>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-bold">또는</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200">
              <h3 className="text-md font-bold text-gray-700 mb-4">기존에 만든 방 이어하기</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={existingCodeInput}
                  onChange={(e) => setExistingCodeInput(e.target.value)}
                  placeholder="기존 5자리 참여코드 입력"
                  className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white shadow-inner font-mono text-center uppercase tracking-widest text-lg font-bold"
                />
                <button
                  onClick={handleJoinExistingRoom}
                  className="w-full bg-gray-800 text-white p-3 rounded-xl font-bold shadow-sm hover:bg-black transition-all"
                >
                  기존 코드로 대시보드 접속
                </button>
              </div>
            </div>

            {recentRooms.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-500 mb-4 flex items-center justify-center gap-2">
                  <span>🕒</span> 최근 접속한 수업 방 목록
                </h3>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {recentRooms.map((room) => (
                    <div 
                      key={room.code} 
                      onClick={() => {
                        initRoomInfo(room.code);
                        addRecentRoom(room.code, room.name);
                      }} 
                      className="bg-white p-3 rounded-xl border border-gray-200 hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
                    >
                      <div className="text-left leading-tight">
                        <div className="font-bold text-gray-800">{room.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{new Date(room.createdAt).toLocaleDateString()} 접속</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 px-3 py-1 rounded text-sm font-mono font-bold text-indigo-600 group-hover:bg-indigo-50">
                          {room.code}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('이 방을 목록에서 삭제할까요? (서버 데이터는 유지됨)')) {
                              setRecentRooms(prev => {
                                const newRooms = prev.filter(r => r.code !== room.code);
                                localStorage.setItem('recentRooms', JSON.stringify(newRooms));
                                return newRooms;
                              });
                            }
                          }}
                          className="text-gray-300 hover:text-red-500 px-1 transition-colors"
                          title="목록에서만 삭제"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 📰 수업용 신문 링크 설정 */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                <span>📰</span> 수업용 신문 링크 설정
                <span className="text-[10px] text-gray-400 font-normal ml-1">(선택 - 비워두면 QR버튼 비활성)</span>
              </h3>
              <div className="space-y-2">
                <input
                  type="url"
                  value={newspaperLink}
                  onChange={(e) => {
                    setNewspaperLink(e.target.value);
                    localStorage.setItem('economyStock_newspaperLink', e.target.value);
                  }}
                  placeholder="https://drive.google.com/file/d/... (구글 드라이브 신문 링크)"
                  className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-gray-50 font-mono text-gray-700"
                />
                {newspaperLink ? (
                  <p className="text-[10px] text-green-600 font-bold text-left">✅ 링크 설정 완료 — 입력 즉시 자동 저장됩니다</p>
                ) : (
                  <p className="text-[10px] text-orange-500 font-bold text-left">⚠️ 링크를 입력하면 대시보드의 신문다운 QR 버튼이 활성화됩니다</p>
                )}
              </div>
            </div>

            {/* 🔑 교사 비밀번호 변경 */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2"><span>🔑</span> 교사 비밀번호 변경</span>
                <button
                  onClick={() => { setShowChangePw(v => !v); setChangePwInput(''); setChangePwConfirm(''); }}
                  className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold underline"
                >
                  {showChangePw ? '취소' : '변경하기'}
                </button>
              </h3>
              {showChangePw && (
                <div className="space-y-2">
                  <input
                    type="password"
                    value={changePwInput}
                    onChange={(e) => setChangePwInput(e.target.value)}
                    placeholder="새 비밀번호 (4자 이상)"
                    className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-center font-bold tracking-widest"
                  />
                  <input
                    type="password"
                    value={changePwConfirm}
                    onChange={(e) => setChangePwConfirm(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleChangePassword(); }}
                    placeholder="비밀번호 확인"
                    className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-center font-bold tracking-widest"
                  />
                  <button
                    onClick={handleChangePassword}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all text-sm"
                  >
                    ✅ 비밀번호 변경 저장
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const studentList = Object.entries(students || {}).filter(([id, s]) => s !== null);
  // 변수 선언은 컴포넌트 상단으로 옮김 (totalStudents, finishedReasons 등)

  const currentRoundName = stockData[currentRound]?.roundName || '';

  const getScreenStatus = (student) => {
    if (isGameEnded) {
      return <span className="text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">🏁 시뮬레이션 종료</span>;
    }
    if (isResultOpen) {
      return student.hasSubmittedRetrospective ?
        <span className="text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-100">{currentRound}-2단계: 다음 시대 대기</span> :
        <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">{currentRound}-2단계: 성찰 작성 중</span>;
    } else {
      return student.hasTraded ?
        <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">{currentRound}-1단계: 결과 공개 대기</span> :
        <span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">{currentRound}-1단계: 전략 및 매매 중</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 pb-32 relative">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-final-area, .print-final-area * { visibility: visible; }
          .print-final-area { 
            position: absolute; left: 0; top: 0; width: 100%; 
            display: block !important;
          }
          .no-print { display: none !important; }
          .final-card { 
            break-inside: avoid; 
            margin-bottom: 20px !important;
            border: 2px solid #eee !important;
            box-shadow: none !important;
            height: auto !important;
            min-height: auto !important;
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 상단 탭 컨트롤 */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 relative z-20 gap-4">
          <div className="flex rounded-xl bg-gray-200 p-1 w-full max-w-sm shadow-inner border border-gray-300">
            <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-3 text-sm font-black rounded-lg transition ${activeTab === 'dashboard' ? 'bg-white shadow-md text-indigo-800' : 'text-gray-500 hover:text-gray-700'}`}>📊 모니터링 통제 보드</button>
            <button onClick={() => setActiveTab('analysis')} className={`flex-1 py-3 text-sm font-black rounded-lg transition ${activeTab === 'analysis' ? 'bg-white shadow-md text-indigo-800' : 'text-gray-500 hover:text-gray-700'}`}>📂 라운드 누적 분석</button>
          </div>

          <div className="flex gap-2">
            {isGameEnded && (
              <button
                onClick={previousRound}
                className="text-xs sm:text-sm bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-3 rounded-xl font-bold border-2 border-indigo-100 transition-all shadow-md flex items-center gap-2"
              >
                ⏪ 7라운드로 돌아가기 (실수용)
              </button>
            )}
            <button
              onClick={() => openQRWindow('학생 접속 QR', studentLink)}
              className="text-xs sm:text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-5 py-3 rounded-xl font-bold border border-indigo-200 transition-all shadow-sm"
            >
              📱 학생접속QR
            </button>
            {newspaperLink ? (
              <button
                onClick={() => openQRWindow('통합신문 다운로드 QR', newspaperLink)}
                className="text-xs sm:text-sm bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-5 py-3 rounded-xl font-bold border border-blue-200 transition-all shadow-sm"
              >
                📰 신문다운QR
              </button>
            ) : (
              <button
                onClick={() => {
                  const link = window.prompt('학생들에게 나눠줄 신문 파일 링크를 입력하세요\n(구글 드라이브 공유 링크 등)', '');
                  if (link && link.trim()) {
                    setNewspaperLink(link.trim());
                    localStorage.setItem('economyStock_newspaperLink', link.trim());
                  }
                }}
                title="신문 링크가 설정되지 않았습니다. 클릭하여 링크를 입력하세요."
                className="text-xs sm:text-sm bg-orange-50 text-orange-500 hover:bg-orange-100 px-5 py-3 rounded-xl font-bold border border-orange-200 transition-all shadow-sm"
              >
                📰 신문링크 미설정 (클릭)
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm("🔥 경고: 현재 방의 모든 학생 기록과 설정을 완전히 초기화(제거)합니다.\n정말 정보를 비우고 처음부터 다시 하시겠습니까? (되돌릴 수 없습니다!)")) {
                  useGameStore.getState().destroyRoom();
                }
              }}
              className="text-xs sm:text-sm bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-5 py-3 rounded-xl font-bold border border-red-200 transition-all shadow-sm"
            >
              🔥 방 전체 정보 초기화(제거)
            </button>
            <button
              onClick={leaveRoom}
              className="text-xs sm:text-sm bg-gray-50 text-gray-500 hover:bg-gray-500 hover:text-white px-5 py-3 rounded-xl font-bold border border-gray-200 transition-all shadow-sm"
              title="데이터는 서버에 남겨두고 내 화면만 닫습니다"
            >
              🚪 화면만 닫기 (유지)
            </button>
          </div>
        </div>

        {activeTab === 'analysis' ? (
          <AnalysisTab students={students} reflectionVersion={reflectionVersion} />
        ) : isGameEnded ? (
          <div className="space-y-10 animate-fade-in pb-20">
            <div className="text-center space-y-4 no-print">
              <h1 className="text-5xl font-black text-indigo-900 drop-shadow-sm">🏆 시뮬레이션 대장정 종료</h1>
              <p className="text-xl text-gray-600 font-bold">학생들이 보내온 대한민국 산업화 과정 최종 정리 메시지입니다. ({finishedFinalReviews} / {totalStudents})</p>
              
              <div className="flex justify-center gap-4 mt-6">
                <button 
                  onClick={exportFinalCSV}
                  className="bg-green-600 text-white font-black py-3 px-6 rounded-2xl shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  <span>📊</span> 최종 소감 CSV 저장
                </button>
                <button 
                  onClick={() => window.print()}
                  className="bg-indigo-600 text-white font-black py-3 px-6 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <span>🖨️</span> 최종 소감 PDF/인쇄
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4 print-final-area">
              {studentList.sort((a, b) => (a[1].studentNumber || 0) - (b[1].studentNumber || 0)).map(([id, student]) => {
                const colors = [
                  'bg-yellow-100 border-yellow-200',
                  'bg-blue-100 border-blue-200',
                  'bg-green-100 border-green-200',
                  'bg-pink-100 border-pink-200',
                  'bg-purple-100 border-purple-200',
                  'bg-orange-100 border-orange-200'
                ];
                const luckyColor = colors[(student.studentNumber || 0) % colors.length];
                const content = student.finalReview;

                return (
                  <div key={id} className={`p-6 shadow-xl border-t-8 transform transition hover:scale-105 hover:-rotate-1 relative group final-card ${luckyColor}`}>
                    <div className="absolute top-2 right-2 opacity-20 text-4xl group-hover:opacity-40 transition">📌</div>
                    <div className="flex items-center gap-2 mb-4 border-b border-black/5 pb-2">
                       <span className="font-black text-xl text-black/70">{student.studentNumber}번</span>
                       <span className="font-black text-xl text-black">{student.nickname}</span>
                    </div>
                    
                    <div className="min-h-[150px] relative group/text">
                      {student.hasSubmittedFinalReview ? (
                        <>
                          <p className="text-gray-800 font-bold text-sm leading-relaxed whitespace-pre-wrap">
                            {content}
                          </p>
                          <button 
                            onClick={() => {
                              if (window.confirm(`${student.nickname} 학생의 최종 정리를 반환(리셋) 처리하여 다시 작성하게 할까요? (다른 기록은 유지됨)`)) {
                                useGameStore.getState().resetStudentStage(id, 4);
                              }
                            }}
                            className="absolute top-0 right-0 bg-red-100 text-red-600 font-black text-xs px-2 py-1 rounded opacity-0 group-hover/text:opacity-100 transition-opacity whitespace-nowrap shadow-sm border border-red-200"
                          >
                            🔄 제출 반환
                          </button>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                          <LoadingSpinner size="w-8 h-8" color="border-gray-400" />
                          <p className="mt-2 font-black text-sm italic">최종 정리 작성 중...</p>
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-4 right-6 text-[10px] font-black text-black/30 uppercase tracking-widest italic">
                       Final Message
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="max-w-4xl mx-auto mt-20 p-8 glass rounded-3xl border-2 border-indigo-100 text-center">
               <h4 className="text-lg font-bold text-indigo-900 mb-2">실시간 모니터링이 종료되었습니다</h4>
               <p className="text-sm text-gray-500 mb-6 font-medium">상단의 '라운드 누적 분석' 탭에서 전체 학생들의 최종 자산과 랭킹을 확인하고 엑셀로 다운로드할 수 있습니다.</p>
               <button onClick={previousRound} className="bg-white text-gray-500 px-6 py-3 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition">
                 실수로 종료했나요? 7라운드로 돌아가기
               </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 상단 헤더 영역 (방 정보 + 실시간 학생 미러링) */}
            <div className="glass p-6 md:p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center shadow-md border border-indigo-100 gap-8 relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200 rounded-full blur-3xl opacity-30 -z-10"></div>

              <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left py-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">CONTROL CENTER</div>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-700 mb-8 drop-shadow-sm leading-tight">
                  {roomClassName ? `${roomClassName}` : '대한민국 경제 성장'} <br />
                  <span className="text-2xl lg:text-3xl text-indigo-400 font-bold opacity-80">수업현황 실시간 모니터링</span>
                </h1>

                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="bg-white inline-flex flex-col items-center px-10 py-5 rounded-[40px] border-4 border-yellow-400 shadow-2xl relative group transition-all hover:scale-105">
                    <div className="absolute -top-4 bg-yellow-400 text-yellow-950 text-xs font-black px-4 py-1.5 rounded-full shadow-md z-10">학생 접속 코드 (6자리)</div>
                    <span className="font-mono text-indigo-950 tracking-[0.3em] text-6xl font-black drop-shadow-sm mt-2">{roomCode}</span>
                    <div className="absolute -bottom-2 right-6 bg-white px-2 text-[10px] font-bold text-gray-400 border border-gray-100 rounded">READY</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {currentRound > 1 && (
                      <button
                        onClick={previousRound}
                        className="text-xs bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 px-4 py-3 rounded-2xl font-bold border-2 border-gray-100 hover:border-red-200 transition-all shadow-sm flex items-center gap-2"
                      >
                        <span className="text-lg">⏪</span> 시대를 이전으로 되돌리기
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const target = window.prompt("⚠️ 비상용: 현재 라운드를 강제로 수정합니다.\n원하는 라운드 번호(1~7)를 입력하세요.\n(모든 학생이 이 라운드 초기 상태로 변경됩니다)", currentRound);
                        if (target && !isNaN(target)) {
                          const r = parseInt(target);
                          if (r >= 1 && r <= 7) {
                             if (window.confirm(`정말 ${r}라운드로 강제 이동하시겠습니까?`)) setRound(r);
                          }
                        }
                      }}
                      className="text-[10px] bg-gray-50 text-gray-400 hover:text-orange-500 hover:bg-orange-50 px-4 py-2 rounded-xl transition border border-transparent hover:border-orange-100"
                    >
                      🛠️ 비상용 라운드 강제 수정
                    </button>
                  </div>
                </div>
              </div>

              {/* 실시간 모니터링 허브 (라운드 + 미러링 통합) */}
              <div className="shrink-0 w-full md:w-auto flex justify-center mt-8 md:mt-0">
                <StudentScreenPreview
                  isTradingOpen={isTradingOpen}
                  isResultOpen={isResultOpen}
                  currentRound={currentRound}
                  currentRoundName={currentRoundName}
                />
              </div>
            </div>

            {/* 단계별 워크플로 컨트롤 패널 */}
            <h3 className="text-xl font-extrabold text-gray-800 mt-10 mb-2 flex items-center gap-2"><span>🚀</span> 당면 과제 컨트롤러</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">참석자가 모두 제출/완료하면 다음 행동 버튼이 깜빡거립니다. (꿀렁꿀렁 알림!)</p>

             <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between relative">

              {/* Step 1 & 2 Combined */}
              <div className={`flex-[2] rounded-3xl p-6 transition-all duration-300 border-2 ${!isResultOpen ? 'bg-white border-green-400 shadow-xl scale-100 z-10' : 'bg-gray-50 border-gray-200 shadow-sm opacity-60 scale-95'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-lg flex items-center gap-2 text-green-800">
                    <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center">1</span>
                    전략 분석 및 실전 매매
                  </h4>
                  <span className="text-xs font-bold text-gray-400">{!isResultOpen ? '진행 중' : '마감'}</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-100 rounded-xl p-4 text-center border border-gray-200">
                    <div className="text-[10px] font-bold text-gray-500 mb-1 leading-tight">매매 확정 인원</div>
                    <div className="text-2xl font-black text-green-600">
                      {finishedTrades} <span className="text-sm text-gray-400 font-normal">/ {totalStudents}</span>
                    </div>
                  </div>
                </div>

                {!isResultOpen && (
                  <div className="flex flex-col gap-2 mt-6">
                    <button
                      onClick={handleToggleResult}
                      className={`w-full py-4 rounded-xl font-black text-lg transition-all ${totalStudents > 0 && finishedTrades >= totalStudents ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg animate-pulse ring-4 ring-blue-300' : 'bg-gray-800 text-white hover:bg-black shadow-md'}`}
                    >
                      📢 결과 및 성찰 페이지 공개하기
                    </button>
                    {isTradingOpen && (
                      <button onClick={handleToggleTrading} className="text-[10px] text-gray-400 hover:text-red-500 underline">
                        (참고: 매매 버튼은 이제 학생 화면에 자동 노출됩니다)
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="hidden lg:flex items-center justify-center text-4xl text-gray-300 px-2 flex-shrink-0">➔</div>

              {/* Step 3 (Now Step 2) */}
              <div className={`flex-1 rounded-3xl p-6 transition-all duration-300 border-2 ${isResultOpen ? 'bg-white border-purple-400 shadow-xl scale-100 z-10' : 'bg-gray-50 border-gray-200 shadow-sm opacity-60 scale-95'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-lg flex items-center gap-2 text-purple-800">
                    <span className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center">2</span>
                    결과 성찰
                  </h4>
                  <span className="text-xs font-bold text-gray-400">{isResultOpen ? '오픈 됨' : '대기'}</span>
                </div>
                <div className="bg-gray-100 rounded-xl p-4 text-center mb-6 border border-gray-200">
                  <div className="text-[10px] font-bold text-gray-500 mb-1 leading-tight">회고 작성 인원</div>
                  <div className="text-2xl font-black text-purple-600">
                    {finishedRetrospectives} <span className="text-sm text-gray-400 font-normal">/ {totalStudents}</span>
                  </div>
                </div>

                {isResultOpen && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleAdvanceRound}
                      className={`w-full py-4 rounded-xl font-black text-lg transition-all ${totalStudents > 0 && finishedRetrospectives >= totalStudents ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg animate-pulse ring-4 ring-purple-300' : 'bg-gray-800 text-white hover:bg-black shadow-md'}`}
                    >
                      {currentRound >= 7 ? '마무리 글 정리 보내기 🏆' : '다음 시대로 진행 ➡️'}
                    </button>
                    <button onClick={handleToggleResult} className="text-xs text-gray-400 hover:text-red-500 underline mt-2">
                      (실수용) 결과 다시 숨기기
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* 학생 전체 모니터링 카드 영역 ➔ 테이블 형태로 전면 개편 */}
            <div className="glass overflow-hidden rounded-3xl shadow-2xl border-4 border-indigo-100 bg-white mt-10">
              <div className="bg-gradient-to-r from-indigo-900 to-blue-900 p-6 border-b border-indigo-200 flex justify-between items-center text-white">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <span className="bg-white text-indigo-900 p-2 rounded-xl text-lg">📊</span>
                  실시간 학생별 세부 통계 현황판 (실시간 모니터)
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-indigo-100 animate-pulse bg-indigo-800/50 px-4 py-2 rounded-full border border-indigo-400/30 shadow-sm uppercase tracking-widest">Monitoring Link Active</span>
                </div>
              </div>

              {studentList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="text-6xl mb-4 grayscale opacity-30">📂</div>
                  <p className="text-gray-400 font-bold text-lg italic">접속 중인 학생이 없습니다.</p>
                </div>
              ) : (
                <div className="max-h-[700px] overflow-auto scrollbar-thin scrollbar-thumb-indigo-200">
                  <table className="w-full border-collapse text-left relative min-w-[1200px]">
                    <thead className="sticky top-0 z-30 bg-gray-900 text-white shadow-xl">
                      <tr>
                        <th className="p-5 font-black uppercase tracking-tighter text-sm border-r border-gray-800 sticky left-0 z-40 bg-gray-900">학생 번호/이름</th>
                        <th className="p-5 font-black uppercase tracking-tighter text-sm border-r border-gray-800">
                          <div className="text-[10px] text-indigo-400 mb-1">현재 {currentRound}R 진행 단계</div>
                          {isGameEnded ? '종료' : isResultOpen ? '2단계: 성찰' : '1단계: 전략/매매'}
                        </th>
                        <th className="p-5 font-black uppercase tracking-tighter text-sm border-r border-gray-800 text-center">1. 전략&매매</th>
                        <th className="p-5 font-black uppercase tracking-tighter text-sm border-r border-gray-800 text-center">2. 성찰</th>
                        <th className="p-5 font-black uppercase tracking-tighter text-sm border-r border-gray-800 text-right text-yellow-400">보유 현금</th>
                        <th className="p-5 font-black uppercase tracking-tighter text-sm border-r border-gray-800 text-right text-blue-400">저금(예금)</th>
                        <th className="p-5 font-black uppercase tracking-tighter text-sm border-r border-gray-800 text-right text-green-400">총 평가 자산</th>
                        <th className="p-5 font-black uppercase tracking-tighter text-sm text-center">강제 제어</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {studentList.sort((a, b) => ((a[1] && a[1].studentNumber) || 0) - ((b[1] && b[1].studentNumber) || 0)).map(([id, student]) => {
                        if (!student) return null;
                        // 자산 합계 계산 (데이터가 없을 때를 대비해 currentCompanies 사용)
                        let totalValue = (student.capital || 0) + (student.savings || 0);
                        if (student.portfolio) {
                          Object.entries(student.portfolio).forEach(([cId, q]) => {
                            const comp = stockData[currentRound]?.companies?.find(c => c.id === cId);
                            if (comp) totalValue += (q * (isResultOpen ? comp.current : comp.prev));
                          });
                        }

                        return (
                          <tr key={id} className={`hover:bg-indigo-50/50 transition-colors ${student.hasTraded ? 'bg-green-50/30' : ''}`}>
                            <td className="p-5 border-r border-gray-100 sticky left-0 z-20 bg-white group-hover:bg-indigo-50/50 shadow-md min-w-[180px]">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full shrink-0 ${student.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} title={student.isOnline ? 'Online' : 'Offline'}></div>
                                <div>
                                  <span className="font-black text-indigo-900 mr-2 text-lg">{student.studentNumber}번</span>
                                  <span className="font-bold text-gray-800 text-lg">{student.nickname}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-5 border-r border-gray-50">
                              <div className="font-black tracking-tighter text-xs">
                                {getScreenStatus(student)}
                              </div>
                            </td>
                            <td className="p-5 border-r border-gray-50 group/item text-center">
                              <div className="flex flex-col items-center justify-center gap-1">
                                {student.hasTraded
                                  ? <span className="text-green-600 font-black text-xs px-2 py-1 bg-green-50 rounded-full border border-green-200">완료 ✅</span>
                                  : <span className="text-gray-300 font-bold text-xs italic">대기중...</span>
                                }
                                {student.hasTraded && (
                                  <button onClick={() => { if (window.confirm('전략 및 매매를 모두 리셋할까요?')) { useGameStore.getState().resetStudentStage(id, 1); useGameStore.getState().resetStudentStage(id, 2); } }} className="opacity-0 group-hover/item:opacity-100 text-[9px] font-black bg-red-100 text-red-600 px-2 py-1 rounded transition">리셋</button>
                                )}
                              </div>
                            </td>
                            <td className="p-5 border-r border-gray-50 group/item text-center">
                              <div className="flex flex-col items-center justify-center gap-1">
                                {student.hasSubmittedRetrospective
                                  ? <span className="text-purple-600 font-black text-xs px-2 py-1 bg-purple-50 rounded-full border border-purple-200">완료 ✅</span>
                                  : <span className="text-gray-300 font-bold text-xs italic">대기중...</span>
                                }
                                {student.hasSubmittedRetrospective && (
                                  <button onClick={() => { if (window.confirm('성찰 회고록 제출을 취소하게 할까요?')) useGameStore.getState().resetStudentStage(id, 3); }} className="opacity-0 group-hover/item:opacity-100 text-[9px] font-black bg-red-100 text-red-600 px-2 py-1 rounded transition">리셋</button>
                                )}
                              </div>
                            </td>
                            <td className="p-5 border-r border-gray-50 text-right bg-yellow-50/20">
                              <span className="font-mono font-black text-gray-700 text-base">
                                {Math.floor(student.capital || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="p-5 border-r border-gray-50 text-right bg-blue-50/20">
                              <span className="font-mono font-black text-blue-700 text-base">
                                {Math.floor(student.savings || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="p-5 border-r border-gray-50 text-right bg-green-50/20">
                              <span className="font-mono font-black text-green-700 text-xl">
                                {Math.floor(totalValue).toLocaleString()}
                              </span>
                            </td>
                            <td className="p-5 text-center">
                              <button
                                onClick={() => { if (window.confirm(`정말 ${student.nickname} 학생을 강제 퇴장시킬까요?`)) removeStudent(id); }}
                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition"
                                title="학생 삭제"
                              >
                                ❌
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
