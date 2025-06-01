export type FeedbackStatus = 'pending' | 'taken';

export class Feedback {
  id: string;
  name: string;
  email: string;
  text: string;
  status: FeedbackStatus;
  createdAt: Date;
}
