import React, { useState } from 'react';
import { stockData } from '../data/stocks';

export default function AnalysisTab({ students, reflectionVersion }) {
  const [selectedRound, setSelectedRound] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const studentList = Object.entries(students || {});

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += `학생 이름,학생 번호,라운드(시대명),이자율,핵심 뉴스 정보(요약),투자 전략 및 이유,${reflectionVersion === 2 ? '신문 정보와 투자 결과의 관계(성찰1),향후 주목할 정보 전략(성찰2)' : '종합 투자 회고록(되돌아보기)'},남은 현금(수중),저금(예금),총 평가 자산,포트폴리오(종목 및 수량)\n`;

    studentList.forEach(([id, s]) => {
      if (selectedStudent !== 'all' && String(id) !== String(selectedStudent)) return;
      const history = s.history || {};
      Object.keys(history).forEach(r => {
        if (selectedRound !== 'all' && String(r) !== String(selectedRound)) return;

        const rd = history[r];
        const roundName = stockData[r]?.roundName || '';

        // 자산 합계 계산
        let totalValue = (rd.capital || 0) + (rd.savings || 0);
        if (rd.portfolio) {
          Object.entries(rd.portfolio).forEach(([cId, q]) => {
            const comp = stockData[r]?.companies?.find(c => c.id === cId);
            if (comp) totalValue += (q * comp.current);
          });
        }

        const pfStr = rd.portfolio
          ? Object.entries(rd.portfolio).map(([c, q]) => {
            const compName = stockData[r]?.companies?.find(comp => comp.id === c)?.name || c;
            return `${compName}(${q}주)`;
          }).join(" / ")
          : "보유 주식 없음";

        const row = [
          `"${s.nickname}"`,
          `"${s.studentNumber}"`,
          `"${r}라운드 (${roundName})"`,
          `"${(stockData[r]?.savingsRate * 100).toFixed(0)}%"`,
          `"${(rd.newsSummary || '').replace(/"/g, '""')}"`,
          `"${(rd.investReason || '').replace(/"/g, '""')}"`,
          reflectionVersion === 2 
            ? `"${(rd.retrospectiveRaw?.info || '').replace(/"/g, '""')}","${(rd.retrospectiveRaw?.future || '').replace(/"/g, '""')}"`
            : `"${(rd.retrospective || '').replace(/"/g, '""')}"`,
          `"${rd.capital ? Math.floor(rd.capital) : '0'}"`,
          `"${rd.savings ? Math.floor(rd.savings) : '0'}"`,
          `"${Math.floor(totalValue)}"`,
          `"${pfStr}"`
        ];
        csvContent += row.join(",") + "\n";
      });

      if ((selectedRound === 'all' || selectedRound === 'final') && s.finalReview) {
        const finalMsgRow = [
          `"${s.nickname}"`,
          `"${s.studentNumber}"`,
          `"최종메시지"`,
          `"-"`,
          `"-"`,
          `"-"`,
          reflectionVersion === 2 ? `"${s.finalReview.replace(/"/g, '""')}","-"` : `"${s.finalReview.replace(/"/g, '""')}"`,
          `"-"`,
          `"-"`,
          `"-"`,
          `"-"`
        ];
        csvContent += finalMsgRow.join(",") + "\n";
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const selectedStudentName = selectedStudent === 'all' ? '전체' : (students[selectedStudent]?.nickname || selectedStudent);
    const roundStr = selectedRound === 'all' ? '전체' : (selectedRound === 'final' ? '최종메시지' : selectedRound + '라운드');
    link.setAttribute("download", `학생_투자데이터_${selectedStudentName}_${roundStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex-1 relative flex flex-col min-h-[600px]">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; padding: 0 !important; margin: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 no-print">
        <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2"><span>📂</span> 학생 누적 데이터 분석 및 출력</h2>
        <div className="flex flex-wrap gap-2">
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 font-bold text-gray-700 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedRound}
            onChange={e => setSelectedRound(e.target.value)}
          >
            <option value="all">전체 라운드 보기</option>
            {[1, 2, 3, 4, 5, 6, 7].map(r => <option key={r} value={r}>{r}라운드 ({stockData[r]?.roundName})</option>)}
            <option value="final">최종메시지</option>
          </select>
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 font-bold text-gray-700 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedStudent}
            onChange={e => setSelectedStudent(e.target.value)}
          >
            <option value="all">전체 학생 보기</option>
            {studentList
              .sort((a, b) => (a[1].studentNumber || 0) - (b[1].studentNumber || 0))
              .map(([id, s]) => (
                <option key={id} value={id}>{s.studentNumber}번 {s.nickname}</option>
              ))
            }
          </select>
          <button onClick={exportCSV} className="bg-green-50 text-green-700 hover:bg-green-600 hover:text-white font-bold py-3 px-5 rounded-xl shadow-sm border border-green-200 transition-all flex items-center gap-2">
            <span>📊</span> CSV 다운로드
          </button>
          <button onClick={handlePrint} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-bold py-3 px-5 rounded-xl shadow-sm border border-indigo-200 transition-all flex items-center gap-2">
            <span>🖨️</span> 문서화(PDF/인쇄)
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-gray-200 print-area">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-100 text-gray-700 font-bold border-b-2 border-gray-300">
              <th className="p-3 text-sm">이름(번호)</th>
              <th className="p-3 text-sm">라운드</th>
              <th className="p-3 text-sm">이자율</th>
              <th className="p-3 text-sm w-[15%]">핵심 정보 (요약)</th>
              <th className="p-3 text-sm w-[15%]">투자 전략 (이유)</th>
              <th className="p-3 text-sm w-[40%]">
                {reflectionVersion === 2 ? '투자 성찰 (뉴스 연계 / 향후 전략)' : '종합 투자 회고록 (되돌아보기)'}
              </th>
              <th className="p-3 text-sm">종료 포트폴리오</th>
            </tr>
          </thead>
          <tbody>
            {studentList.flatMap(([id, s]) => {
              if (selectedStudent !== 'all' && String(id) !== String(selectedStudent)) return [];
              const history = s.history || {};
              const rows = [];
              Object.keys(history).forEach(r => {
                if (selectedRound !== 'all' && String(r) !== String(selectedRound)) return;
                const rd = history[r];
                const roundName = stockData[r]?.roundName || '';

                // 자산 합계 계산
                let totalValue = (rd.capital || 0) + (rd.savings || 0);
                if (rd.portfolio) {
                  Object.entries(rd.portfolio).forEach(([cId, q]) => {
                    const comp = stockData[r]?.companies?.find(c => c.id === cId);
                    if (comp) totalValue += (q * comp.current);
                  });
                }

                const pfStr = rd.portfolio
                  ? Object.entries(rd.portfolio).map(([c, q]) => {
                    const compName = stockData[r]?.companies?.find(comp => comp.id === c)?.name || c;
                    return `${compName}(${q})`;
                  }).join(", ")
                  : "없음";

                rows.push(
                  <tr key={`${id}-${r}`} className="border-b border-gray-100 hover:bg-indigo-50/30 transition text-[13px]">
                    <td className="p-3 align-top whitespace-nowrap">
                      <span className="font-bold text-indigo-900">{s.nickname}</span>
                      <span className="text-[10px] text-gray-500 ml-1 block">({s.studentNumber}번)</span>
                    </td>
                    <td className="p-3 align-top whitespace-nowrap font-semibold text-gray-700">
                      R{r}. {roundName}
                    </td>
                    <td className="p-3 align-top text-center font-bold text-blue-600">
                      {(stockData[r]?.savingsRate * 100).toFixed(0)}%
                    </td>
                    <td className="p-3 align-top text-gray-600 break-words font-medium">
                      {rd.newsSummary || '-'}
                    </td>
                    <td className="p-3 align-top text-gray-600 break-words font-medium">
                      {rd.investReason || '-'}
                    </td>
                    <td className="p-3 align-top text-purple-700 break-words font-medium text-xs leading-relaxed">
                      {rd.retrospectiveRaw && (rd.retrospectiveRaw.info || rd.retrospectiveRaw.future) ? (
                        <div className="flex flex-col gap-2">
                          <div>
                            <span className="text-[10px] text-purple-400 block font-bold">● 뉴스-투자 관계:</span>
                            {rd.retrospectiveRaw.info || '-'}
                          </div>
                          <div className="border-t border-purple-50 pt-1">
                            <span className="text-[10px] text-purple-400 block font-bold">● 향후 정보 전략:</span>
                            {rd.retrospectiveRaw.future || '-'}
                          </div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{rd.retrospective || '-'}</div>
                      )}
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between border-b border-gray-50 pb-1">
                          <span className="text-gray-400">현금</span>
                          <span className="font-bold">{rd.capital ? Math.floor(rd.capital).toLocaleString() : 0}원</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-1">
                          <span className="text-blue-400">저금</span>
                          <span className="font-bold text-blue-600">{rd.savings ? Math.floor(rd.savings).toLocaleString() : 0}원</span>
                        </div>
                        <div className="flex justify-between bg-indigo-50 px-1 py-0.5 rounded">
                          <span className="text-indigo-400 font-bold">총자산</span>
                          <span className="font-black text-indigo-700">{Math.floor(totalValue).toLocaleString()}원</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          <span className="font-bold">포폴:</span> {pfStr}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              });

              if ((selectedRound === 'all' || selectedRound === 'final') && s.finalReview) {
                rows.push(
                  <tr key={`${id}-final`} className="border-b-4 border-gray-200 bg-gray-50/50 hover:bg-indigo-50/30 transition text-[13px]">
                    <td className="p-3 align-top whitespace-nowrap">
                      <span className="font-bold text-gray-500">{s.nickname}</span>
                      <span className="text-[10px] text-gray-400 ml-1 block">({s.studentNumber}번)</span>
                    </td>
                    <td className="p-3 align-top whitespace-nowrap font-black text-indigo-900 bg-indigo-50/40">
                      최종메시지
                    </td>
                    <td className="p-3 align-top text-center text-gray-400 font-bold">-</td>
                    <td className="p-3 align-top text-gray-400 text-center">-</td>
                    <td className="p-3 align-top text-gray-400 text-center">-</td>
                    <td className="p-3 align-top text-gray-800 font-black text-xs leading-relaxed whitespace-pre-wrap bg-yellow-50/30">
                      {s.finalReview}
                    </td>
                    <td className="p-3 align-top text-gray-400 text-center">-</td>
                  </tr>
                );
              }

              return rows;
            })}
            {(() => {
              const hasVisibleData = studentList.some(([id, s]) => {
                if (selectedStudent !== 'all' && String(id) !== String(selectedStudent)) return false;
                if (selectedRound === 'final') return !!s.finalReview;
                const history = s.history || {};
                const hasRoundData = Object.keys(history).some(r => selectedRound === 'all' || String(r) === String(selectedRound));
                return selectedRound === 'all' ? (hasRoundData || !!s.finalReview) : hasRoundData;
              });

              if (!hasVisibleData) {
                return (
                  <tr>
                    <td colSpan="7" className="p-16 text-center text-gray-400 font-bold text-lg italic bg-gray-50/30">
                      💡 선택한 조건(라운드/학생)에 해당하는 기록이 아직 없습니다.
                    </td>
                  </tr>
                );
              }
              return null;
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
