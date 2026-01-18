import { FathomClient } from '../fathom-client.js';
import { CreateWebhookParams, DeleteWebhookParams } from './schemas.js';
import { jsonResponse, errorResponse } from '../utils/index.js';

export async function handleCreateWebhook(client: FathomClient, params: CreateWebhookParams) {
  // Validate at least one include option is true (also enforced by Zod refine)
  const hasInclude = params.include_transcript || params.include_summary ||
                     params.include_action_items || params.include_crm_matches;

  if (!hasInclude) {
    return errorResponse("At least one include_* option must be true");
  }

  console.error(`[create_webhook] Creating webhook for URL: ${params.url}`);

  const webhook = await client.createWebhook({
    url: params.url,
    include_transcript: params.include_transcript ?? false,
    include_summary: params.include_summary ?? false,
    include_action_items: params.include_action_items ?? false,
    include_crm_matches: params.include_crm_matches ?? false,
    triggered_for: params.triggered_for
  });

  console.error(`[create_webhook] Created webhook with ID: ${webhook.id}`);

  return jsonResponse({
    success: true,
    webhook
  });
}

export async function handleDeleteWebhook(client: FathomClient, params: DeleteWebhookParams) {
  console.error(`[delete_webhook] Deleting webhook: ${params.webhook_id}`);

  await client.deleteWebhook(params.webhook_id);

  console.error(`[delete_webhook] Deleted webhook: ${params.webhook_id}`);

  return jsonResponse({
    success: true,
    deleted_webhook_id: params.webhook_id
  });
}
