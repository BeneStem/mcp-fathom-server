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
  DeleteWebhookSchema
} from './schemas.js';
import { handleListMeetings, handleSearchMeetings } from './meetings.js';
import { handleGetMeetingSummary, handleGetMeetingTranscript } from './recording.js';
import { handleListTeams, handleListTeamMembers } from './teams.js';
import { handleCreateWebhook, handleDeleteWebhook } from './webhooks.js';
import { errorResponse } from '../utils/index.js';

export const toolDefinitions = [
  {
    name: "list_meetings",
    description: "List Fathom meetings with optional filters. Returns meeting titles, summaries, dates, and participants. Transcript access requires response_limit=1. Use date_range for quick filtering (today, yesterday, last_week, last_month, last_quarter).",
    inputSchema: zodToJsonSchema(ListMeetingsSchema)
  },
  {
    name: "search_meetings",
    description: "Search for meetings containing keywords. By default searches titles only. Use search_X params to extend search scope, and return_X params to control response fields. Use brief_mode=true for minimal token usage.",
    inputSchema: zodToJsonSchema(SearchMeetingsSchema)
  },
  {
    name: "get_meeting_summary",
    description: "Get the summary for a specific meeting by recording_id. Use this to fetch a meeting's AI-generated summary.",
    inputSchema: zodToJsonSchema(GetMeetingSummarySchema)
  },
  {
    name: "get_meeting_transcript",
    description: "Get the full transcript for a specific meeting by recording_id. Use max_entries to limit transcript size.",
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
