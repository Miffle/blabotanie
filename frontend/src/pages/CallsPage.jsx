import React, { useEffect, useState } from "react";
import { getCallsHistory } from "../api/calls";
import CallHistory from "../components/CallHistory";
import "../styles/call-history.css"
export default function CallsPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCallsHistory()
      .then(data => {
        setCalls(data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <CallHistory calls={calls} />
  );
}
