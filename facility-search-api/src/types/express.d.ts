import { User } from '../../assets/auth';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
