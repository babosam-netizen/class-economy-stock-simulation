import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ref, onValue, update, onDisconnect, set as firebaseSet } from 'firebase/database';
import { database } from '../lib/firebase';
import { stockData } from '../data/stocks';

const useGameStore = create(
  persist(
    (set, getStore) => ({
      roomCode: null,
      role: null,
      isTradingOpen: false,
      isResultOpen: false,
      isGameEnded: false,
      students: {},
      currentRound: 1,
      myStudentId: null,
      roomClassName: '',
      reflectionVersion: 1,
      allRooms: {},

      initRoomInfo: (code) => {
        set({ roomCode: code, role: 'teacher' });
        getStore().attachListener(code);
      },

      joinRoom: (code, studentInfo) => {
        const sId = `student_${studentInfo.number}`;
        set({ roomCode: code, role: 'student', myStudentId: sId });
        getStore().attachListener(code);
        getStore().setupPresence(code, sId);
      },

      removeStudent: async (studentId) => {
        const { roomCode } = getStore();
        if (!roomCode || !studentId) return;
        // Firebase 상에서 해당 노드를 null로 덮어씌우면 데이터가 완벽히 삭제(퇴장)됩니다.
        await update(ref(database), {
          [`rooms/${roomCode}/students/${studentId}`]: null
        });
      },

      setupPresence: (code, sId) => {
        if (!code || !sId) return;
        const connectedRef = ref(database, '.info/connected');
        const myStatusRef = ref(database, `rooms/${code}/students/${sId}/isOnline`);
        onValue(connectedRef, (snap) => {
          if (snap.val() === true) {
             onDisconnect(myStatusRef).set(false).then(() => {
               // 연결이 완료되면 isOnline을 true로
               firebaseSet(myStatusRef, true);
             });
          }
        });
      },

      destroyRoom: async () => {
        const { roomCode } = getStore();
        if (!roomCode) return;
        try {
          await update(ref(database), { [`rooms/${roomCode}`]: null });
        } catch(e) { console.error(e); }
        getStore().leaveRoom();
      },

      leaveRoom: () => {
        const { roomCode, myStudentId, role, activeListener } = getStore();

        // [추가] 기존 리스너 구독 해제
        if (activeListener) {
          console.log(`[GameStore] Unsubscribing listener for ${roomCode}`);
          activeListener();
        }

        // 학생이 자발적으로 나가면 온라인 상태를 false로 즉시 처리
        if (role === 'student' && roomCode && myStudentId) {
          const myStatusRef = ref(database, `rooms/${roomCode}/students/${myStudentId}/isOnline`);
          firebaseSet(myStatusRef, false);
        }
        set({ 
          roomCode: null, 
          role: null, 
          myStudentId: null, 
          isTradingOpen: false, 
          isResultOpen: false, 
          isGameEnded: false,
          students: {}, 
          currentRound: 1,
          roomClassName: '',
          reflectionVersion: 1,
          activeRoomCode: null,
          activeListener: null
        });
      },

      activeListener: null,

      attachListener: (code) => {
        if (!code) return;
        
        // 이미 해당 방의 리스너가 동작 중이면 중복 실행 방지
        const currentStore = getStore();
        if (currentStore.activeRoomCode === code && currentStore.activeListener) {
          console.log(`[GameStore] Listener for ${code} already active.`);
          return;
        }

        console.log(`[GameStore] Attaching listener for ${code}`);
        const roomRef = ref(database, `rooms/${code}`);
        
        // 이전 리스너가 있다면 제거 (있을 경우를 대비)
        // Note: onValue는 unsubscribe 함수를 반환합니다.
        const unsubscribe = onValue(roomRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            set({
              activeRoomCode: code,
              activeListener: unsubscribe, // 리스너 구독 해제 함수 저장
              isTradingOpen: data.isTradingOpen || false,
              isResultOpen: data.isResultOpen || false,
              isGameEnded: data.isGameEnded || false,
              students: data.students || {},
              currentRound: data.currentRound || 1,
              roomClassName: data.className || '',
              reflectionVersion: data.reflectionVersion || 1,
            });
          } else {
            console.warn(`[GameStore] Room ${code} does not exist.`);
            set({ activeRoomCode: 'error' });
          }
        });
      },

      setRound: async (round) => {
        const { roomCode } = getStore();
        if (!roomCode) return;
        await update(ref(database, `rooms/${roomCode}`), { 
          currentRound: round,
          isTradingOpen: false,
          isResultOpen: false
        });
      },

      toggleTrading: async (isOpen) => {
        const { roomCode } = getStore();
        if (!roomCode) return;
        await update(ref(database, `rooms/${roomCode}`), { isTradingOpen: isOpen });
      },

      toggleResult: async (isOpen) => {
        const { roomCode } = getStore();
        if (!roomCode) return;
        await update(ref(database, `rooms/${roomCode}`), { isResultOpen: isOpen });
      },

      submitRetrospective: async (data) => {
        const { roomCode, myStudentId, currentRound } = getStore();
        if (!roomCode || !myStudentId) return;

        try {
          const updates = {};
          const content = typeof data === 'string' ? data : data.combined;
          const raw = typeof data === 'object' ? data.raw : null;

          updates[`rooms/${roomCode}/students/${myStudentId}/hasSubmittedRetrospective`] = true;
          updates[`rooms/${roomCode}/students/${myStudentId}/history/${currentRound}/retrospective`] = content;
          if (raw) {
            updates[`rooms/${roomCode}/students/${myStudentId}/history/${currentRound}/retrospectiveRaw`] = raw;
            // 실시간 복구를 위해 학생 객체 최상단에도 저장 (선택항목)
            updates[`rooms/${roomCode}/students/${myStudentId}/retrospectiveRaw`] = raw;
          }
          await update(ref(database), updates);
        } catch (error) {
          console.error("되돌아보기 제출 오류:", error);
        }
      },

      resetStudentStage: async (studentId, stage) => {
        console.log("Teacher Reset Triggered:", studentId, "Stage:", stage);
        const { roomCode, currentRound, students } = getStore();
        if (!roomCode || !studentId) return;
        const student = students[studentId];
        if (!student) return;
        
        const updates = {};
        const prefix = `rooms/${roomCode}/students/${studentId}`;
        
        if (stage === 1) {
            updates[`${prefix}/hasSubmittedReason`] = false;
         } else if (stage === 2) {
            updates[`${prefix}/hasTraded`] = false;
            // 거래를 취소하면 자본금, 포트폴리오, 예금을 '이번 라운드 시작 직후' 시점으로 되돌립니다.
            // 핵심: 이전 라운드 종료 시점의 원금 + 예금 + 이자가 모두 반영된 상태여야 함.
            if (currentRound === 1) {
               updates[`${prefix}/capital`] = 300000;
               updates[`${prefix}/portfolio`] = null;
               updates[`${prefix}/savings`] = 0;
            } else {
               const prevRound = currentRound - 1;
               const prevHistory = student.history?.[prevRound];
               const prevSavings = prevHistory?.savings || 0;
               const interestRate = stockData[prevRound]?.savingsRate || 0;
               const interest = Math.floor(prevSavings * interestRate);
               
               // 이번 라운드 시작 시점의 가용 자산 = 전 라운드 잔여 현금 + 전 라운드 저금액 + 이자
               const startCapital = (prevHistory?.capital || 0) + prevSavings + interest;
               
               updates[`${prefix}/capital`] = startCapital;
               updates[`${prefix}/portfolio`] = prevHistory?.portfolio || null;
               updates[`${prefix}/savings`] = 0; // 시작 시점엔 무조건 0 (모두 현금화)
               updates[`${prefix}/lastInterest`] = interest;
            }
         } else if (stage === 3) {
           updates[`${prefix}/hasSubmittedRetrospective`] = false;
         } else if (stage === 4) {
           updates[`${prefix}/hasSubmittedFinalReview`] = false;
        }
        try {
          await update(ref(database), updates);
        } catch (error) {
          console.error("개별 리셋 오류:", error);
          alert("리셋 처리 중 오류가 발생했습니다.");
        }
      },

      advanceRound: async () => {
        const { roomCode, currentRound, students } = getStore();
        if (!roomCode) return;
        
        const nextRound = currentRound + 1;
        const updates = {};
        if (currentRound >= 7) {
           updates[`rooms/${roomCode}/isGameEnded`] = true;
        } else {
           updates[`rooms/${roomCode}/currentRound`] = nextRound;
        }
        updates[`rooms/${roomCode}/isTradingOpen`] = false;
        updates[`rooms/${roomCode}/isResultOpen`] = false;
        
        if (students) {
          const rate = stockData[currentRound]?.savingsRate || 0;

          Object.entries(students).forEach(([studentId, student]) => {
            // 이번 라운드(currentRound) 종료 시점의 이자 정산 (다음 라운드 시작 자본금)
            const savings = student.savings || 0;
            const interest = Math.floor(savings * rate);
            const newCapital = (student.capital || 0) + savings + interest;

            updates[`rooms/${roomCode}/students/${studentId}/capital`] = newCapital;
            updates[`rooms/${roomCode}/students/${studentId}/savings`] = 0;
            updates[`rooms/${roomCode}/students/${studentId}/lastInterest`] = interest;

            // 다음 라운드(nextRound) 데이터가 이미 히스토리에 있다면 복구 (비파괴 이동)
            const nextHistory = student.history?.[nextRound];
            if (nextHistory) {
              updates[`rooms/${roomCode}/students/${studentId}/hasTraded`] = nextHistory.hasTraded || false;
              updates[`rooms/${roomCode}/students/${studentId}/hasSubmittedReason`] = nextHistory.hasSubmittedReason || (!!nextHistory.newsSummary || !!nextHistory.investReason);
              updates[`rooms/${roomCode}/students/${studentId}/hasSubmittedRetrospective`] = nextHistory.hasSubmittedRetrospective || !!nextHistory.retrospective;
              updates[`rooms/${roomCode}/students/${studentId}/newsSummary`] = nextHistory.newsSummary || '';
              updates[`rooms/${roomCode}/students/${studentId}/investReason`] = nextHistory.investReason || '';
              updates[`rooms/${roomCode}/students/${studentId}/reason`] = nextHistory.reason || '';
              updates[`rooms/${roomCode}/students/${studentId}/retrospectiveRaw`] = nextHistory.retrospectiveRaw || null;
            } else {
              // 신규 라운드 진입 시 초기화
              updates[`rooms/${roomCode}/students/${studentId}/hasTraded`] = false;
              updates[`rooms/${roomCode}/students/${studentId}/hasSubmittedReason`] = false;
              updates[`rooms/${roomCode}/students/${studentId}/hasSubmittedRetrospective`] = false;
              updates[`rooms/${roomCode}/students/${studentId}/newsSummary`] = '';
              updates[`rooms/${roomCode}/students/${studentId}/investReason`] = '';
              updates[`rooms/${roomCode}/students/${studentId}/reason`] = '';
              updates[`rooms/${roomCode}/students/${studentId}/retrospectiveRaw`] = null;
            }
            
            updates[`rooms/${roomCode}/students/${studentId}/finalReviewRaw`] = student.finalReviewRaw || null;
            updates[`rooms/${roomCode}/students/${studentId}/draftOrders`] = null;
            updates[`rooms/${roomCode}/students/${studentId}/draftSavings`] = null;
          });
        }
        await update(ref(database), updates);
      },

      previousRound: async () => {
        const { roomCode, currentRound, students } = getStore();
        if (!roomCode || currentRound <= 1) return;
        
        const newRound = currentRound - 1;
        const updates = {};
        updates[`rooms/${roomCode}/currentRound`] = newRound;
        updates[`rooms/${roomCode}/isTradingOpen`] = false;
        updates[`rooms/${roomCode}/isResultOpen`] = false;
        updates[`rooms/${roomCode}/isGameEnded`] = false;
        
        if (students) {
          Object.entries(students).forEach(([studentId, student]) => {
            // 1. 자산 상태 복구 (해당 라운드 시작 시점 = 전 라운드 종료 시점)
            const prevHistory = student.history?.[newRound - 1];
            
            if (newRound === 1) {
              updates[`rooms/${roomCode}/students/${studentId}/capital`] = 300000;
              updates[`rooms/${roomCode}/students/${studentId}/portfolio`] = null;
              updates[`rooms/${roomCode}/students/${studentId}/savings`] = 0;
            } else if (prevHistory) {
              const prevSavings = prevHistory.savings || 0;
              const interestRate = stockData[newRound - 1]?.savingsRate || 0;
              const interest = Math.floor(prevSavings * interestRate);
              const startCapital = (prevHistory.capital || 0) + prevSavings + interest;

              updates[`rooms/${roomCode}/students/${studentId}/capital`] = startCapital;
              updates[`rooms/${roomCode}/students/${studentId}/portfolio`] = prevHistory.portfolio || null;
              updates[`rooms/${roomCode}/students/${studentId}/savings`] = 0;
            }

            // 2. 되돌아가는 라운드(newRound)에 이미 작성했던 데이터가 있다면 복구 (비파괴)
            const currentHistory = student.history?.[newRound];
            if (currentHistory) {
              updates[`rooms/${roomCode}/students/${studentId}/hasTraded`] = currentHistory.hasTraded || false;
              updates[`rooms/${roomCode}/students/${studentId}/hasSubmittedReason`] = currentHistory.hasSubmittedReason || (!!currentHistory.newsSummary || !!currentHistory.investReason);
              updates[`rooms/${roomCode}/students/${studentId}/hasSubmittedRetrospective`] = currentHistory.hasSubmittedRetrospective || !!currentHistory.retrospective;
              updates[`rooms/${roomCode}/students/${studentId}/newsSummary`] = currentHistory.newsSummary || '';
              updates[`rooms/${roomCode}/students/${studentId}/investReason`] = currentHistory.investReason || '';
              updates[`rooms/${roomCode}/students/${studentId}/reason`] = currentHistory.reason || ''; 
              updates[`rooms/${roomCode}/students/${studentId}/retrospectiveRaw`] = currentHistory.retrospectiveRaw || null;
            } else {
              updates[`rooms/${roomCode}/students/${studentId}/hasTraded`] = false;
              updates[`rooms/${roomCode}/students/${studentId}/hasSubmittedReason`] = false;
              updates[`rooms/${roomCode}/students/${studentId}/hasSubmittedRetrospective`] = false;
              updates[`rooms/${roomCode}/students/${studentId}/newsSummary`] = '';
              updates[`rooms/${roomCode}/students/${studentId}/investReason`] = '';
              updates[`rooms/${roomCode}/students/${studentId}/reason`] = ''; 
              updates[`rooms/${roomCode}/students/${studentId}/retrospectiveRaw`] = null;
            }
          });
        }
        await update(ref(database), updates);
      },

      fetchAllRooms: () => {
        const roomsRef = ref(database, 'rooms');
        onValue(roomsRef, (snapshot) => {
          if (snapshot.exists()) {
            set({ allRooms: snapshot.val() });
          } else {
            set({ allRooms: {} });
          }
        });
      },

      deleteRoomPermanent: async (code) => {
        if (!code) return;
        try {
          const roomRef = ref(database, `rooms/${code}`);
          await firebaseSet(roomRef, null); // 전체 노드 완전 삭제
        } catch (error) {
          console.error("방 삭제 오류:", error);
          alert("방 삭제 중 오류가 발생했습니다.");
        }
      }
    }),
    {
      name: 'economy-stock-storage',
      partialize: (state) => ({ 
        roomCode: state.roomCode, 
        role: state.role, 
        myStudentId: state.myStudentId 
      }),
    }
  )
);

export default useGameStore;
