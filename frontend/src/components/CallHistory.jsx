import React, { useState, useEffect } from "react";
import { getCallHistory } from "../api/calls";

export default function CallHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const [calls, setCalls] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 5;

  const fetchCallHistory = async (page) => {
    try {
      setLoading(true);
      const response = await getCallHistory(page, itemsPerPage);
      setCalls(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching call history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallHistory(currentPage -1);
  }, [currentPage]);

  const formatDateTime = (dateArray) => {
    const [year, month, day, hours, minutes] = dateArray;
    return `${day.toString().padStart(2, '0')}.${(month + 1).toString().padStart(2, '0')}.${String(year).slice(-2)} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return (hours > 0 ? String(hours).padStart(2, '0') + ':' : '') +
           String(mins).padStart(2, '0') + ':' +
           String(secs).padStart(2, '0');
  };

  const getCallType = (call, currentUser) => {
    if (call.initiator === currentUser) {
      return "Исходящий";
    }
    return "Входящий";
  };

  const getCallStatus = (status) => {
    switch (status) {
      case "ENDED":
        return "Завершён";
      case "DECLINED":
        return "Отклонён";
      case "IN_PROCESS":
        return "В процессе";
      case "CANCELLED":
        return "Пропущен";
      default:
        return status;
    }
  };

  const currentUser = localStorage.getItem("username");

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <div className="call-history">
      <h2>История звонков</h2>
      <div className="call-history-list">
        {loading && <div className="call-history-loading">Загрузка...</div>}
        {!loading && calls.map((call, index) => (
          <div key={index} className="call-history-item">
            <div className="call-info">
              <div className="call-type">
                {getCallType(call, currentUser)}
              </div>
              <div className="call-participant">
                {call.initiator === currentUser ? call.called : call.initiator}
              </div>
              <div className="call-time">
                {formatDateTime(call.endTime)}
              </div>
              <div className="call-duration">
                {formatDuration(call.duration)}
              </div>
              <div className="call-status">
                {getCallStatus(call.callStatus)}
              </div>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={handlePrevPage} 
            disabled={currentPage === 1 || loading}
            className="pagination-btn"
          >
            Назад
          </button>
          <span className="pagination-info">
            Страница {currentPage} из {totalPages}
          </span>
          <button 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages || loading}
            className="pagination-btn"
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
}