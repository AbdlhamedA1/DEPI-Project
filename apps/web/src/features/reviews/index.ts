export const REVIEWS_FEATURE = 'reviews';
export interface ReviewState {
  id: string;
  propertyId: string;
  studentId: string;
  rating: number;
  comment: string;
}
