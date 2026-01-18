export interface FathomCalendarInvitee {
  name: string | null;
  email: string | null;
  email_domain: string | null;
  is_external: boolean;
  matched_speaker_display_name: string | null;
}

export interface FathomRecordedBy {
  name: string;
  email: string;
  email_domain: string;
  team: string | null;
}

export interface FathomTranscriptEntry {
  speaker: {
    display_name: string;
    matched_calendar_invitee_email: string | null;
  };
  text: string;
  timestamp: string;
}

export interface FathomSummary {
  template_name: string | null;
  markdown_formatted: string | null;
}

export interface FathomActionItem {
  description: string;
  user_generated: boolean;
  completed: boolean;
  recording_timestamp: string;
  recording_playback_url: string;
  assignee: {
    name: string | null;
    email: string | null;
    team: string | null;
  };
}

export interface FathomCrmContact {
  name: string;
  email: string;
  record_url: string;
}

export interface FathomCrmCompany {
  name: string;
  record_url: string;
}

export interface FathomCrmDeal {
  name: string;
  amount: number;
  record_url: string;
}

export interface FathomCrmMatches {
  contacts: FathomCrmContact[];
  companies: FathomCrmCompany[];
  deals: FathomCrmDeal[];
  error: string | null;
}

export interface FathomMeeting {
  title: string;
  meeting_title: string | null;
  recording_id: number;
  url: string;
  share_url: string;
  created_at: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  recording_start_time: string;
  recording_end_time: string;
  calendar_invitees_domains_type: 'only_internal' | 'one_or_more_external';
  transcript_language: string;
  calendar_invitees: FathomCalendarInvitee[];
  recorded_by: FathomRecordedBy;
  transcript: FathomTranscriptEntry[] | null;
  default_summary: FathomSummary | null;
  action_items: FathomActionItem[] | null;
  crm_matches: FathomCrmMatches | null;
}

export interface FathomListMeetingsParams {
  calendar_invitees?: string[];
  calendar_invitees_domains?: string[];
  calendar_invitees_domains_type?: 'all' | 'only_internal' | 'one_or_more_external';
  created_after?: string;
  created_before?: string;
  cursor?: string;
  include_action_items?: boolean;
  include_crm_matches?: boolean;
  include_summary?: boolean;
  include_transcript?: boolean;
  recorded_by?: string[];
  teams?: string[];
}

export interface FathomListMeetingsResponse {
  items: FathomMeeting[];
  limit: number | null;
  next_cursor: string | null;
}

export interface FathomSummaryResponse {
  summary: FathomSummary;
}

export interface FathomTranscriptResponse {
  transcript: FathomTranscriptEntry[];
}

export interface FathomTeam {
  id: string;
  name: string;
  member_count?: number;
}

export interface FathomTeamMember {
  id: string;
  name: string;
  email: string;
  team: string | null;
}

export interface FathomTeamsResponse {
  items?: FathomTeam[];
  teams?: FathomTeam[];
}

export interface FathomTeamMembersResponse {
  items?: FathomTeamMember[];
  members?: FathomTeamMember[];
}

export interface FathomWebhook {
  id: string;
  url: string;
  include_transcript: boolean;
  include_summary: boolean;
  include_action_items: boolean;
  include_crm_matches: boolean;
  triggered_for?: 'own' | 'shared' | 'both';
  created_at?: string;
}
