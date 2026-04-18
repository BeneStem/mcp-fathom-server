export const FATHOM_API_BASE_URL = 'https://api.fathom.ai/external/v1';
export const FATHOM_API_TIMEOUT = 30000;

export const DEFAULT_RESPONSE_LIMIT = 50;
export const DEFAULT_TRANSCRIPT_SEARCH_LIMIT = 5;
export const DEFAULT_DATE_LOOKBACK_DAYS = 30;

export const MAX_TRANSCRIPT_SEARCH_LIMIT = 20;
export const MAX_RESPONSE_LIMIT = 100;

export const SERVER_NAME = 'mcp-fathom-server';
export const SERVER_VERSION = '1.0.0';

export const SERVER_INSTRUCTIONS = `Fathom meeting recorder integration. All read-only tools plus webhook lifecycle management.

SCOPE: This server is authenticated with a user-scoped API key. Every tool call returns only meetings the authenticated user personally recorded — there is no "anyone" / org-wide scope. Do not pretend otherwise.

GROUNDING: Never answer factual questions about what was said, decided, or described in a meeting without first calling tools. Do not infer meeting content from memory or titles. Any claim about "what X said" must come from a get_meeting_transcript call.

TOOL COMPOSITION:
- Always call list_teams before passing a value to the teams filter — do not guess team names.
- Always call list_team_members before assuming who is on a team.
- Always call list_meetings (or search_meetings) before get_meeting_summary / get_meeting_transcript — recording_id comes from those.
- Pass the meeting url field through to get_meeting_transcript to receive timestamped deep-link markdown in the response.

FIND_PERSON HONESTY: This server's find_person aggregates from your team roster (list_team_members) plus calendar invitees seen in your recent meetings. It does NOT search the transcript-speaker index — people who only appear as transcript speakers (not on the calendar invite, not on your team) will not be found. Tell the user when results may be incomplete for that reason.

DATE FILTERING: Prefer the date_range shortcut ('today', 'yesterday', 'last_week', 'last_month', 'last_quarter') over hand-crafting ISO timestamps for common ranges.

RESPONSE SIZE: Use brief_mode=true when listing many meetings just for IDs/titles. include_transcript on list_meetings requires response_limit=1 — for arbitrary transcripts, call get_meeting_transcript per recording_id.

WEBHOOKS: This server can create and delete webhooks (the official Fathom MCP cannot). Confirm with the user before creating a webhook — it sends real meeting data to the URL you register.`;
