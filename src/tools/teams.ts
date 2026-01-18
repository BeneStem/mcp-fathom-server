import { FathomClient } from '../fathom-client.js';
import { ListTeamsParams, ListTeamMembersParams } from './schemas.js';
import { jsonResponse } from '../utils/index.js';

export async function handleListTeams(client: FathomClient, _params: ListTeamsParams) {
  console.error(`[list_teams] Fetching teams`);

  const teams = await client.listTeams();

  console.error(`[list_teams] Got ${teams.length} teams`);

  return jsonResponse({
    count: teams.length,
    teams
  });
}

export async function handleListTeamMembers(client: FathomClient, params: ListTeamMembersParams) {
  console.error(`[list_team_members] Fetching team members${params.team ? ` for team: ${params.team}` : ''}`);

  const members = await client.listTeamMembers(params.team);

  console.error(`[list_team_members] Got ${members.length} team members`);

  return jsonResponse({
    count: members.length,
    team: params.team ?? 'all',
    members
  });
}
