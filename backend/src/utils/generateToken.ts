import jwt from 'jsonwebtoken';

let cachedTokens: Record<string, string> = {};

export const generateToken = (userId: string): string => {
  if (cachedTokens[userId]) {
    return cachedTokens[userId];
  }
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  });

  cachedTokens[userId] = token;
  return token;
};
