import { BookingStatus } from '@repo/shared-types';

describe('Booking Lifecycle State Machine & Invariants (Phase 12 QA)', () => {
  // Pure State Machine Definition for Platform Invariants
  interface BookingStateTransition {
    from: BookingStatus;
    action: 'ACCEPT' | 'REJECT' | 'CONFIRM' | 'CANCEL' | 'CONFLICT_CLOSE';
    to: BookingStatus;
  }

  const allowedTransitions: BookingStateTransition[] = [
    { from: BookingStatus.PENDING, action: 'ACCEPT', to: BookingStatus.ACCEPTED },
    { from: BookingStatus.PENDING, action: 'REJECT', to: BookingStatus.REJECTED },
    { from: BookingStatus.PENDING, action: 'CANCEL', to: BookingStatus.CANCELLED },
    { from: BookingStatus.ACCEPTED, action: 'CONFIRM', to: BookingStatus.CONFIRMED },
    { from: BookingStatus.ACCEPTED, action: 'CANCEL', to: BookingStatus.CANCELLED },
    { from: BookingStatus.ACCEPTED, action: 'CONFLICT_CLOSE', to: BookingStatus.CLOSED_CONFLICT },
  ];

  function canTransition(
    current: BookingStatus,
    action: 'ACCEPT' | 'REJECT' | 'CONFIRM' | 'CANCEL' | 'CONFLICT_CLOSE',
  ): boolean {
    return allowedTransitions.some(t => t.from === current && t.action === action);
  }

  function getNextState(
    current: BookingStatus,
    action: 'ACCEPT' | 'REJECT' | 'CONFIRM' | 'CANCEL' | 'CONFLICT_CLOSE',
  ): BookingStatus {
    const transition = allowedTransitions.find(t => t.from === current && t.action === action);
    if (!transition) {
      throw new Error(`Invalid state transition: Cannot perform ${action} from state ${current}`);
    }
    return transition.to;
  }

  describe('State Machine Transitions', () => {
    it('should allow valid happy path: PENDING -> ACCEPTED -> CONFIRMED', () => {
      let state = BookingStatus.PENDING;
      expect(canTransition(state, 'ACCEPT')).toBe(true);

      state = getNextState(state, 'ACCEPT');
      expect(state).toBe(BookingStatus.ACCEPTED);
      expect(canTransition(state, 'CONFIRM')).toBe(true);

      state = getNextState(state, 'CONFIRM');
      expect(state).toBe(BookingStatus.CONFIRMED);
    });

    it('should allow student direct cancellation from PENDING or ACCEPTED', () => {
      expect(canTransition(BookingStatus.PENDING, 'CANCEL')).toBe(true);
      expect(getNextState(BookingStatus.PENDING, 'CANCEL')).toBe(BookingStatus.CANCELLED);

      expect(canTransition(BookingStatus.ACCEPTED, 'CANCEL')).toBe(true);
      expect(getNextState(BookingStatus.ACCEPTED, 'CANCEL')).toBe(BookingStatus.CANCELLED);
    });

    it('should transition competing requests to CLOSED_CONFLICT upon portion confirmation', () => {
      expect(canTransition(BookingStatus.ACCEPTED, 'CONFLICT_CLOSE')).toBe(true);
      expect(getNextState(BookingStatus.ACCEPTED, 'CONFLICT_CLOSE')).toBe(
        BookingStatus.CLOSED_CONFLICT,
      );
    });

    it('should strictly prevent invalid transitions from terminal states', () => {
      const terminalStates = [
        BookingStatus.CONFIRMED,
        BookingStatus.REJECTED,
        BookingStatus.CANCELLED,
        BookingStatus.CLOSED_CONFLICT,
      ];

      for (const terminal of terminalStates) {
        expect(canTransition(terminal, 'ACCEPT')).toBe(false);
        expect(canTransition(terminal, 'CONFIRM')).toBe(false);
        expect(() => getNextState(terminal, 'CONFIRM')).toThrow();
      }
    });
  });

  describe('Quota & Limit Invariants (BR-BKG-001 & BR-BKG-002)', () => {
    const MAX_OPEN_REQUESTS_PER_STUDENT = 3;

    function assertCanSubmitBookingRequest(
      existingRequests: Array<{ status: BookingStatus }>,
    ): boolean {
      const openRequests = existingRequests.filter(r =>
        [BookingStatus.PENDING, BookingStatus.ACCEPTED].includes(r.status),
      );
      if (openRequests.length >= MAX_OPEN_REQUESTS_PER_STUDENT) {
        throw new Error(
          `BR-BKG-001 Violated: Student cannot have more than ${MAX_OPEN_REQUESTS_PER_STUDENT} active requests`,
        );
      }

      const hasConfirmed = existingRequests.some(r => r.status === BookingStatus.CONFIRMED);
      if (hasConfirmed) {
        throw new Error('BR-BKG-002 Violated: Student already has a confirmed booking');
      }

      return true;
    }

    it('should allow student to submit requests up to the 3-request limit', () => {
      const userRequests = [{ status: BookingStatus.PENDING }, { status: BookingStatus.ACCEPTED }];
      expect(assertCanSubmitBookingRequest(userRequests)).toBe(true);
    });

    it('should strictly reject 4th booking request when 3 are already open (BR-BKG-001)', () => {
      const userRequests = [
        { status: BookingStatus.PENDING },
        { status: BookingStatus.PENDING },
        { status: BookingStatus.ACCEPTED },
      ];
      expect(() => assertCanSubmitBookingRequest(userRequests)).toThrow(/BR-BKG-001/);
    });

    it('should allow submitting a new request after an open request is cancelled or rejected (quota churn)', () => {
      const userRequests = [
        { status: BookingStatus.PENDING },
        { status: BookingStatus.ACCEPTED },
        { status: BookingStatus.CANCELLED }, // Terminal, frees quota
      ];
      expect(assertCanSubmitBookingRequest(userRequests)).toBe(true);
    });

    it('should strictly prevent student from booking if they already have a CONFIRMED booking (BR-BKG-002)', () => {
      const userRequests = [{ status: BookingStatus.CONFIRMED }];
      expect(() => assertCanSubmitBookingRequest(userRequests)).toThrow(/BR-BKG-002/);
    });
  });
});
