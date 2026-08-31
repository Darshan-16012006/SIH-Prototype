import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Filter, LineChart as ChartIcon } from 'lucide-react';
import { api } from '../services/api';

export function Analytics() {
  const [department, setDepartment] = useState('All');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [department]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalyticsOverview(department !== 'All' ? department : null);
      setData(res);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
        Loading portfolio analytics...
      </div>
    );
  }

  const { planned_vs_actual, department_breakdown, risk_distribution, status_distribution } = data;

  return (
    <div>
      {/* Header & Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Portfolio Analytics & Performance Metrics</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} style={{ color: '#64748B' }} />
          <select
            className="form-control"
            style={{ width: '220px' }}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="All">All Departments</option>
            <option value="Ministry of Road Transport & Highways">MoRTH</option>
            <option value="Ministry of Urban Development">Urban Development</option>
            <option value="Jal Shakti Ministry">Jal Shakti</option>
            <option value="Ministry of Railways">Railways</option>
          </select>
        </div>
      </div>

      {/* Chart 1: Planned vs Actual Physical Progress */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Physical Progress Variance (%) Across Projects</h3>
        <div style={{ height: '340px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={planned_vs_actual} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
              <XAxis dataKey="project_id" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${value}%`]} />
              <Legend />
              <Bar dataKey="planned" name="Planned Physical Progress (%)" fill="#0A9396" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual Physical Progress (%)" fill="#005F73" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Department Budget vs Expenditure & Risk Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Department Financial Allocation */}
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Budget Allocation vs Expenditure by Department</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={department_breakdown}>
                <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => [`₹${val} Cr`]} />
                <Legend />
                <Bar dataKey="budget" name="Approved Budget (Cr)" fill="#005F73" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenditure" name="Expenditure (Cr)" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Risk Distribution */}
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Portfolio Risk Level Distribution</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={risk_distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={45}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {risk_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
