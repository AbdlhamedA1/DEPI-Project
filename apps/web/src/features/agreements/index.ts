export const AGREEMENTS_FEATURE = 'agreements';
export interface AgreementState {
  id: string;
  bookingRequestId: string;
  confirmedAt?: string;
  status: string;
}
