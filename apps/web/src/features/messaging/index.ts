export const MESSAGING_FEATURE = 'messaging';
export interface ConversationState {
  id: string;
  propertyId: string;
  studentId: string;
  ownerId: string;
  lastMessageSnippet?: string;
}
