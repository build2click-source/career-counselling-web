"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const data = [
  {
    subject: 'Openness',
    A: 85,
    fullMark: 100,
  },
  {
    subject: 'Conscientiousness',
    A: 95,
    fullMark: 100,
  },
  {
    subject: 'Extraversion',
    A: 60,
    fullMark: 100,
  },
  {
    subject: 'Agreeableness',
    A: 78,
    fullMark: 100,
  },
  {
    subject: 'Neuroticism',
    A: 35, // lower is better usually, depending on scale polarity
    fullMark: 100,
  },
];

export default function RadarChartComp() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar name="Candidate" dataKey="A" stroke="#fb6a51" fill="#fb6a51" fillOpacity={0.2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
