import 'express';

interface JwtUser {
  id: number;
  email: string;
  username: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export { JwtUser };
