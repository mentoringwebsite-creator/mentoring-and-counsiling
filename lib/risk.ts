export type RiskLevel = 'Low' | 'Medium' | 'High';

export function getRiskLevel(cgpa: number, backlogs: number): RiskLevel {
  if (cgpa < 6 || backlogs > 2) return 'High';
  if (cgpa < 7 || backlogs > 0) return 'Medium';
  return 'Low';
}