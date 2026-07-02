import React, { useState, useEffect } from 'react';
import useGameStore from '../store/gameStore';
import { database } from '../lib/firebase';
import { ref, update, get, child } from 'firebase/database';
import { stockData } from '../data/stocks';

const Sparkline = ({ data, color = "#ef4444", width = 80, height = 30 }) => {
  if (!data || data.length < 2) return (
    <svg width={width} height={height}>
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
    </svg>
  );
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 3;
  const usableHeight = height - padding * 2;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - padding - ((d - min) / range) * usableHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

const AssetChangeChart = ({ assetData }) => {
  const width = 600;
  const height = 280;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 40;

  const values = assetData.map(d => d.value);
  const maxVal = Math.max(...values, 300000) * 1.15; // 상단 여유
  const minVal = Math.min(...values, 0);

  const getX = (index) => {
    const usableWidth = width - paddingLeft - paddingRight;
    return paddingLeft + (index / (assetData.length - 1)) * usableWidth;
  };

  const getY = (val) => {
    const usableHeight = height - paddingTop - paddingBottom;
    const range = maxVal - minVal || 1;
    return height - paddingBottom - ((val - minVal) / range) * usableHeight;
  };

  const points = assetData.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

  // 그라데이션 영역을 위한 path 생성
  const areaPath = `
    M ${getX(0)} ${height - paddingBottom}
    ${assetData.map((d, i) => `L ${getX(i)} ${getY(d.value)}`).join(' ')}
    L ${getX(assetData.length - 1)} ${height - paddingBottom}
    Z
  `;

  return (
    <div className="bg-white p-6 rounded-[32px] shadow-xl border border-indigo-50/50 w-full overflow-hidden">
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      <h3 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-2 justify-center">
        <span>📈</span> 시대별 자산 변화 그래프
      </h3>
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[550px] h-auto overflow-visible">
          <defs>
            <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* 가이드 격자 라인 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const val = minVal + (maxVal - minVal) * ratio;
            const y = getY(val);
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#f1f5f9" strokeWidth="1.5" />
                <text x={paddingLeft - 10} y={y + 4} textAnchor="end" className="text-[10px] font-black fill-gray-400 font-mono">
                  {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${Math.floor(val / 10000).toLocaleString()}만`}
                </text>
              </g>
            );
          })}

          {/* 그라데이션 영역 채우기 */}
          <path d={areaPath} fill="url(#chart-grad)" />

          {/* 꺾은선 */}
          <polyline
            fill="none"
            stroke="#4f46e5"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            strokeDasharray="1200"
            strokeDashoffset="1200"
            className="animate-[dash_2s_ease-in-out_forwards]"
          />

          {/* 데이터 포인트 점 및 말풍선 */}
          {assetData.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.value);
            return (
              <g key={i} className="group/node cursor-pointer">
                {/* 호버 효과 원 */}
                <circle cx={cx} cy={cy} r="12" fill="#4f46e5" fillOpacity="0.15" className="scale-0 group-hover/node:scale-100 transition-transform origin-center duration-200" />
                {/* 메인 점 */}
                <circle cx={cx} cy={cy} r="6" fill="#4f46e5" stroke="white" strokeWidth="3" />
                {/* 텍스트 말풍선 */}
                <g className="transition-all duration-200">
                  {/* 말풍선 배경 */}
                  <rect
                    x={cx - 40}
                    y={cy - 30}
                    width="80"
                    height="18"
                    rx="9"
                    fill="#1e1b4b"
                    className="shadow-sm"
                  />
                  {/* 말풍선 꼬리 */}
                  <polygon points={`${cx-4},${cy-12} ${cx+4},${cy-12} ${cx},${cy-8}`} fill="#1e1b4b" />
                  <text x={cx} y={cy - 18} textAnchor="middle" className="text-[9px] font-black fill-white font-mono leading-none">
                    {Math.floor(d.value / 10000)}만 원
                  </text>
                </g>
                {/* x축 라벨 */}
                <text x={cx} y={height - 12} textAnchor="middle" className="text-[11px] font-black fill-indigo-900/60">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const getCompanyHistory = (companyId, currentRound, isResultOpen) => {
  const history = [];
  for (let r = 1; r <= currentRound; r++) {
    const comp = stockData[r]?.companies?.find(c => c.id === companyId);
    if (comp) {
      history.push(comp.prev);
      if (r === currentRound && isResultOpen) {
        history.push(comp.current);
      }
    }
  }
  return history;
};

const LoadingSpinner = ({ size = "w-12 h-12", color = "border-indigo-500" }) => (
  <div className={`${size} border-4 ${color} border-t-transparent rounded-full animate-[spin_3s_linear_infinite]`}></div>
);

export default function StudentDashboard() {
  const { roomCode, role, joinRoom, leaveRoom, isTradingOpen, isResultOpen, isGameEnded, currentRound, students, myStudentId, activeRoomCode, reflectionVersion } = useGameStore();

  const [inputCode, setInputCode] = useState('');
  const [studentNum, setStudentNum] = useState('');
  const [nickname, setNickname] = useState('');

  // [추가] 로딩 타임아웃 안전장치
  useEffect(() => {
    if (roomCode && activeRoomCode !== roomCode) {
      const timer = setTimeout(() => {
        if (useGameStore.getState().activeRoomCode !== roomCode) {
           console.log("Loading timeout - clearing session");
           leaveRoom();
        }
      }, 5000); // 5초 대기 후 강제 초기화
      return () => clearTimeout(timer);
    }
  }, [roomCode, activeRoomCode, leaveRoom]);

  const [newsSummary, setNewsSummary] = useState('');
  const [investReason, setInvestReason] = useState('');
  // v1 성찰 (회고)
  const [profitReview, setProfitReview] = useState('');
  const [lossReview, setLossReview] = useState('');
  const [goodBadReview, setGoodBadReview] = useState('');
  const [lessonReview, setLessonReview] = useState('');
  // v2 성찰 (공통 성찰)
  const [retroInfoReview, setRetroInfoReview] = useState('');
  const [retroFutureReview, setRetroFutureReview] = useState('');

  const [finalQ1, setFinalQ1] = useState('');
  const [finalQ2, setFinalQ2] = useState('');
  const [finalQ3, setFinalQ3] = useState('');

  const [orders, setOrders] = useState({});
  const [savingsAmount, setSavingsAmount] = useState(0); // 예금(저축) 금액 상태 추가

  const myData = students?.[myStudentId];

  useEffect(() => {
    if (roomCode) {
      useGameStore.getState().attachListener(roomCode);
      if (myStudentId) {
        useGameStore.getState().setupPresence(roomCode, myStudentId);
      }
    }
  }, [roomCode, myStudentId]);

  const lastLoadedKey = React.useRef('');

  useEffect(() => {
    setOrders({});
    setSavingsAmount(0);
    setNewsSummary('');
    setInvestReason('');
    setProfitReview('');
    setLossReview('');
    setGoodBadReview('');
    setLessonReview('');
    setRetroInfoReview('');
    setRetroFutureReview('');
    setFinalQ1('');
    setFinalQ2('');
    setFinalQ3('');
    
    // 라운드나 학생이 변경되면 로딩 상태 초기화
    lastLoadedKey.current = '';
  }, [currentRound, myStudentId, roomCode]);

  // 데이터 로딩 (새로운 라운드/학생 진입 시 1회만 로컬로 복구)
  useEffect(() => {
    if (!myData) return;
    
    // 현재 컨텍스트 키 생성
    const currentKey = `${roomCode}-${myStudentId}-${currentRound}`;
    
    // 이미 이 컨텍스트에서 로딩을 완료했다면 중단 (중복 로딩 및 타이핑 중 덮어쓰기 방지)
    if (lastLoadedKey.current === currentKey) return;

    console.log(`[v0.7.0] Initial Loading for ${currentKey}`);

    const curHistory = myData.history?.[currentRound] || {};
    
    // 1. 전략 (Stage 1)
    const targetNews = myData.newsSummary ?? curHistory.newsSummary ?? '';
    const targetInvest = myData.investReason ?? curHistory.investReason ?? '';
    if (targetNews !== undefined) setNewsSummary(targetNews);
    if (targetInvest !== undefined) setInvestReason(targetInvest);
    
    // 2. 성찰 (Stage 3)
    const raw = curHistory.retrospectiveRaw || myData.retrospectiveRaw;
    if (raw) {
      if (reflectionVersion === 2) {
        if (raw.info !== undefined) setRetroInfoReview(raw.info);
        if (raw.future !== undefined) setRetroFutureReview(raw.future);
      } else {
        if (raw.profit !== undefined) setProfitReview(raw.profit);
        if (raw.loss !== undefined) setLossReview(raw.loss);
        if (raw.goodBad !== undefined) setGoodBadReview(raw.goodBad);
        if (raw.lesson !== undefined) setLessonReview(raw.lesson);
      }
    }

    // 3. 최종 소감 (Final)
    const finalRaw = myData.finalReviewRaw;
    if (finalRaw) {
      if (finalRaw.q1 !== undefined) setFinalQ1(finalRaw.q1);
      if (finalRaw.q2 !== undefined) setFinalQ2(finalRaw.q2);
      if (finalRaw.q3 !== undefined) setFinalQ3(finalRaw.q3);
    }

    // 4. 매매/저축 복구 (Stage 2)
    if (isTradingOpen && !myData.hasTraded) {
      if (myData.draftOrders) setOrders(myData.draftOrders);
      if (myData.draftSavings !== undefined) setSavingsAmount(myData.draftSavings);
    }

    // 로딩 완료 기록
    lastLoadedKey.current = currentKey;
  }, [myData, currentRound, roomCode, myStudentId, isTradingOpen]);

  // 모든 필드 실시간 초안 저장 (디바운스 1000ms)
  useEffect(() => {
    if (!roomCode || !myStudentId) return;

    const timeout = setTimeout(() => {
      const updates = {};
      const studentPrefix = `rooms/${roomCode}/students/${myStudentId}`;

      // 1단계 초안 (실시간 전송)
      if (!myData?.hasSubmittedReason) {
        updates[`${studentPrefix}/investReason`] = investReason || '';
        // newsSummary는 investReason 데이터와 연계되도록 같이 업데이트함 (기존 데이터 구조 유지)
        updates[`${studentPrefix}/newsSummary`] = investReason || '';
      }

      // 2단계 초안 (실시간 전송 - 매매 복구 정상화를 위해 반드시 필요)
      if (isTradingOpen && !myData?.hasTraded) {
        updates[`${studentPrefix}/draftOrders`] = orders || {};
        updates[`${studentPrefix}/draftSavings`] = savingsAmount || 0;
      }

      // 3단계 초안
      if (isResultOpen && !myData?.hasSubmittedRetrospective) {
        let retroDraft = {};
        if (reflectionVersion === 2) {
          retroDraft = {
            info: retroInfoReview || '',
            future: retroFutureReview || '',
          };
        } else {
          retroDraft = {
            profit: profitReview || '',
            loss: lossReview || '',
            goodBad: goodBadReview || '',
            lesson: lessonReview || ''
          };
        }
        updates[`${studentPrefix}/retrospectiveRaw`] = retroDraft;
      }

      // 최종 소감 초안
      if (myData?.hasSubmittedFinalReview === false) {
        const finalDraft = {
          q1: finalQ1 || '',
          q2: finalQ2 || '',
          q3: finalQ3 || ''
        };
        updates[`${studentPrefix}/finalReviewRaw`] = finalDraft;
      }

      if (Object.keys(updates).length > 0) {
        update(ref(database), updates).catch(err => console.error("Draft Save Fail:", err));
      }
    }, 1000); // 디바운스를 1초로 약간 늘려 성능 확보

    return () => clearTimeout(timeout);
  }, [newsSummary, investReason, profitReview, lossReview, goodBadReview, lessonReview, finalQ1, finalQ2, finalQ3, orders, savingsAmount, roomCode, myStudentId, isTradingOpen, isResultOpen, myData?.hasSubmittedReason, myData?.hasTraded, myData?.hasSubmittedRetrospective, myData?.hasSubmittedFinalReview]);


  // 공통 저장 함수 (onBlur용)
  const saveDraft = (field, value) => {
    if (!roomCode || !myStudentId) return;
    const updates = {};
    updates[`rooms/${roomCode}/students/${myStudentId}/${field}`] = value;
    // history에도 현재 시점의 draft를 백업해두면 더 안전함
    if (field.startsWith('finalQ')) {
       updates[`rooms/${roomCode}/students/${myStudentId}/finalReviewRaw/${field.replace('final', '').toLowerCase()}`] = value;
    } else if (['retroInfoReview', 'retroFutureReview'].includes(field)) {
       const rawField = field.replace('retro', '').replace('Review', '').toLowerCase();
       updates[`rooms/${roomCode}/students/${myStudentId}/retrospectiveRaw/${rawField}`] = value;
    } else if (['profitReview', 'lossReview', 'goodBadReview', 'lessonReview'].includes(field)) {
       const rawField = field.replace('Review', '');
       updates[`rooms/${roomCode}/students/${myStudentId}/retrospectiveRaw/${rawField}`] = value;
    } else {
       updates[`rooms/${roomCode}/students/${myStudentId}/history/${currentRound}/${field}`] = value;
       // investReason이 저장될 때 newsSummary에도 같은 내용을 복사해둡니다.
       if (field === 'investReason') {
         updates[`rooms/${roomCode}/students/${myStudentId}/history/${currentRound}/newsSummary`] = value;
         updates[`rooms/${roomCode}/students/${myStudentId}/newsSummary`] = value;
       }
    }
    update(ref(database), updates);
  };

  // [핵심 수정] 새로고침 시 데이터 로딩 중에 퇴장 처리되는 버그 수정
  useEffect(() => {
    // 1. 아직 학생들이 로드되지 않은 경우(빈 객체)는 로딩 중으로 간주하여 체크를 건너뜀
    if (!students || Object.keys(students).length === 0) return;

    if (role === 'student' && roomCode && myStudentId) {
      // 2. 데이터는 로드되었는데 내 정보가 없는 경우에만 실제 퇴장 처리
      if (!students[myStudentId]) {
        console.log("Student not found in room - possible removal by teacher.");
        alert("원활한 수업진행을 위해 부득이하게 삭제되었습니다. 다시 시작해 주세요.");
        leaveRoom();
      }
    }
  }, [students, myStudentId, roomCode, role, leaveRoom]);

  const handleJoin = async () => {
    if (inputCode && studentNum && nickname) {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, `rooms/${inputCode}/students/student_${studentNum}`));

      const sId = `student_${studentNum}`;
      const studentRef = ref(database, `rooms/${inputCode}/students/${sId}`);
      
      if (snapshot.exists()) {
        const existing = snapshot.val();
        // 기존 데이터가 있으면 유지하고 온라인 상태와 닉네임만 업데이트
        const updates = { 
          isOnline: true,
          // 혹시 만약 이전 라운드 기록이 누락되었을 경우를 대비해 기본값 보장 (보통은 advanceRound에서 처리됨)
          capital: existing.capital ?? 300000,
          portfolio: existing.portfolio ?? {}
        };
        
        if (existing.nickname !== nickname) {
          const confirmOverwrite = window.confirm(`해당 ${studentNum}번 자리는 이미 '${existing.nickname}' 이름으로 접속 기록이 있습니다.\n본인이 맞다면 '확인'을 눌러 새로운 이름('${nickname}')으로 변경하고 접속할 수 있습니다.\n계속 진행하시겠습니까?`);
          if (!confirmOverwrite) return;
          updates.nickname = nickname;
        }
        await update(studentRef, updates);
      } else {
        // 완전 신규 접속이면 초기화
        await update(studentRef, {
          studentNumber: parseInt(studentNum),
          nickname: nickname,
          capital: 300000,
          savings: 0,
          hasSubmittedReason: false,
          hasTraded: false,
          hasSubmittedRetrospective: false,
          newsSummary: '',
          investReason: '',
          portfolio: {},
          isOnline: true,
          createdAt: Date.now()
        });
      }

      joinRoom(inputCode, { number: studentNum, nickname: nickname });
    }
  };

  // [UI 수정] 데이터 로딩 중일 때 로딩 화면 표시 (로직 강화)
  // 1. 방 코드는 있는데 아직 리스너가 해당 방을 잡지 못한 경우
  // 2. 혹은 리스너가 에러(방 없음)를 반환하지 않은 상태인 경우
  const isInitialLoading = roomCode && activeRoomCode !== roomCode && activeRoomCode !== 'error';

  if (!roomCode || role !== 'student' || !myData || activeRoomCode === 'error') {
    // 만약 방이 없어서 에러가 났다면 즉시 세션 초기화
    if (activeRoomCode === 'error' && roomCode) {
      setTimeout(() => leaveRoom(), 100);
    }
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-bg">
        <div className="glass p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border-2 border-purple-100">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4">
              <LoadingSpinner size="w-16 h-16" color="border-purple-600" />
            </div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-600 tracking-tight">
              {isInitialLoading ? "데이터 복구 중..." : "모의 주식 시뮬레이션"}
            </h2>
            <p className="text-gray-500 font-bold mt-2 text-sm bg-purple-50 inline-block px-3 py-1 rounded-full">
              {isInitialLoading ? "잠시만 기다려주세요." : "진짜 주식 시장의 흐름을 읽어라!"}
            </p>
          </div>

          {!isInitialLoading && (
            <div className="space-y-4">
              <div>
                <label className="block text-left text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">선생님이 칠판에 적어주신 <span className="text-purple-600 text-sm">영문/숫자 코드</span></label>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="예: AB3C5"
                  className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 bg-white shadow-inner font-mono text-center text-2xl font-black tracking-widest uppercase transition-all"
                />
              </div>
              <div className="flex gap-3">
                <div className="w-1/3">
                  <label className="block text-left text-sm font-semibold text-gray-700 mb-1">번호</label>
                  <input type="number" placeholder="15" value={studentNum} onChange={e => setStudentNum(e.target.value)} className="w-full p-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-inner text-center text-lg" />
                </div>
                <div className="w-2/3">
                  <label className="block text-left text-sm font-semibold text-gray-700 mb-1">이름</label>
                  <input type="text" placeholder="이름 입력" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full p-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-inner text-center text-lg" />
                </div>
              </div>
              <button onClick={handleJoin} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 justify-center items-center rounded-xl font-bold text-lg shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 mt-4">입장하기</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentRoundName = stockData[currentRound]?.roundName || "시대";
  const currentCompanies = stockData[currentRound]?.companies || [];
  const curHistory = myData.history?.[currentRound] || {};

  let totalOrderCost = 0;
  for (const [compId, qty] of Object.entries(orders)) {
    const comp = currentCompanies.find(c => c.id === compId);
    if (comp) {
      totalOrderCost += (qty * comp.prev);
    }
  }
  const remainingCapital = (myData.capital || 0) - totalOrderCost - (savingsAmount || 0);

  const handleOrderChange = (companyId, delta) => {
    const comp = currentCompanies.find(c => c.id === companyId);
    if (!comp) return;

    setOrders(prev => {
      const currentOrder = prev[companyId] || 0;
      const currentOwned = myData.portfolio?.[companyId] || 0;
      const newOrder = currentOrder + delta;

      if (newOrder < -currentOwned) return prev;
      
      // 미래의 총 주문 비용 계산
      let futureOrderCost = 0;
      const futureOrders = { ...prev, [companyId]: newOrder };
      for (const [id, qty] of Object.entries(futureOrders)) {
        const c = currentCompanies.find(x => x.id === id);
        if (c) futureOrderCost += (qty * c.prev);
      }

      const futureRemaining = (myData.capital || 0) - futureOrderCost - (savingsAmount || 0);
      
      if (delta > 0 && futureRemaining < 0) {
        alert(`⚠️ 잔액이 부족합니다!\n현재 매수 가능 금액으로 해당 주식을 더 살 수 없습니다.`);
        return prev;
      }

      return futureOrders;
    });
  };

  const handleDirectQtyChange = (companyId, targetQtyStr) => {
    const targetQty = parseInt(targetQtyStr) || 0;
    const comp = currentCompanies.find(c => c.id === companyId);
    if (!comp) return;

    const currentOwned = myData.portfolio?.[companyId] || 0;
    const newOrder = targetQty - currentOwned;

    // 1. 0개 미만 방지
    if (targetQty < 0) {
      alert("보유 수량은 0개 이상이어야 합니다.");
      return;
    }

    // 2. 보유 주식보다 많이 파는 것 방지 (newOrder가 -currentOwned보다 작을 수 없음)
    if (newOrder < -currentOwned) {
      alert("보유하고 있는 주식보다 더 많이 팔 수 없습니다.");
      return;
    }

    // 3. 미래 주문 비용 및 잔액 검증
    let futureOrderCost = 0;
    const futureOrders = { ...orders, [companyId]: newOrder };
    for (const [id, qty] of Object.entries(futureOrders)) {
      const c = currentCompanies.find(x => x.id === id);
      if (c) futureOrderCost += (qty * c.prev);
    }

    const futureRemaining = (myData.capital || 0) - futureOrderCost - (savingsAmount || 0);

    if (futureRemaining < 0) {
      alert(`⚠️ 잔액이 부족합니다!\n입력하신 수량(${targetQty}주)을 구매하기에 현금이 부족합니다.`);
      return;
    }

    setOrders(futureOrders);
  };

  const handleMaxOrder = (companyId) => {
    const comp = currentCompanies.find(c => c.id === companyId);
    if (!comp) return;

    // 현재 남은 잔액(remainingCapital)으로 추가 매수 가능한 수량 계산
    const additionalQty = Math.floor(remainingCapital / comp.prev);
    if (additionalQty <= 0) {
      alert("⚠️ 추가로 구매할 수 있는 잔액이 부족합니다.");
      return;
    }

    setOrders(prev => {
      const currentOrder = prev[companyId] || 0;
      return {
        ...prev,
        [companyId]: currentOrder + additionalQty
      };
    });
  };

  let resultTotalAssets = myData.capital || 0;
  let hasAssets = false;
  if (isResultOpen && myData.portfolio) {
    for (const [compId, qty] of Object.entries(myData.portfolio)) {
      if (qty > 0) {
        hasAssets = true;
        const comp = currentCompanies.find(c => c.id === compId);
        if (comp) {
          resultTotalAssets += (qty * comp.current);
        }
      }
    }
  }

  const handleSubmitReason = () => {
    console.log("Student Submitting Reason:", myStudentId);
    if (!newsSummary.trim() || !investReason.trim()) {
      alert("신문 힌트 정보와 투자 전략(이유)을 모두 작성해야 제출 가능합니다.");
      return;
    }
    const studentRef = ref(database, `rooms/${roomCode}/students/${myStudentId}`);
    // 덮어쓰기 외에 history 내부에 영구 누적 저장
    update(studentRef, {
      hasSubmittedReason: true,
      newsSummary: newsSummary,
      investReason: investReason,
      [`history/${currentRound}/newsSummary`]: newsSummary,
      [`history/${currentRound}/investReason`]: investReason
    });
  };

  const handleFinalizeCombinedStep1 = () => {
    if (!investReason.trim() || investReason.trim().length < 5) {
      alert("투자 전략을 5자 이상 성의있게 작성해주세요.");
      return;
    }
    if (remainingCapital < 0) {
      alert("잔액이 부족합니다. 매매 수량을 조절해주세요.");
      return;
    }

    const newPortfolio = { ...(myData.portfolio || {}) };
    for (const [compId, qty] of Object.entries(orders)) {
      newPortfolio[compId] = (newPortfolio[compId] || 0) + qty;
      if (newPortfolio[compId] <= 0) delete newPortfolio[compId];
    }
    
    const studentRef = ref(database, `rooms/${roomCode}/students/${myStudentId}`);
    update(studentRef, {
      hasSubmittedReason: true,
      hasTraded: true,
      investReason: investReason,
      // 기존 newsSummary 공간은 investReason과 통합되었으므로, 기존 필드와의 호환성을 위해 investReason을 같이 넣어줍니다.
      newsSummary: investReason, 
      capital: remainingCapital,
      portfolio: newPortfolio,
      savings: (savingsAmount || 0),
      [`history/${currentRound}/investReason`]: investReason,
      [`history/${currentRound}/newsSummary`]: investReason,
      [`history/${currentRound}/capital`]: remainingCapital,
      [`history/${currentRound}/portfolio`]: newPortfolio,
      [`history/${currentRound}/savings`]: (savingsAmount || 0)
    });
  };

  const handleSubmitTrade = () => {
    handleFinalizeCombinedStep1();
  };

  // 7단계 종합 게임 종료 화면 (최종 피날레)
  if (isGameEnded) {
    const getRoundTotalAsset = (rNum, hData) => {
      if (!hData) return 300000;
      if (hData.finalTotalAsset !== undefined) return hData.finalTotalAsset;
      const rate = stockData[rNum]?.savingsRate || 0;
      const interest = Math.floor((hData.savings || 0) * rate);
      let total = (hData.capital || 0) + (hData.savings || 0) + interest;
      if (hData.portfolio) {
        Object.entries(hData.portfolio).forEach(([cId, q]) => {
          const comp = stockData[rNum]?.companies?.find(c => c.id === cId);
          if (comp) total += (q * comp.current);
        });
      }
      return total;
    };

    const assetData = [
      { label: '시작', value: 300000 },
      ...[1, 2, 3, 4, 5, 6, 7].map(r => {
        const hData = myData.history?.[r];
        const val = getRoundTotalAsset(r, hData);
        const nameRaw = stockData[r]?.roundName || `${r}R`;
        const label = nameRaw.split(' ')[0];
        return { label, value: val };
      })
    ];

    const historyList = Object.entries(myData.history || {}).sort((a, b) => Number(a[0]) - Number(b[0]));
    
    // 황금기(최고 수익 라운드) 계산
    const roundProfits = historyList.map(([r, hData]) => {
      const roundNum = parseInt(r);
      const prevRoundNum = roundNum - 1;
      const prevData = myData.history?.[prevRoundNum];
      
      // 이번 라운드 종료 시점 총 자산 (매매후 현금 + 예금 + 이자 + 보유주식 평가액)
      const interest = Math.floor((hData.savings || 0) * (stockData[roundNum]?.savingsRate || 0));
      let currentTotal = (hData.capital || 0) + (hData.savings || 0) + interest;
      if (hData.portfolio) {
        Object.entries(hData.portfolio).forEach(([cId, q]) => {
          const comp = stockData[roundNum]?.companies?.find(c => c.id === cId);
          if (comp) currentTotal += (q * comp.current);
        });
      }
      
      // 이번 라운드 시작 시점 (지난 라운드 종료 시점) 총 자산
      let prevTotal = 300000; // 1라운드 시작 원금 (30만 원)
      if (prevData) {
        const prevInterest = Math.floor((prevData.savings || 0) * (stockData[prevRoundNum]?.savingsRate || 0));
        prevTotal = (prevData.capital || 0) + (prevData.savings || 0) + prevInterest;
        if (prevData.portfolio) {
           Object.entries(prevData.portfolio).forEach(([cId, q]) => {
             const comp = stockData[prevRoundNum]?.companies?.find(c => c.id === cId);
             if (comp) prevTotal += (q * comp.current);
           });
        }
      }
      
      return {
        roundNum,
        roundYear: stockData[roundNum]?.roundName,
        profit: currentTotal - prevTotal
      };
    });
    
    const sortedProfits = [...roundProfits].sort((a, b) => b.profit - a.profit);
    const top3 = sortedProfits.slice(0, 3);

    return (
      <div className="min-h-screen bg-gray-50 p-4 xl:p-8 pb-32 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
          <button onClick={leaveRoom} className="text-xs bg-white text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full font-bold border border-red-100 transition-all shadow-sm">
            🚪 내 기기에서 방 나가기
          </button>
        </div>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="glass p-10 rounded-[40px] text-center shadow-2xl border-b-8 border-indigo-200 relative overflow-hidden bg-gradient-to-br from-white to-indigo-50/30">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"></div>
            <h1 className="text-4xl font-black text-indigo-900 mb-2">🎓 시뮬레이션 종료: 경제 대장정 완주!</h1>
            <p className="text-gray-500 font-bold mb-10">1960년대부터 현대까지, 대한민국 산업의 눈부신 발전 역사를 함께 체험했습니다.</p>
            
            <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 max-w-4xl mx-auto">
               {/* 시상대(Podium) 레이아웃 영역 */}
               <div className="flex-1 bg-white p-6 rounded-3xl shadow-lg border border-indigo-50 flex flex-col relative overflow-hidden">
                  <p className="text-[14px] font-black text-indigo-800 uppercase tracking-tight mb-6 text-center">나의 수익 TOP 3</p>
                  
                  <div className="flex items-end justify-center gap-2 flex-1 min-h-[180px] mb-2 px-2">
                     {/* 2등 */}
                     {top3[1] && (() => {
                       const maxP = top3[0]?.profit || 1;
                       const h = Math.max(40, (Math.max(0, top3[1].profit) / Math.max(1, maxP)) * 140);
                       return (
                         <div className="flex-1 flex flex-col items-center">
                            <div 
                              style={{ height: `${h}px` }}
                              className="w-full bg-gray-100 rounded-t-xl border-t border-x border-gray-200 flex flex-col items-center justify-end pb-4 relative group transition-all duration-1000 delay-300"
                            >
                               <span className="text-2xl mb-1">🥈</span>
                               <div className="absolute -top-1 opacity-0 group-hover:opacity-100 transition text-[9px] font-black text-gray-400 bg-white px-2 py-0.5 rounded-full border shadow-sm">2nd</div>
                            </div>
                            <div className="text-center mt-2">
                               <div className="text-[10px] font-black text-gray-400 truncate w-20">{top3[1].roundYear}</div>
                               <div className="text-xs font-black text-gray-600">{top3[1].profit > 0 ? '+' : ''}{Math.floor(top3[1].profit/10000)}만</div>
                          </div>
                       </div>
                     );
                     })()}

                     {/* 1등 */}
                     {top3[0] && (
                       <div className="flex-1 flex flex-col items-center">
                          <div 
                            style={{ height: '150px' }}
                            className="w-full bg-gradient-to-b from-yellow-50 to-yellow-100 rounded-t-2xl border-t-4 border-x border-yellow-400 flex flex-col items-center justify-end pb-6 relative group shadow-lg transition-all duration-1000"
                          >
                             <span className="text-4xl mb-1 animate-bounce">🥇</span>
                             <div className="absolute -top-2 opacity-100 text-[10px] font-black text-yellow-700 bg-white px-3 py-0.5 rounded-full border-2 border-yellow-400 shadow-md">BEST</div>
                          </div>
                          <div className="text-center mt-2">
                             <div className="text-xs font-black text-indigo-900 truncate w-24">{top3[0].roundYear}</div>
                             <div className="text-sm font-black text-green-600 bg-green-50 px-2 rounded-full border border-green-100">{top3[0].profit > 0 ? '+' : ''}{Math.floor(top3[0].profit/10000)}만</div>
                          </div>
                       </div>
                     )}

                     {/* 3등 */}
                     {top3[2] && (() => {
                       const maxP = top3[0]?.profit || 1;
                       const h = Math.max(40, (Math.max(0, top3[2].profit) / Math.max(1, maxP)) * 140);
                       return (
                         <div className="flex-1 flex flex-col items-center">
                            <div 
                              style={{ height: `${h}px` }}
                              className="w-full bg-orange-50/50 rounded-t-xl border-t border-x border-orange-200 flex flex-col items-center justify-end pb-3 relative group transition-all duration-1000 delay-500"
                            >
                               <span className="text-xl mb-1">🥉</span>
                               <div className="absolute -top-1 opacity-0 group-hover:opacity-100 transition text-[9px] font-black text-orange-400 bg-white px-2 py-0.5 rounded-full border shadow-sm">3rd</div>
                            </div>
                            <div className="text-center mt-2">
                               <div className="text-[10px] font-black text-gray-400 truncate w-20">{top3[2].roundYear}</div>
                               <div className="text-xs font-black text-gray-500">{top3[2].profit > 0 ? '+' : ''}{Math.floor(top3[2].profit/10000)}만</div>
                            </div>
                         </div>
                       );
                     })()}
                  </div>
               </div>

               <div className="flex-1 bg-indigo-900 p-8 rounded-3xl shadow-2xl text-white flex flex-col items-center justify-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full group-hover:scale-150 transition-transform"></div>
                  <p className="text-[14px] font-black text-indigo-200 uppercase tracking-tight mb-2">최종 성장 자산</p>
                  <p className="text-5xl font-black tracking-tighter mb-1">
                    {Math.floor(myData.capital || 0).toLocaleString()} <span className="text-xl font-bold opacity-50">원</span>
                  </p>
                  <p className="text-xs font-bold text-indigo-300 opacity-80">초기 자본(30만) 대비 약 {((myData.capital / 300000) * 100).toFixed(0)}% 수익 달성!</p>
                  <div className="mt-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/10 shadow-inner">
                     <p className="text-sm font-black text-indigo-100">
                        총 {Math.floor(myData.capital - 300000).toLocaleString()}원 순이익 💰
                     </p>
                  </div>
               </div>
            </div>
            
             <div className="max-w-4xl mx-auto mt-8">
               <AssetChangeChart assetData={assetData} />
             </div>
          </div>

          {!myData.hasSubmittedFinalReview ? (
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 mt-10">
              <div className="mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-2xl font-black text-gray-800 mb-2 flex items-center gap-2"><span>📝</span> 대한민국 핵심 산업화 과정 최종 정리</h3>
                <p className="text-gray-500 font-medium">단순한 주식 게임이 아니라, <strong className="text-indigo-600">자본주의와 주식이라는 방식을 빌려 우리나라의 눈부신 경제 발전 과정을 체험</strong>해 본 것입니다.<br />아래 세 가지 질문에 답하며 대한민국의 산업화 과정을 어떻게 이해했는지 정리해 봅시다.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">1. 1960년대부터 현대까지 최신까지, 우리나라 경제를 이끄는 핵심 산업 분야는 주가 흐름과 함께 어떻게 변화해 왔나요?</label>
                  <textarea
                    value={finalQ1}
                    onChange={e => setFinalQ1(e.target.value)}
                    onBlur={() => saveDraft('finalQ1', finalQ1)}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 shadow-inner h-24 text-gray-800 placeholder-gray-400 text-sm"
                    placeholder="여기에 작성해주세요."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">2. 시대마다 일어난 큰 경제적/역사적 사건들(오일쇼크, 통일벼 보급, IMF 외환위기 등)은 산업 발전과 주가에 어떤 영향을 미쳤나요?</label>
                  <textarea
                    value={finalQ2}
                    onChange={e => setFinalQ2(e.target.value)}
                    onBlur={() => saveDraft('finalQ2', finalQ2)}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 shadow-inner h-24 text-gray-800 placeholder-gray-400 text-sm"
                    placeholder="여기에 작성해주세요."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">3. 이번 시뮬레이션을 통해 직접 겪어본 '대한민국의 경제 성장 과정'에 대한 종합적인 나의 소감이나 느낌점을 적어주세요.</label>
                  <textarea
                    value={finalQ3}
                    onChange={e => setFinalQ3(e.target.value)}
                    onBlur={() => saveDraft('finalQ3', finalQ3)}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 shadow-inner h-24 text-gray-800 placeholder-gray-400 text-sm"
                    placeholder="여기에 작성해주세요."
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (finalQ1.trim().length < 5 || finalQ2.trim().length < 5 || finalQ3.trim().length < 5) {
                    alert("세 가지 질문 모두 성의있게 작성해주세요.");
                    return;
                  }
                  const combinedFinal = `[핵심 산업의 변화 방향]\n${finalQ1}\n\n[경제적 위기와 극복의 역사]\n${finalQ2}\n\n[대한민국 경제 발전에 대한 종합 소감]\n${finalQ3}`;
                  const rawFields = { q1: finalQ1, q2: finalQ2, q3: finalQ3 };
                  update(ref(database, `rooms/${roomCode}/students/${myStudentId}`), {
                    hasSubmittedFinalReview: true,
                    finalReview: combinedFinal,
                    finalReviewRaw: rawFields
                  });
                }}
                className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-xl font-black text-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                ✨ 대한민국 전 시대 산업화 과정 정리 제출 완료하기
              </button>
            </div>
          ) : (
            <div className="bg-indigo-50 p-10 rounded-3xl text-center mt-10 border-2 border-indigo-100">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-black text-indigo-900 mb-2">모든 과정을 수료했습니다!</h3>
              <p className="text-indigo-700 font-medium">선생님의 안내가 있을 때까지 대기해주세요.</p>
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-6 flex items-center gap-2"><span>📂</span> 시대별 대한민국 핵심 뉴스 및 투자 역사 되돌아보기</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyList.map(([r, hData]) => (
              <div key={r} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="font-black text-lg text-indigo-800 border-b border-gray-100 pb-2">라운드 {r}</div>
                <div>
                  <div className="text-[11px] font-bold text-gray-400 mb-1">내가 작성한 힌트/요약</div>
                  <div className="text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded">{hData.newsSummary || '-'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-400 mb-1">투자의 이유/전략</div>
                  <div className="text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded">{hData.investReason || '-'}</div>
                </div>
                <div className="mt-auto pt-2">
                  <div className="text-[11px] font-bold text-purple-400 mb-1">결과 성찰 (되돌아보기)</div>
                  <div className="text-xs font-medium text-purple-900 bg-purple-50 p-2 rounded whitespace-pre-wrap leading-relaxed">
                    {hData.retrospectiveRaw && (hData.retrospectiveRaw.info || hData.retrospectiveRaw.future) ? (
                      <>
                        <div className="mb-1"><strong>● 정보 분석 성찰:</strong><br/>{hData.retrospectiveRaw.info || '-'}</div>
                        <div className="border-t border-purple-100 pt-1"><strong>● 향후 정보 전략:</strong><br/>{hData.retrospectiveRaw.future || '-'}</div>
                      </>
                    ) : (hData.retrospective || '-')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // [New Unified Phase 1] 전략 수립 + 매매 통합
  if (!isResultOpen && !isGameEnded) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8 pb-32 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
          <button onClick={leaveRoom} className="text-xs bg-white text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full font-bold border border-red-100 transition-all shadow-sm">
            🚪 내 기기에서 방 나가기
          </button>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          <div className="glass p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-4 z-20 bg-white/90 backdrop-blur">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <LoadingSpinner size="w-8 h-8" />
                <h1 className="text-xl md:text-2xl font-black text-indigo-900">라운드 {currentRound} ({currentRoundName}) 전략 & 매매</h1>
              </div>
              <p className="text-sm text-gray-500 font-medium font-bold">신문을 분석하고 전략을 세운 뒤 바로 주식을 매매해보세요.</p>
            </div>
            <div className="bg-white border-2 border-indigo-200 text-indigo-900 px-6 py-3 rounded-2xl font-black shadow-sm text-right">
              <span className="block text-xs text-indigo-400 uppercase tracking-widest mb-0.5">매수 가능 잔액 (현금)</span>
              <span className="text-2xl">{remainingCapital.toLocaleString()}</span> 원
            </div>
          </div>

          {myData.hasTraded ? (
            <div className="glass p-12 rounded-3xl text-center shadow-lg border-2 border-green-300 bg-gradient-to-b from-green-50 to-white mt-10">
              <div className="text-6xl mb-6">✅</div>
              <h2 className="text-3xl font-extrabold text-green-800 mb-3">포트폴리오 확정 완료!</h2>
              <p className="text-green-700 text-lg font-bold italic">다른 친구들이 매매를 마칠 때까지 선생님 화면을 보며 결과를 함께 기다려주세요.</p>
            </div>
          ) : (
            <>
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-extrabold text-indigo-800 mb-4 flex items-center gap-2">
                  <span>📝</span> 1단계: 뉴스 분석 및 투자 전략 수립
                </h3>
                <div className="space-y-4">
                  <label className="block font-bold text-gray-800 text-sm mb-2">신문 정보 분석 및 투자 전략 <span className="text-red-500 font-black">*</span></label>
                  <textarea
                    value={investReason}
                    onChange={e => setInvestReason(e.target.value)}
                    onBlur={() => saveDraft('investReason', investReason)}
                    placeholder="신문에서 찾은 핵심 경제 정보와 그 정보를 바탕으로 어떤 회사의 주식을 사고 팔지 이유를 통합적으로 작성해주세요. (5자 이상)"
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 shadow-inner h-32 text-gray-700 placeholder-gray-400 text-sm resize-none font-medium"
                  />
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-extrabold text-blue-800 mb-6 flex items-center gap-2">
                  <span>📈</span> 2단계: 실전 매매 및 저축
                </h3>
                
                <div className="bg-gradient-to-r from-indigo-800 to-blue-900 p-6 rounded-3xl text-white mb-8 relative overflow-hidden shadow-inner">
                   <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex-1">
                         <div className="font-black text-xl flex items-center gap-2"><span>🏦</span> {currentRound}R 저축(예금) 하기</div>
                         <p className="text-indigo-200 text-xs mt-1 font-bold">주식 대신 안전하게 저축하여 확정 이익을 얻으세요.</p>
                      </div>
                      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                         <div className="text-right">
                            <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">이번 시대 기준 금리</div>
                            <div className="text-2xl font-black text-yellow-400">{(stockData[currentRound]?.savingsRate * 100).toFixed(0)}%</div>
                         </div>
                         <div className="w-px h-10 bg-white/20"></div>
                         <div className="flex flex-col">
                            <span className="text-[10px] text-indigo-300 font-bold mb-1 uppercase text-center">저축 금액 입력</span>
                            <input
                                type="number"
                                value={savingsAmount}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  const maxVal = (myData.capital || 0) - totalOrderCost;
                                  if (val < 0) setSavingsAmount(0);
                                  else if (val > maxVal) setSavingsAmount(maxVal);
                                  else setSavingsAmount(val);
                                }}
                                className="bg-white/20 text-xl font-black rounded-lg w-32 focus:outline-none text-center py-1 border border-white/30"
                                placeholder="0"
                            />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                  {currentCompanies.map(company => {
                    const currentOwned = myData.portfolio?.[company.id] || 0;
                    const currentOrder = orders[company.id] || 0;
                    const finalEstimated = currentOwned + currentOrder;
                    const history = getCompanyHistory(company.id, currentRound, false);
                    const isUp = history.length > 1 && history[history.length - 1] >= history[history.length - 2];

                    return (
                      <div key={company.id} className="bg-gray-50 border border-gray-200 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-indigo-200 transition-colors group">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-indigo-600 transition-colors">
                            <Sparkline data={history} color={isUp ? "#ef4444" : "#4f46e5"} width={40} height={20} />
                          </div>
                          <div className="truncate">
                            <div className="font-black text-gray-800 text-lg mb-0.5">{company.name}</div>
                            <div className="text-sm text-indigo-600 font-black flex items-center gap-2">
                               <span className="text-[10px] text-gray-400 font-bold">거래 단가:</span>
                               {company.prev.toLocaleString()}원
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm shrink-0">
                           <button onClick={() => handleOrderChange(company.id, -1)} disabled={finalEstimated <= 0 && currentOrder <= 0} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 font-black text-xl hover:bg-red-50 hover:text-red-600 disabled:opacity-20 transition-all">-</button>
                           <div className="min-w-[80px] text-center">
                              <div className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-0.5">최종 보유 예정</div>
                              <input 
                                type="number" 
                                value={finalEstimated} 
                                onChange={(e) => handleDirectQtyChange(company.id, e.target.value)}
                                className="w-16 text-center text-xl font-black text-gray-900 leading-none focus:outline-none bg-indigo-50/50 rounded-lg py-1 border border-indigo-100"
                              />
                              <div className="text-[10px] font-black text-gray-400 mt-0.5 whitespace-nowrap">주</div>
                              {currentOrder !== 0 && (
                                <div className={`text-[10px] font-black mt-1 ${currentOrder > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                  {currentOrder > 0 ? '매수' : '매도'} {Math.abs(currentOrder)}주
                                </div>
                              )}
                           </div>
                           <button onClick={() => handleOrderChange(company.id, 1)} disabled={remainingCapital < company.prev} className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 font-black text-xl hover:bg-green-50 hover:text-green-600 disabled:opacity-20 transition-all">+</button>
                           <button onClick={() => handleMaxOrder(company.id)} disabled={remainingCapital < company.prev} className="px-3.5 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs hover:bg-indigo-600 hover:text-white disabled:opacity-20 transition-all shrink-0 ml-1">최대</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleFinalizeCombinedStep1}
                disabled={remainingCapital < 0}
                className={`w-full py-5 rounded-[40px] font-black text-2xl text-white shadow-xl transition-all ${remainingCapital < 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 hover:shadow-2xl hover:scale-[1.01] active:scale-95'}`}
              >
                {remainingCapital < 0 ? '잔액이 부족합니다 ❌' : '전략 제출 및 매매 확정하기 🚀'}
              </button>
              <p className="text-center text-gray-400 font-bold text-xs mt-2 italic">※ 제출 후에는 이번 시대가 끝나기 전까지 수정할 수 없습니다.</p>
            </>
          )}
        </div>
      </div>
    );
  }


  // 3단계 결과 공개되었을 때
  if (isResultOpen) {
    return (
      <div className="min-h-screen bg-purple-50 p-4 sm:p-8 pb-32 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
          <button onClick={leaveRoom} className="text-xs bg-white text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full font-bold border border-red-100 transition-all shadow-sm">
            🚪 내 기기에서 방 나가기
          </button>
        </div>
        <div className="max-w-4xl mx-auto space-y-6 mt-8">
          <div className="glass p-8 rounded-3xl text-center shadow-lg border-2 border-purple-200 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 text-9xl opacity-20">🎉</div>
            <h2 className="text-3xl font-black text-purple-800 mb-2 relative z-10">라운드 {currentRound} ({currentRoundName}) 마감!</h2>
            <p className="text-gray-700 mb-8 font-medium relative z-10">내 종합 자산 변동과 각 주식의 등락폭을 확인하세요.</p>

            {hasAssets && (() => {
              const initialAssets = Math.floor(myData.capital + (myData.savings || 0) + Object.entries(myData.portfolio || {}).reduce((acc, [cId, qty]) => {
                const c = currentCompanies.find(comp => comp.id === cId);
                return acc + (qty * (c?.prev || 0));
              }, 0));

              const profits = [];
              const losses = [];
              Object.entries(myData.portfolio || {}).forEach(([cId, qty]) => {
                if (qty <= 0) return;
                const c = currentCompanies.find(comp => comp.id === cId);
                if (!c) return;
                const p = (c.current - c.prev) * qty;
                if (p >= 0) profits.push({ ...c, profit: p, qty });
                else losses.push({ ...c, profit: p, qty });
              });

              const interest = Math.floor((myData.savings || 0) * (stockData[currentRound]?.savingsRate || 0));

              return (
                <div className="bg-white/50 backdrop-blur p-6 rounded-3xl border border-white/50 shadow-lg relative z-10">
                   <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                      <span className="w-4 h-4 bg-purple-500 text-white rounded-full flex items-center justify-center text-[10px]">=</span> 
                      자산 변동 상세 계산 (수익/이자 먼저, 손실 나중)
                   </div>
                   
                   <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                     <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-sm font-bold text-gray-600 leading-relaxed flex-1">
                        {/* 1. 시작 자산 */}
                        <div className="bg-white px-3 py-1.5 rounded-lg border border-purple-100 shadow-sm shrink-0">
                           <span className="text-[10px] text-gray-400 mr-2">투자 원금</span>
                           {initialAssets.toLocaleString()}원
                        </div>

                        {/* 2. 수익 종목들 */}
                        {profits.map(p => (
                          <React.Fragment key={p.id}>
                            <span className="text-gray-400">+</span>
                            <div className="bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 text-red-600 shadow-sm shrink-0">
                               <span className="text-[10px] opacity-70 mr-1">{p.name} 이익</span>
                               {p.profit.toLocaleString()}
                            </div>
                          </React.Fragment>
                        ))}

                        {/* 3. 이자 수익 */}
                        {interest > 0 && (
                          <>
                            <span className="text-gray-400">+</span>
                            <div className="bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 text-green-600 shadow-sm shrink-0">
                               <span className="text-[10px] opacity-70 mr-1">예금 이자</span>
                               {interest.toLocaleString()}
                            </div>
                          </>
                        )}

                        {/* 4. 손실 종목들 */}
                        {losses.map(l => (
                          <React.Fragment key={l.id}>
                            <span className="text-gray-400">-</span>
                            <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 text-blue-600 shadow-sm shrink-0">
                               <span className="text-[10px] opacity-70 mr-1">{l.name} 손실</span>
                               {Math.abs(l.profit).toLocaleString()}
                            </div>
                          </React.Fragment>
                        ))}
                     </div>

                     <div className="flex items-center gap-4 shrink-0 px-6 border-l border-white/50">
                        <span className="text-purple-600 text-3xl font-light">＝</span>
                        <div className="text-right">
                           <div className="text-[10px] font-black text-purple-400 uppercase tracking-wider mb-0.5">최종 자산 총액</div>
                           <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-600">
                             {Math.floor(resultTotalAssets + interest).toLocaleString()} <span className="text-xl text-purple-400 font-bold">원</span>
                           </div>
                        </div>
                     </div>
                   </div>
                </div>
              );
            })()}
            {!hasAssets && (
              <p className="text-xs text-orange-500 font-bold bg-orange-50 py-2 rounded mt-4">보유한 주식이 없어 자산 변동이 없습니다.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100 mt-8 mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🤔</span> 2단계: 이번 라운드 투자 되돌아보기
            </h3>

            {!myData.hasSubmittedRetrospective ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">이번 시대의 경제 뉴스를 기초로 <strong className="text-indigo-600">당시 유망했던 사회적 배경과 주요 산업군</strong>을 집중적으로 되돌아보며, 성찰해보세요.</p>

                {reflectionVersion === 2 ? (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">1. 이번 시대의 역사적 사건이나 국가 정책이 실제 주가와 어떻게 연결되었는지 비교해 봅시다. <span className="text-red-500">*</span></label>
                      <textarea 
                        value={retroInfoReview} 
                        onChange={e => setRetroInfoReview(e.target.value)} 
                        onBlur={() => saveDraft('retroInfoReview', retroInfoReview)} 
                        className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 text-sm resize-none h-28" 
                        placeholder="예시: 당시 *** 산업 육성 정책을 보고 주가가 ***할 것이라 예상했는데, 실제 *** 사건이 발생하며 주가가 변동했습니다." 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">2. 대한민국 산업이 변화하는 흐름을 볼 때, 다음 시대는 어떤 새로운 산업에 주목해야 할까요? <span className="text-red-500">*</span></label>
                      <textarea 
                        value={retroFutureReview} 
                        onChange={e => setRetroFutureReview(e.target.value)} 
                        onBlur={() => saveDraft('retroFutureReview', retroFutureReview)} 
                        className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 text-sm resize-none h-28" 
                        placeholder="예시: 다음 시대는 *** 산업에서 *** 산업으로 변화하는 흐름이므로, 정부의 *** 계획에 주목하겠습니다." 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">⬆️ 많은 이익이 난 종목</label>
                      <textarea value={profitReview} onChange={e => setProfitReview(e.target.value)} onBlur={() => saveDraft('profitReview', profitReview)} className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 text-sm resize-none h-24" placeholder="가장 많은 이익을 가져다 준 종목과 이유" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">⬇️ 이익이 조금이거나 손해인 종목</label>
                      <textarea value={lossReview} onChange={e => setLossReview(e.target.value)} onBlur={() => saveDraft('lossReview', lossReview)} className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 text-sm resize-none h-24" placeholder="기대보다 이익이 적거나 손해를 본 종목과 이유" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">⚖️ 아쉬운 점과 잘한 점</label>
                      <textarea value={goodBadReview} onChange={e => setGoodBadReview(e.target.value)} onBlur={() => saveDraft('goodBadReview', goodBadReview)} className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 text-sm resize-none h-24" placeholder="나의 전략에서 아쉬운 점과 잘한 점 분석" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">💡 배운 점</label>
                      <textarea value={lessonReview} onChange={e => setLessonReview(e.target.value)} onBlur={() => saveDraft('lessonReview', lessonReview)} className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 text-sm resize-none h-24" placeholder="다음에 써먹기 위해 배운 점" />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (reflectionVersion === 2) {
                      if (retroInfoReview.trim().length < 5 || retroFutureReview.trim().length < 5) {
                        alert("두 가지 질문 모두 성의있게 작성해주세요.");
                        return;
                      }
                      const combined = `[신문 정보와 투자 결과의 관계]\n${retroInfoReview}\n\n[향후 주목할 정보 전략]\n${retroFutureReview}`;
                      const raw = { info: retroInfoReview, future: retroFutureReview };
                      useGameStore.getState().submitRetrospective({ combined, raw });
                    } else {
                      if (lossReview.trim().length < 2 || profitReview.trim().length < 2 || goodBadReview.trim().length < 2 || lessonReview.trim().length < 2) {
                        alert("4가지 항목 모두 성의있게 작성해주세요.");
                        return;
                      }
                      const combined = `[많은 이익이 난 종목]\n${profitReview}\n\n[이익이 적거나 손해인 종목]\n${lossReview}\n\n[아쉬운/잘한점]\n${goodBadReview}\n\n[배운 점]\n${lessonReview}`;
                      const raw = { profit: profitReview, loss: lossReview, goodBad: goodBadReview, lesson: lessonReview };
                      useGameStore.getState().submitRetrospective({ combined, raw });
                    }
                  }}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-black text-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  📝 성찰 내용 제출하고 다음 라운드로 대기하기
                </button>
              </div>
            ) : (
              <div className="bg-purple-50 p-8 rounded-2xl border-2 border-purple-200 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-5xl mb-3">✅</span>
                <h4 className="text-2xl font-black text-purple-800 mb-2">투자 회고 제출 완료!</h4>
                <p className="text-sm font-medium text-purple-700">모든 친구들이 되돌아보기를 작성하고 나면, 선생님이 다음 시대를 열어줄 것입니다.<br />조금만 기다려주세요!</p>
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-800 px-2 mt-10 mb-4 flex items-center gap-2">
            <span>📊</span> 전체 종목 결과표 <span className="text-sm font-normal text-gray-500 ml-2">(보유 종목은 강조 표시됨)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentCompanies.map(company => {
              const ownedQty = myData.portfolio?.[company.id] || 0;
              const isOwned = ownedQty > 0;
              const history = getCompanyHistory(company.id, currentRound, true);
              const isUpResult = company.current >= company.prev;

              return (
                <div key={company.id} className={`p-5 rounded-2xl border-2 transition ${isOwned ? 'border-purple-500 bg-purple-50/50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-inner ${isOwned ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <div className={`font-bold text-lg ${isOwned ? 'text-purple-900' : 'text-gray-800'}`}>
                          {company.name}
                        </div>
                        {isOwned && (
                          <div className="inline-block mt-1 bg-purple-200 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            내가 {ownedQty}주 보유중
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`text-right font-black text-lg ${isUpResult ? 'text-red-500' : 'text-blue-500'}`}>
                      {company.change}
                    </div>
                  </div>

                  <div className="flex flex-col bg-white/60 p-3 rounded-xl gap-3">
                    <div className="flex justify-between items-center">
                       <div>
                         <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">단가 변화</div>
                         <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                           <span className="line-through opacity-70 font-medium">{company.prev.toLocaleString()}</span>
                           <span className="text-[10px]">👉</span>
                           <span className={`text-base ${isUpResult ? 'text-red-600' : 'text-blue-600'}`}>
                             {company.current.toLocaleString()}원
                           </span>
                         </div>
                       </div>
                       <div className="opacity-80">
                         <Sparkline data={history} color={isUpResult ? "#ef4444" : "#3b82f6"} width={60} height={25} />
                       </div>
                    </div>

                    {isOwned && (
                      <div className={`mt-1 p-3 rounded-xl border flex justify-between items-center ${isUpResult ? 'bg-red-50/50 border-red-100' : 'bg-blue-50/50 border-blue-100'}`}>
                         <div>
                            <div className="text-[10px] text-gray-500 font-bold">투자 성과</div>
                            <div className={`text-lg font-black ${isUpResult ? 'text-red-600' : 'text-blue-600'}`}>
                               {isUpResult ? '+' : ''}{( (company.current - company.prev) * ownedQty ).toLocaleString()} <span className="text-xs font-bold text-gray-500 italic">원</span>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-[10px] text-gray-500 font-bold">수익률</div>
                            <div className={`text-sm font-black ${isUpResult ? 'text-red-700' : 'text-blue-700'}`}>
                               {(((company.current - company.prev) / company.prev) * 100).toFixed(1)}%
                            </div>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    );
  }

  // 기본 Fallback (모든 상태가 위에서 처리되지 않았을 때) - 이론상 도달하지 않음
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="w-16 h-16" />
        <p className="mt-4 text-gray-500 font-bold">화면을 불러오는 중입니다...</p>
      </div>
    </div>
  );
}

