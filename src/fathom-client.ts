import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  FathomListMeetingsParams,
  FathomListMeetingsResponse,
  FathomMeeting,
  FathomSummaryResponse,
  FathomTranscriptResponse,
  FathomTeam,
  FathomTeamMember,
  FathomWebhook,
  FathomTeamsResponse,
  FathomTeamMembersResponse
} from './types.js';
import { FATHOM_API_BASE_URL, FATHOM_API_TIMEOUT, DEFAULT_TRANSCRIPT_SEARCH_LIMIT } from './constants.js';
import { withRetry, isRateLimitError, getDefaultLookbackDate } from './utils/index.js';

export class FathomClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Fathom API key is required');
    }

    this.client = axios.create({
      baseURL: FATHOM_API_BASE_URL,
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: FATHOM_API_TIMEOUT
    });
  }

  async listMeetings(params?: FathomListMeetingsParams): Promise<FathomListMeetingsResponse> {
    try {
      const response = await this.client.get<FathomListMeetingsResponse>('/meetings', {
        params: this.formatParams(params)
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listMeetingsWithLimit(
    params?: FathomListMeetingsParams,
    maxItems: number = 50
  ): Promise<{ items: FathomMeeting[]; next_cursor: string | null }> {
    const items: FathomMeeting[] = [];
    let cursor: string | undefined = params?.cursor;
    let lastCursor: string | null = null;

    do {
      const response = await this.listMeetings({ ...params, cursor });
      items.push(...response.items);
      lastCursor = response.next_cursor;
      cursor = response.next_cursor ?? undefined;
    } while (cursor && items.length < maxItems);

    const truncated = items.length > maxItems;
    return {
      items: items.slice(0, maxItems),
      next_cursor: truncated || cursor ? lastCursor : null
    };
  }

  async getMeetingSummary(recordingId: number): Promise<FathomSummaryResponse> {
    try {
      const response = await this.client.get<FathomSummaryResponse>(`/recordings/${recordingId}/summary`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getMeetingTranscript(recordingId: number): Promise<FathomTranscriptResponse> {
    try {
      const response = await this.client.get<FathomTranscriptResponse>(`/recordings/${recordingId}/transcript`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchMeetings(params: {
    searchTerm: string;
    searchSummary?: boolean;
    searchActionItems?: boolean;
    searchTranscript?: boolean;
    transcriptSearchLimit?: number;
    returnSummary?: boolean;
    returnActionItems?: boolean;
    returnTranscript?: boolean;
    returnCrmMatches?: boolean;
    createdAfter?: string;
    createdBefore?: string;
    calendarInvitees?: string[];
    calendarInviteesDomains?: string[];
    calendarInviteesDomainsType?: 'all' | 'only_internal' | 'one_or_more_external';
    recordedBy?: string[];
    teams?: string[];
    limit?: number;
    scanLimit?: number;
  }): Promise<{ items: FathomMeeting[]; scanned: number; total_pulled: number }> {
    const {
      searchTerm,
      searchSummary = true,
      searchActionItems = false,
      searchTranscript = false,
      transcriptSearchLimit = DEFAULT_TRANSCRIPT_SEARCH_LIMIT,
      returnSummary = false,
      returnActionItems = false,
      returnTranscript = false,
      returnCrmMatches = false,
      createdAfter,
      createdBefore,
      calendarInvitees,
      calendarInviteesDomains,
      calendarInviteesDomainsType,
      recordedBy,
      teams,
      limit = 50,
      scanLimit = 250
    } = params;

    const response = await this.listMeetingsWithLimit({
      include_summary: searchSummary || returnSummary,
      include_action_items: searchActionItems || returnActionItems,
      include_transcript: searchTranscript || returnTranscript,
      include_crm_matches: returnCrmMatches,
      created_after: createdAfter || getDefaultLookbackDate(),
      created_before: createdBefore,
      calendar_invitees: calendarInvitees,
      calendar_invitees_domains: calendarInviteesDomains,
      calendar_invitees_domains_type: calendarInviteesDomainsType,
      recorded_by: recordedBy,
      teams: teams
    }, scanLimit);

    const queryWords = searchTerm
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 0);

    const meetingsToSearch = searchTranscript
      ? response.items.slice(0, transcriptSearchLimit)
      : response.items;

    if (searchTranscript && response.items.length > transcriptSearchLimit) {
      console.error(`[searchMeetings] Limiting transcript search to ${transcriptSearchLimit} meetings (had ${response.items.length})`);
    }

    const matchesAllWords = (haystack: string | null | undefined): boolean => {
      if (!haystack) return false;
      const hay = haystack.toLowerCase();
      return queryWords.every(w => hay.includes(w));
    };

    const filteredMeetings = meetingsToSearch.filter(meeting => {
      if (matchesAllWords(meeting.title) || matchesAllWords(meeting.meeting_title)) {
        return true;
      }

      if (searchSummary && matchesAllWords(meeting.default_summary?.markdown_formatted)) {
        return true;
      }

      if (searchActionItems && meeting.action_items?.some(item => matchesAllWords(item.description))) {
        return true;
      }

      if (searchTranscript && meeting.transcript?.some(entry => matchesAllWords(entry.text))) {
        return true;
      }

      return false;
    });

    return {
      items: filteredMeetings.slice(0, limit),
      scanned: meetingsToSearch.length,
      total_pulled: response.items.length
    };
  }

  async listTeams(): Promise<FathomTeam[]> {
    try {
      const response = await withRetry(
        () => this.client.get<FathomTeamsResponse>('/teams'),
        { shouldRetry: isRateLimitError }
      );
      return response.data.items ?? response.data.teams ?? [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async listTeamMembers(team?: string): Promise<FathomTeamMember[]> {
    try {
      const params = team ? { team } : {};
      const response = await withRetry(
        () => this.client.get<FathomTeamMembersResponse>('/team_members', { params }),
        { shouldRetry: isRateLimitError }
      );
      return response.data.items ?? response.data.members ?? [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createWebhook(params: {
    url: string;
    include_transcript: boolean;
    include_summary: boolean;
    include_action_items: boolean;
    include_crm_matches: boolean;
    triggered_for?: 'own' | 'shared' | 'both';
  }): Promise<FathomWebhook> {
    try {
      const response = await withRetry(
        () => this.client.post<FathomWebhook>('/webhooks', params),
        { shouldRetry: isRateLimitError }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      await withRetry(
        () => this.client.delete(`/webhooks/${webhookId}`),
        { shouldRetry: isRateLimitError }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private formatParams(params?: FathomListMeetingsParams): Record<string, any> {
    if (!params) return {};

    const formatted: Record<string, any> = {};

    if (params.calendar_invitees?.length) {
      formatted['calendar_invitees[]'] = params.calendar_invitees;
    }
    if (params.calendar_invitees_domains?.length) {
      formatted['calendar_invitees_domains[]'] = params.calendar_invitees_domains.map(d => d.toLowerCase());
    }
    if (params.recorded_by?.length) {
      formatted['recorded_by[]'] = params.recorded_by;
    }
    if (params.teams?.length) {
      formatted['teams[]'] = params.teams;
    }

    const arrayParams = ['calendar_invitees', 'calendar_invitees_domains', 'recorded_by', 'teams'];
    Object.entries(params).forEach(([key, value]) => {
      if (!arrayParams.includes(key) && value !== undefined) {
        formatted[key] = value;
      }
    });

    return formatted;
  }

  private handleError(error: unknown): Error {
    if (error instanceof AxiosError) {
      if (error.response?.status === 429) {
        return new Error('Rate limit exceeded. Please try again later.');
      }
      if (error.response?.status === 401) {
        return new Error('Invalid API key. Please check your Fathom API key.');
      }
      if (error.response?.data?.message) {
        return new Error(`Fathom API error: ${error.response.data.message}`);
      }
    }

    return error instanceof Error ? error : new Error('Unknown error occurred');
  }
}
