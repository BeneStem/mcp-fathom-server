import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { formatMeeting } from '../src/utils/format.js';
import type { FathomMeeting } from '../src/types.js';

function meeting(overrides: Partial<FathomMeeting>): FathomMeeting {
  return {
    title: 'Test',
    meeting_title: null,
    recording_id: 1,
    url: 'https://app.fathom.video/calls/123',
    share_url: 'https://fathom.video/share/abc',
    created_at: '2026-01-01T00:00:00Z',
    scheduled_start_time: '2026-01-01T00:00:00Z',
    scheduled_end_time: '2026-01-01T01:00:00Z',
    recording_start_time: '2026-01-01T00:00:00Z',
    recording_end_time: '2026-01-01T01:00:00Z',
    calendar_invitees_domains_type: 'only_internal',
    transcript_language: 'en',
    calendar_invitees: [],
    recorded_by: { name: 'You', email: 'you@example.com', email_domain: 'example.com', team: null },
    transcript: null,
    default_summary: null,
    action_items: null,
    crm_matches: null,
    ...overrides
  };
}

describe('formatMeeting URL preference', () => {
  it('prefers share_url over url when both are present', () => {
    const result = formatMeeting(meeting({}));
    assert.equal(result.url, 'https://fathom.video/share/abc');
  });

  it('falls back to url when share_url is missing', () => {
    const result = formatMeeting(meeting({ share_url: '' as unknown as string }));
    assert.equal(result.url, 'https://app.fathom.video/calls/123');
  });

  it('uses share_url in brief mode too', () => {
    const result = formatMeeting(meeting({}), { briefMode: true });
    assert.equal(result.url, 'https://fathom.video/share/abc');
  });

  it('brief mode falls back to url when share_url empty', () => {
    const result = formatMeeting(meeting({ share_url: '' as unknown as string }), { briefMode: true });
    assert.equal(result.url, 'https://app.fathom.video/calls/123');
  });
});
