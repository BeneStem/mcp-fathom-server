import { FathomClient } from '../fathom-client.js';
import { FindPersonParams } from './schemas.js';
import { jsonResponse, getDefaultLookbackDate } from '../utils/index.js';

interface PersonMatch {
  name: string;
  email: string | null;
  team: string | null;
  source: 'team_member' | 'invitee';
  is_external?: boolean;
  last_meeting?: {
    recording_id: number;
    title: string | null;
    date: string;
  };
}

export async function handleFindPerson(client: FathomClient, params: FindPersonParams) {
  const needle = params.name.toLowerCase().trim();
  if (!needle) {
    return jsonResponse({ matches: [], note: 'Empty name; nothing to search.' });
  }

  console.error(`[find_person] Searching for "${params.name}" across team_members + ${params.scan_pages} pages of recent meetings`);

  const [teamMembers, meetingsResult] = await Promise.all([
    client.listTeamMembers().catch(err => {
      console.error('[find_person] listTeamMembers failed:', err.message);
      return [];
    }),
    client.listMeetingsWithLimit(
      { created_after: getDefaultLookbackDate(params.lookback_days) },
      params.scan_pages * 25
    )
  ]);

  const matches = new Map<string, PersonMatch>();

  for (const member of teamMembers) {
    if (member.name?.toLowerCase().includes(needle)) {
      const key = (member.email ?? member.name).toLowerCase();
      matches.set(key, {
        name: member.name,
        email: member.email,
        team: member.team,
        source: 'team_member'
      });
    }
  }

  for (const meeting of meetingsResult.items) {
    for (const invitee of meeting.calendar_invitees ?? []) {
      if (!invitee.name) continue;
      if (!invitee.name.toLowerCase().includes(needle)) continue;
      const key = (invitee.email ?? invitee.name).toLowerCase();
      const existing = matches.get(key);
      const meetingRef = {
        recording_id: meeting.recording_id,
        title: meeting.title || meeting.meeting_title,
        date: meeting.scheduled_start_time || meeting.created_at
      };

      if (!existing) {
        matches.set(key, {
          name: invitee.name,
          email: invitee.email,
          team: null,
          source: 'invitee',
          is_external: invitee.is_external,
          last_meeting: meetingRef
        });
      } else if (existing.source === 'invitee' && !existing.last_meeting) {
        existing.last_meeting = meetingRef;
      }
    }
  }

  const result = Array.from(matches.values()).sort((a, b) => {
    if (a.source !== b.source) return a.source === 'team_member' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return jsonResponse({
    query: params.name,
    matches: result,
    scanned_meetings: meetingsResult.items.length,
    sources_checked: ['team_members', 'recent_meeting_invitees'],
    limitation: 'This search covers your team roster and calendar invitees from your recent meetings only. People who only appear as transcript speakers (not on the calendar invite, not on your team) will not be found here.'
  });
}
