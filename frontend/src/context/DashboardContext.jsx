import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [workloadStatus, setWorkloadStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [m, t, w] = await Promise.all([
        api.get('/schedule/dashboard/metrics'),
        api.get('/schedule/dashboard/trends'),
        api.get('/schedule/dashboard/workload-status'),
      ]);
      setMetrics(m.data);
      setTrends(t.data);
      setWorkloadStatus(w.data);
    } catch (e) {
      console.error('Dashboard refresh error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <DashboardContext.Provider value={{ metrics, trends, workloadStatus, loading, refresh }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
