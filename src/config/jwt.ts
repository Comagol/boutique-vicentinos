export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: '1h',
  algorithm: 'HS256' as const
};

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if(!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}