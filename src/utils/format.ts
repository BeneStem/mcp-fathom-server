import { FathomMeeting, FathomCrmMatches } from '../types.js';
import { calculateDurationMinutes } from './date.js';

export interface FormattedMeeting {
  title: string | null;
  recording_id: number;
  date: string;
  duration_minutes: number | null;
  url: string;
  attendees: Array<{
    name: string | null;
    email: string | null;
    is_external: boolean;
  }>;
  recorded_by: {
    name: string;
    email: string;
    team: string | null;
  } | null;
  summary?: string | null;
  action_items?: Array<{
    description: string;
    completed: boolean;
    assignee: string | null;
    timestamp: string;
  }> | null;
  transcript?: Array<{
    speaker: string;
    text: string;
    timestamp: string;
  }> | null;
  crm_matches?: {
    contacts: FathomCrmMatches['contacts'];
    companies: FathomCrmMatches['companies'];
    deals: FathomCrmMatches['deals'];
  } | null;
}

export interface FormatOptions {
  includeSummary?: boolean;
  includeActionItems?: boolean;
  includeTranscript?: boolean;
  includeCrmMatches?: boolean;
  briefMode?: boolean;
  maxSummaryLength?: number;
  maxTranscriptEntries?: number;
}

export function formatMeeting(meeting: FathomMeeting, options: FormatOptions = {}): FormattedMeeting | Partial<FormattedMeeting> {
  const {
    includeSummary = false,
    includeActionItems = false,
    includeTranscript = false,
    includeCrmMatches = false,
    briefMode = false,
    maxSummaryLength,
    maxTranscriptEntries
  } = options;

  if (briefMode) {
    return {
      title: meeting.title || meeting.meeting_title,
      recording_id: meeting.recording_id,
      date: meeting.scheduled_start_time || meeting.created_at,
      url: meeting.share_url || meeting.url
    };
  }

  const duration = calculateDurationMinutes(
    meeting.recording_start_time,
    meeting.recording_end_time
  );

  const formatted: FormattedMeeting = {
    title: meeting.title || meeting.meeting_title,
    recording_id: meeting.recording_id,
    date: meeting.scheduled_start_time || meeting.created_at,
    duration_minutes: duration,
    url: meeting.share_url || meeting.url,
    attendees: meeting.calendar_invitees?.map(inv => ({
      name: inv.name,
      email: inv.email,
      is_external: inv.is_external
    })) ?? [],
    recorded_by: meeting.recorded_by ? {
      name: meeting.recorded_by.name,
      email: meeting.recorded_by.email,
      team: meeting.recorded_by.team
    } : null
  };

  if (includeSummary) {
    let summary = meeting.default_summary?.markdown_formatted ?? null;
    if (summary && maxSummaryLength && summary.length > maxSummaryLength) {
      summary = summary.slice(0, maxSummaryLength) + '...';
    }
    formatted.summary = summary;
  }

  if (includeActionItems && meeting.action_items) {
    formatted.action_items = meeting.action_items.map(item => ({
      description: item.description,
      completed: item.completed,
      assignee: item.assignee?.email || item.assignee?.name || null,
      timestamp: item.recording_timestamp
    }));
  }

  if (includeTranscript && meeting.transcript) {
    let transcript = meeting.transcript.map(entry => ({
      speaker: entry.speaker.display_name,
      text: entry.text,
      timestamp: entry.timestamp
    }));
    if (maxTranscriptEntries && transcript.length > maxTranscriptEntries) {
      transcript = transcript.slice(0, maxTranscriptEntries);
    }
    formatted.transcript = transcript;
  }

  if (includeCrmMatches && meeting.crm_matches) {
    formatted.crm_matches = {
      contacts: meeting.crm_matches.contacts,
      companies: meeting.crm_matches.companies,
      deals: meeting.crm_matches.deals
    };
  }

  return formatted;
}

export function formatMeetings(meetings: FathomMeeting[], options: FormatOptions = {}): Array<FormattedMeeting | Partial<FormattedMeeting>> {
  return meetings.map(meeting => formatMeeting(meeting, options));
}

export function jsonResponse(data: unknown) {
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify(data, null, 2)
    }]
  };
}

export function errorResponse(message: string) {
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({ error: message }, null, 2)
    }],
    isError: true
  };
}
