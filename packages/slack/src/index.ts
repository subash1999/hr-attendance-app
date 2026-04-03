// @willdesign-hr/slack — Slack integration (Ack Lambda + SQS Processor)

export {
  classifyChannel,
  buildAttendanceReply,
  buildErrorReply,
  buildGuidebookMessage,
  CHANNEL_PURPOSES,
} from "./events/handlers.js";
export type { ChannelPurpose } from "./events/handlers.js";
