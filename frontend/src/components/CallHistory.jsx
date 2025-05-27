import React from "react";

export default function CallHistory({ calls }) {
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

  return (
    <div className="call-history">
      <h2>История звонков</h2>
      <div className="call-history-list">
        {[...calls].reverse().map((call, index) => (
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
    </div>
  );
}