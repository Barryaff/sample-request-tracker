import { WebClient } from "@slack/web-api";
import { RequestStatus } from "@/generated/prisma/client";
import { STATUS_CONFIG } from "@/lib/constants";

const slack = process.env.SLACK_BOT_TOKEN
  ? new WebClient(process.env.SLACK_BOT_TOKEN)
  : null;

interface SlackNotificationParams {
  requestDisplayId: string;
  customerName: string;
  productName: string;
  previousStatus: RequestStatus;
  newStatus: RequestStatus;
  actorName: string;
  actionUrl: string;
  dmSlackUserId?: string;
}

export async function sendSlackNotification(params: SlackNotificationParams) {
  if (!slack) {
    console.warn("Slack not configured — skipping notification");
    return;
  }

  const channelId = process.env.SLACK_CHANNEL_ID;
  if (!channelId) {
    console.warn("SLACK_CHANNEL_ID not set — skipping notification");
    return;
  }

  const fromLabel = STATUS_CONFIG[params.previousStatus]?.label ?? params.previousStatus;
  const toLabel = STATUS_CONFIG[params.newStatus]?.label ?? params.newStatus;

  const message = `[${params.requestDisplayId}] ${params.customerName} — ${params.productName} → *${toLabel}* by ${params.actorName}`;

  // Post to channel
  try {
    await slack.chat.postMessage({
      channel: channelId,
      text: message,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${params.requestDisplayId}*\n${params.customerName} — ${params.productName}\n${fromLabel} → *${toLabel}*\nBy: ${params.actorName}`,
          },
          accessory: {
            type: "button",
            text: { type: "plain_text", text: "View Request" },
            url: params.actionUrl,
          },
        },
      ],
    });
  } catch (err) {
    console.error("Failed to post Slack channel message:", err);
  }

  // Send DM if a specific user should be notified
  if (params.dmSlackUserId) {
    try {
      await slack.chat.postMessage({
        channel: params.dmSlackUserId,
        text: `${message}\nAction required: ${params.actionUrl}`,
      });
    } catch (err) {
      console.error("Failed to send Slack DM:", err);
    }
  }
}
