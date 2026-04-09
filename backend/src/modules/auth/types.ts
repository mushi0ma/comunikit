export interface SessionInfo {
  id: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  ip: string | null;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
}
