export type HackathonStatus = 'Active' | 'Upcoming' | 'Ended' | 'Draft';

export interface Hackathon {
  id: string;
  name: string;
  status: HackathonStatus;
  regCloseDate: string;
  currentRound: string;
  interested: number;
  registered: number;
  lastUpdated: string;
}

export interface User {
  id: string;
  name: string;
  role: 'Faculty' | 'Student' | 'Admin';
  department?: string;
}
