export const VERIFICATION_FEATURE = 'verification';
export interface VerificationState {
  id: string;
  userId: string;
  documentType: string;
  status: string;
}
