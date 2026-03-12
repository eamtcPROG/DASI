import { getJwtFromRequest } from './common.tools';

describe('getJwtFromRequest', () => {
  it('returns token from a bearer authorization header', () => {
    const token = getJwtFromRequest({
      headers: {
        authorization: 'Bearer abc123',
      },
    });

    expect(token).toBe('abc123');
  });

  it('returns null when authorization header is missing', () => {
    const token = getJwtFromRequest({ headers: {} });

    expect(token).toBeNull();
  });
});
