export interface OnboardingRecord {
  completed: boolean;
  skipped: boolean;
  businessProfile: Record<string, unknown> | null;
}

export function needsOnboarding(
  record: OnboardingRecord,
  businessName: unknown,
  invoiceCount: number,
  clientCount: number,
) {
  const hasOnboardingProfile = Boolean(record.businessProfile?.businessName);
  return !record.completed
    && !record.skipped
    && !businessName
    && !hasOnboardingProfile
    && invoiceCount === 0
    && clientCount === 0;
}