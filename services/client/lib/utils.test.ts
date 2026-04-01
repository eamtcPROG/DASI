import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
  it('merges tailwind-conflicting classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('joins independent classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });
});
