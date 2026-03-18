export const getJwtFromRequest = (req?: {
  headers?: Record<string, string | string[] | undefined>;
}): string | null => {
  const authHeader = req?.headers?.['authorization'];
  if (typeof authHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
};
