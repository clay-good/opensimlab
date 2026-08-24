import { describe, expect, it } from 'vitest';
import { releaseChannelFrom } from '../../scripts/check-review-gate';

describe('release channel selection', () => {
  it('defaults to preview and accepts only explicit supported channels', () => {
    expect(releaseChannelFrom([])).toBe('preview');
    expect(releaseChannelFrom(['--release', '--channel=preview'])).toBe('preview');
    expect(releaseChannelFrom(['--release', '--channel=reviewed'])).toBe('reviewed');
    expect(() => releaseChannelFrom(['--channel=alpha'])).toThrow(
      'Unknown release channel "alpha". Expected preview or reviewed.',
    );
  });
});
