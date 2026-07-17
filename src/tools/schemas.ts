import { z } from 'zod';

const dateRangeSchema = z.enum(['today', 'yesterday', 'last_week', 'last_month', 'last_quarter']);
const calendarInviteesDomainsTypeSchema = z.enum(['all', 'only_internal', 'one_or_more_external']);

const meetingFilterParams = {
  calendar_invitees: z.array(z.string()).optional().describe("Filter by attendee email addresses"),
  calendar_invitees_domains: z.array(z.string()).optional().describe("Filter by company domains (exact match)"),
  calendar_invitees_domains_type: calendarInviteesDomainsTypeSchema.optional().describe("Classify meetings by whether the CALENDAR INVITEE list contains an external domain. NOT the meeting's semantic type (the title's category word) and NOT a Fathom meeting_type. Values: all (default), only_internal (every invitee shares the recorder's domain), one_or_more_external. Caveat: the API derives this from the full calendar invite, including participants not surfaced in calendar_invitees[]; a meeting whose visible invitees are all internal can still be one_or_more_external, so only_internal may drop meetings you consider internal. Omit unless you specifically want the internal/external split."),
  recorded_by: z.array(z.string()).optional().describe("Filter by meeting owner email addresses"),
  teams: z.array(z.string()).optional().describe("Filter by team names"),
};

export const ListMeetingsSchema = z.object({
  ...meetingFilterParams,
  created_after: z.string().optional().describe("Filter meetings created after this date (ISO 8601)"),
  created_before: z.string().optional().describe("Filter meetings created before this date (ISO 8601)"),
  date_range: dateRangeSchema.optional().describe("Shortcut for common date ranges (overrides created_after/before)"),
  cursor: z.string().optional().describe("Pagination cursor from previous response's next_cursor"),
  include_action_items: z.boolean().optional().default(false).describe("Include action items with assignees and completion status"),
  include_crm_matches: z.boolean().optional().default(false).describe("Include CRM contact/company/deal matches"),
  include_summary: z.boolean().optional().default(false).describe("Include meeting summaries"),
  include_transcript: z.boolean().optional().default(false).describe("Include meeting transcript (requires response_limit=1)"),
  response_limit: z.number().optional().default(50).describe("Maximum number of meetings to return (client-side limit, auto-paginates if needed). Preferred over max_pages."),
  max_pages: z.number().min(1).max(20).optional().describe("Alias for compatibility with the official Fathom MCP. If set, sets response_limit to max_pages × 25. Ignored if response_limit is also set."),
  brief_mode: z.boolean().optional().default(false).describe("Return minimal fields only (title, recording_id, date, url)"),
  max_summary_length: z.number().optional().describe("Truncate summaries to N characters"),
  max_transcript_entries: z.number().optional().describe("Limit transcript to N entries"),
});

export const SearchMeetingsSchema = z.object({
  query: z.string().describe("One or more keywords. AND-logic: every whitespace-separated word must appear in the meeting (case-insensitive). Example: 'voiceprint script' matches meetings containing both 'voiceprint' AND 'script'."),
  created_after: z.string().optional().describe("Search meetings after this date (ISO 8601). Default: 30 days ago"),
  created_before: z.string().optional().describe("Search meetings before this date (ISO 8601)"),
  date_range: dateRangeSchema.optional().describe("Shortcut for common date ranges (overrides created_after/before)"),
  max_pages: z.number().min(1).max(20).optional().default(10).describe("Pages to scan (~25 meetings/page). Default 10 ≈ 250 meetings. Higher = deeper search, slower."),
  search_summary: z.boolean().optional().default(true).describe("Search within meeting summaries (default: true — most signal lives here)"),
  search_action_items: z.boolean().optional().default(false).describe("Also search within action items"),
  search_transcript: z.boolean().optional().default(false).describe("Also search within transcripts (slow — caps at transcript_search_limit meetings)"),
  transcript_search_limit: z.number().min(1).max(20).optional().default(5).describe("Max meetings to search transcripts (default: 5, max: 20)"),
  return_summary: z.boolean().optional().default(false).describe("Include summaries in response"),
  return_action_items: z.boolean().optional().default(false).describe("Include action items in response"),
  return_transcript: z.boolean().optional().default(false).describe("Include transcripts in response (requires response_limit=1)"),
  return_crm_matches: z.boolean().optional().default(false).describe("Include CRM data in response"),
  ...meetingFilterParams,
  response_limit: z.number().optional().default(50).describe("Maximum number of matching results to return (client-side cap on filtered results)"),
  brief_mode: z.boolean().optional().default(false).describe("Return minimal fields only"),
  max_summary_length: z.number().optional().describe("Truncate summaries to N characters"),
  max_transcript_entries: z.number().optional().describe("Limit transcript to N entries"),
});

export const GetMeetingSummarySchema = z.object({
  recording_id: z.number().describe("The recording ID from list_meetings or search_meetings")
});

export const GetMeetingTranscriptSchema = z.object({
  recording_id: z.number().describe("The recording ID from list_meetings or search_meetings"),
  url: z.string().optional().describe("Meeting URL from list_meetings. Pass this to get clickable [MM:SS](url?timestamp=N) deep-links per speaker segment."),
  max_entries: z.number().optional().describe("Limit transcript to N entries")
});

export const ListTeamsSchema = z.object({});

export const ListTeamMembersSchema = z.object({
  team: z.string().optional().describe("Filter by team name")
});

export const CreateWebhookSchema = z.object({
  url: z.string().url().describe("Destination URL for webhook events"),
  include_transcript: z.boolean().optional().describe("Include transcript in webhook payload"),
  include_summary: z.boolean().optional().describe("Include summary in webhook payload"),
  include_action_items: z.boolean().optional().describe("Include action items in webhook payload"),
  include_crm_matches: z.boolean().optional().describe("Include CRM matches in webhook payload"),
  triggered_for: z.enum(['own', 'shared', 'both']).optional().describe("Which recordings trigger: own meetings, shared meetings, or both")
}).refine(
  data => data.include_transcript || data.include_summary || data.include_action_items || data.include_crm_matches,
  { message: "At least one include_* option must be true" }
);

export const DeleteWebhookSchema = z.object({
  webhook_id: z.string().describe("ID of the webhook to delete")
});

export const FindPersonSchema = z.object({
  name: z.string().describe("Partial or full name to search for. Case-insensitive substring match."),
  lookback_days: z.number().min(1).max(365).optional().default(90).describe("How many days of recent meetings to scan for calendar invitees. Default 90."),
  scan_pages: z.number().min(1).max(20).optional().default(10).describe("Pages of meetings to scan when collecting invitees (~25/page). Default 10 ≈ 250 meetings.")
});

export type ListMeetingsParams = z.infer<typeof ListMeetingsSchema>;
export type SearchMeetingsParams = z.infer<typeof SearchMeetingsSchema>;
export type GetMeetingSummaryParams = z.infer<typeof GetMeetingSummarySchema>;
export type GetMeetingTranscriptParams = z.infer<typeof GetMeetingTranscriptSchema>;
export type ListTeamsParams = z.infer<typeof ListTeamsSchema>;
export type ListTeamMembersParams = z.infer<typeof ListTeamMembersSchema>;
export type CreateWebhookParams = z.infer<typeof CreateWebhookSchema>;
export type DeleteWebhookParams = z.infer<typeof DeleteWebhookSchema>;
export type FindPersonParams = z.infer<typeof FindPersonSchema>;
