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

export async function handleGetMeetingTranscript(client: FathomClient, params: GetMeetingTranscriptParams) {
  console.error(`[get_meeting_transcript] Fetching transcript for recording_id: ${params.recording_id}`);

  const response = await client.getMeetingTranscript(params.recording_id);

  let formattedTranscript = response.transcript?.map(entry => ({
    speaker: entry.speaker.display_name,
    text: entry.text,
    timestamp: entry.timestamp
  })) ?? [];

  // Apply max_entries limit if specified
  if (params.max_entries && formattedTranscript.length > params.max_entries) {
    formattedTranscript = formattedTranscript.slice(0, params.max_entries);
  }

  return jsonResponse({
    recording_id: params.recording_id,
    transcript: formattedTranscript
  });
}
