"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function StudentCharts({ cgpaData, attendanceData }: { cgpaData: Array<{ sem: string; cgpa: number }>; attendanceData: Array<{ name: string; attendance: number }> }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-portal-line bg-white p-5 shadow-[0_12px_32px_rgba(15,44,34,0.06)]">
        <h3 className="mb-4 text-lg font-semibold">CGPA Progress</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cgpaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 101, 93, 0.18)" />
              <XAxis dataKey="sem" stroke="#60756d" />
              <YAxis stroke="#60756d" domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="cgpa" stroke="#1c5644" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-3xl border border-portal-line bg-white p-5 shadow-[0_12px_32px_rgba(15,44,34,0.06)]">
        <h3 className="mb-4 text-lg font-semibold">Attendance Trend</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 101, 93, 0.18)" />
              <XAxis dataKey="name" stroke="#60756d" />
              <YAxis stroke="#60756d" domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="attendance" fill="#d47b10" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}