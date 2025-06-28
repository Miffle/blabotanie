// @ts-ignore
import React, {useEffect, useState} from "react";
import {CallsPageService} from "../services/CallsPageService";
import "../styles/call-history.css"
import {useTranslation} from 'react-i18next';

export default function CallHistory() {
    const {t} = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);
    const [calls, setCalls] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const fetchCallHistory = async (page) => {
        try {
            setLoading(true);
            const response = await CallsPageService.getCallsHistory(page);
            setCalls(response.content);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error("Error fetching call history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCallHistory(currentPage - 1);
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
        if (call.initiatorUsername === currentUser) {
            return t('callsHistory.outgoing');
        }
        return t('callsHistory.incoming');
    };

    const getCallStatus = (status) => {
        switch (status) {
            case "ENDED":
                return t('callsHistory.ended');
            case "DECLINED":
                return t('callsHistory.declined');
            case "IN_PROCESS":
                return t('callsHistory.inProcess');
            case "CANCELLED":
                return t('callsHistory.cancelled');
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
            <h2>{t("callsHistory.header")}</h2>
            <div className="call-history-list">
                {loading && <div className="call-history-loading">Загрузка...</div>}
                {!loading && calls.map((call, index) => (
                    <div key={index} className="call-history-item">
                        <div className="call-line">
                            <span
                                className="call-name">{call.initiatorUsername === currentUser ? call.calledUsername : call.initiatorUsername}</span>
                            <span className="call-type">{getCallType(call, currentUser)}</span>
                            <span className="call-status">{getCallStatus(call.callStatus)}</span>
                        </div>
                        {(call.callStatus !== "IN_PROCESS" && call.callStatus !== "WAITING") &&
                            <div className="call-meta">
                                <span className="call-time">{formatDateTime(call.endTime)}</span>
                                <span className="call-duration">{formatDuration(call.duration)}</span>
                            </div>
                        }
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
                        {t("callsHistory.back")}
                    </button>
                    <span className="pagination-info">
{t('pagination.info', {current: currentPage, total: totalPages})}
          </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || loading}
                        className="pagination-btn"
                    >
                        {t("callsHistory.next")}
                    </button>
                </div>
            )}
        </div>
    );
}