import { FathomClient } from '../fathom-client.js';
import { GetMeetingSummaryParams, GetMeetingTranscriptParams } from './schemas.js';
import { jsonResponse } from '../utils/index.js';

export async function handleGetMeetingSummary(client: FathomClient, params: GetMeetingSummaryParams) {
  console.error(`[get_meeting_summary] Fetching summary for recording_id: ${params.recording_id}`);

  const response = await client.getMeetingSummary(params.recording_id);

  return jsonResponse({
    recording_id: params.recording_id,
    summary: response.summary?.markdown_formatted ?? null,
    template_name: response.summary?.template_name ?? null
  });
}

function timestampToSeconds(timestamp: string): number | null {
  const parts = timestamp.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

function formatTimestampLabel(timestamp: string): string {
  const secs = timestampToSeconds(timestamp);
  if (secs === null) return timestamp;
  const mm = Math.floor(secs / 60).toString().padStart(2, '0');
  const ss = (secs % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export async function handleGetMeetingTranscript(client: FathomClient, params: GetMeetingTranscriptParams) {
  console.error(`[get_meeting_transcript] Fetching transcript for recording_id: ${params.recording_id}`);

  const response = await client.getMeetingTranscript(params.recording_id);

  let entries = response.transcript ?? [];
  if (params.max_entries && entries.length > params.max_entries) {
    entries = entries.slice(0, params.max_entries);
  }

  const formattedTranscript = entries.map(entry => {
    const base: Record<string, string | null> = {
      speaker: entry.speaker.display_name,
      text: entry.text,
      timestamp: entry.timestamp
    };
    if (params.url) {
      const secs = timestampToSeconds(entry.timestamp);
      if (secs !== null) {
        const sep = params.url.includes('?') ? '&' : '?';
        base.link = `[${formatTimestampLabel(entry.timestamp)}](${params.url}${sep}timestamp=${secs})`;
      }
    }
    return base;
  });

  return jsonResponse({
    recording_id: params.recording_id,
    transcript: formattedTranscript
  });
}
