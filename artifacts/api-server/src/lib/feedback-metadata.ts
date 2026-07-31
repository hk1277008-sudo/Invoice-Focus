export function browserFromUserAgent(userAgent: string) {
  if (/Edg\//i.test(userAgent)) return 'Edge';
  if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) return 'Chrome';
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return 'Safari';
  if (/OPR\//i.test(userAgent)) return 'Opera';
  return 'Other';
}

export function deviceFromUserAgent(userAgent: string) {
  if (/iPad|Tablet/i.test(userAgent)) return 'Tablet';
  if (/Mobile|Android|iPhone/i.test(userAgent)) return 'Mobile';
  return 'Desktop';
}