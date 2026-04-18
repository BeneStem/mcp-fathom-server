import { zodToJsonSchema } from 'zod-to-json-schema';
import { FathomClient } from '../fathom-client.js';
import {
  ListMeetingsSchema,
  SearchMeetingsSchema,
  GetMeetingSummarySchema,
  GetMeetingTranscriptSchema,
  ListTeamsSchema,
  ListTeamMembersSchema,
  CreateWebhookSchema,
  DeleteWebhookSchema,
  FindPersonSchema
} from './schemas.js';
import { handleListMeetings, handleSearchMeetings } from './meetings.js';
import { handleGetMeetingSummary, handleGetMeetingTranscript } from './recording.js';
import { handleListTeams, handleListTeamMembers } from './teams.js';
import { handleCreateWebhook, handleDeleteWebhook } from './webhooks.js';
import { handleFindPerson } from './people.js';
import { errorResponse } from '../utils/index.js';

export const toolDefinitions = [
  {
    name: "list_meetings",
    description: "List Fathom meetings with optional filters. Returns meeting titles, summaries, dates, and participants. Transcript access requires response_limit=1. Use date_range for quick filtering (today, yesterday, last_week, last_month, last_quarter).",
    inputSchema: zodToJsonSchema(ListMeetingsSchema)
  },
  {
    name: "search_meetings",
    description: "Search meeting titles + summaries by keyword. AND-logic: every word in search_term must appear (case-insensitive substring match). Scans up to max_pages × ~25 meetings (default ~250). Note: this is in-memory filtering on top of /meetings — there is no server-side full-text search in the Fathom API. Use search_action_items / search_transcript to extend scope. Use return_X params to control response fields.",
    inputSchema: zodToJsonSchema(SearchMeetingsSchema)
  },
  {
    name: "get_meeting_summary",
    description: "Get the summary for a specific meeting by recording_id. Use this to fetch a meeting's AI-generated summary.",
    inputSchema: zodToJsonSchema(GetMeetingSummarySchema)
  },
  {
    name: "get_meeting_transcript",
    description: "Get the full transcript for a specific meeting by recording_id. Pass the meeting `url` (from list_meetings) to receive timestamped deep-links — each entry will include a clickable [MM:SS](url?timestamp=N) link to that moment in the recording. Use max_entries to limit transcript size.",
    inputSchema: zodToJsonSchema(GetMeetingTranscriptSchema)
  },
  {
    name: "list_teams",
    description: "List all teams in your Fathom organization. Use this to discover exact team names for filtering in list_meetings.",
    inputSchema: zodToJsonSchema(ListTeamsSchema)
  },
  {
    name: "list_team_members",
    description: "List team members. Optionally filter by team name. Use this to discover who can record meetings.",
    inputSchema: zodToJsonSchema(ListTeamMembersSchema)
  },
  {
    name: "find_person",
    description: "Find a person by name across (1) your team roster and (2) calendar invitees from your recent meetings. Returns name, email, team, and last meeting they appeared in. NOTE: this does NOT search the transcript-speaker index — people who appear only as transcript speakers (not on calendar invites, not on your team) will not be found. For that, use the official Fathom MCP server.",
    inputSchema: zodToJsonSchema(FindPersonSchema)
  },
  {
    name: "create_webhook",
    description: "Create a webhook to receive real-time meeting notifications. At least one include_* option must be true. Webhooks are also visible in Fathom Settings.",
    inputSchema: zodToJsonSchema(CreateWebhookSchema)
  },
  {
    name: "delete_webhook",
    description: "Delete a webhook by its ID.",
    inputSchema: zodToJsonSchema(DeleteWebhookSchema)
  }
];

export async function handleToolCall(
  client: FathomClient,
  name: string,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  try {
    switch (name) {
      case "list_meetings":
        return await handleListMeetings(client, ListMeetingsSchema.parse(args));

      case "search_meetings":
        return await handleSearchMeetings(client, SearchMeetingsSchema.parse(args));

      case "get_meeting_summary":
        return await handleGetMeetingSummary(client, GetMeetingSummarySchema.parse(args));

      case "get_meeting_transcript":
        return await handleGetMeetingTranscript(client, GetMeetingTranscriptSchema.parse(args));

      case "list_teams":
        return await handleListTeams(client, ListTeamsSchema.parse(args));

      case "list_team_members":
        return await handleListTeamMembers(client, ListTeamMembersSchema.parse(args));

      case "find_person":
        return await handleFindPerson(client, FindPersonSchema.parse(args));

      case "create_webhook":
        return await handleCreateWebhook(client, CreateWebhookSchema.parse(args));

      case "delete_webhook":
        return await handleDeleteWebhook(client, DeleteWebhookSchema.parse(args));

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`Error in ${name}:`, errorMessage);
    return errorResponse(errorMessage);
  }
}

export * from './schemas.js';
