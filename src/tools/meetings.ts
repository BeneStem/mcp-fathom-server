import { FathomClient } from '../fathom-client.js';
import { ListMeetingsParams, SearchMeetingsParams } from './schemas.js';
import { formatMeetings, jsonResponse, errorResponse, getDateRange } from '../utils/index.js';

export async function handleListMeetings(client: FathomClient, params: ListMeetingsParams) {
  const explicitLimit = params.response_limit;
  const responseLimit = explicitLimit ?? (params.max_pages ? params.max_pages * 25 : 50);

  // Safeguard: include_transcript requires response_limit=1
  if (params.include_transcript && responseLimit > 1) {
    return errorResponse(
      "When include_transcript=true, response_limit must be 1 to prevent large responses. Set response_limit=1 or use get_meeting_transcript instead."
    );
  }

  // Apply date range shortcut if provided
  let createdAfter = params.created_after;
  let createdBefore = params.created_before;
  if (params.date_range) {
    const range = getDateRange(params.date_range);
    createdAfter = range.created_after;
    createdBefore = range.created_before;
  }

  const {
    response_limit: _,
    max_pages: ___,
    date_range: __,
    brief_mode,
    max_summary_length,
    max_transcript_entries,
    ...apiParams
  } = params;

  console.error(`[list_meetings] Fetching meetings with response_limit:`, responseLimit);

  const { items: meetings, next_cursor } = await client.listMeetingsWithLimit(
    { ...apiParams, created_after: createdAfter, created_before: createdBefore },
    responseLimit
  );

  console.error(`[list_meetings] Got ${meetings.length} meetings (next_cursor: ${next_cursor ? 'yes' : 'none'})`);

  const formattedMeetings = formatMeetings(meetings, {
    includeSummary: params.include_summary,
    includeActionItems: params.include_action_items,
    includeTranscript: params.include_transcript,
    includeCrmMatches: params.include_crm_matches,
    briefMode: brief_mode,
    maxSummaryLength: max_summary_length,
    maxTranscriptEntries: max_transcript_entries
  });

  const result: Record<string, unknown> = {
    count: meetings.length,
    meetings: formattedMeetings
  };
  if (next_cursor) result.next_cursor = next_cursor;
  return jsonResponse(result);
}

export async function handleSearchMeetings(client: FathomClient, params: SearchMeetingsParams) {
  const responseLimit = params.response_limit || 50;

  // Safeguard: return_transcript requires response_limit=1
  if (params.return_transcript && responseLimit > 1) {
    return errorResponse(
      "When return_transcript=true, response_limit must be 1 to prevent large responses. Set response_limit=1 or use get_meeting_transcript instead."
    );
  }

  // Apply date range shortcut if provided
  let createdAfter = params.created_after;
  let createdBefore = params.created_before;
  if (params.date_range) {
    const range = getDateRange(params.date_range);
    createdAfter = range.created_after;
    createdBefore = range.created_before;
  }

  console.error(`[search_meetings] Searching for: "${params.query}" (search: summary=${params.search_summary}, action_items=${params.search_action_items}, transcript=${params.search_transcript}) (return: summary=${params.return_summary}, action_items=${params.return_action_items}, transcript=${params.return_transcript}, crm=${params.return_crm_matches})`);

  const scanLimit = (params.max_pages ?? 10) * 25;

  const { items: meetings, scanned, total_pulled } = await client.searchMeetings({
    searchTerm: params.query,
    searchSummary: params.search_summary,
    searchActionItems: params.search_action_items,
    searchTranscript: params.search_transcript,
    transcriptSearchLimit: params.transcript_search_limit,
    returnSummary: params.return_summary,
    returnActionItems: params.return_action_items,
    returnTranscript: params.return_transcript,
    returnCrmMatches: params.return_crm_matches,
    createdAfter,
    createdBefore,
    calendarInvitees: params.calendar_invitees,
    calendarInviteesDomains: params.calendar_invitees_domains,
    calendarInviteesDomainsType: params.calendar_invitees_domains_type,
    recordedBy: params.recorded_by,
    teams: params.teams,
    limit: responseLimit,
    scanLimit
  });

  console.error(`[search_meetings] Found ${meetings.length} matching meetings (scanned ${scanned} / pulled ${total_pulled})`);

  const formattedMeetings = formatMeetings(meetings, {
    includeSummary: params.return_summary,
    includeActionItems: params.return_action_items,
    includeTranscript: params.return_transcript,
    includeCrmMatches: params.return_crm_matches,
    briefMode: params.brief_mode,
    maxSummaryLength: params.max_summary_length,
    maxTranscriptEntries: params.max_transcript_entries
  });

  const result: Record<string, unknown> = {
    query: params.query,
    match_logic: 'AND across all whitespace-separated words, case-insensitive',
    total_found: meetings.length,
    scanned_meetings: scanned,
    meetings: formattedMeetings
  };

  if (meetings.length === 0) {
    result.suggestion = `No meetings found across ${scanned} scanned. Try: broader date_range, fewer search words, or increase max_pages.`;
  }

  return jsonResponse(result);
}
