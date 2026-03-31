import { getJwtFromRequest, getTimestamp } from './common.tools';

describe('common.tools', () => {
  describe('getJwtFromRequest', () => {
    it('returns null when request or authorization header is missing', () => {
      expect(getJwtFromRequest()).toBeNull();
      expect(getJwtFromRequest({})).toBeNull();
      expect(
        getJwtFromRequest({
          headers: { authorization: 1 as unknown as string },
        }),
      ).toBeNull();
    });

    it('returns null for non-bearer authorization values', () => {
      expect(
        getJwtFromRequest({ headers: { authorization: 'Basic abc123' } }),
      ).toBeNull();
      expect(
        getJwtFromRequest({ headers: { authorization: 'Bearer' } }),
      ).toBeNull();
    });

    it('returns extracted token when header is a valid bearer token', () => {
      expect(
        getJwtFromRequest({ headers: { authorization: 'Bearer my-token' } }),
      ).toBe('my-token');
      expect(
        getJwtFromRequest({
          headers: { authorization: 'bearer lowercase-token' },
        }),
      ).toBe('lowercase-token');
    });
  });

  describe('getTimestamp', () => {
    it('returns a unix timestamp in seconds', () => {
      const nowMs = Date.now();
      const timestamp = getTimestamp();

      expect(timestamp).toBeGreaterThanOrEqual(
        Math.floor((nowMs - 1000) / 1000),
      );
      expect(timestamp).toBeLessThanOrEqual(Math.floor((nowMs + 1000) / 1000));
      expect(Number.isInteger(timestamp)).toBe(true);
    });
  });
});
