import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const LEAD_STATUS_VALUES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

const tools: Anthropic.Tool[] = [
  {
    name: "create_lead",
    description:
      "Create a new sales lead/prospect record. Use when the message introduces a new person or company that isn't already an existing deal being discussed.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Contact's full name" },
        company: { type: "string", description: "Company name, if mentioned" },
        email: { type: "string" },
        phone: { type: "string" },
        status: { type: "string", enum: [...LEAD_STATUS_VALUES] },
        value: { type: "number", description: "Estimated deal value in USD" },
        source: {
          type: "string",
          description: "How this lead came in, e.g. referral, cold outreach, website",
        },
        notes: { type: "string", description: "Any other relevant context from the message" },
      },
      required: ["name"],
    },
  },
  {
    name: "create_quote",
    description:
      "Log a quote/proposal sent to (or drafted for) a lead — use when the message mentions pricing, a quote, or a proposal amount.",
    input_schema: {
      type: "object",
      properties: {
        lead_name: {
          type: "string",
          description: "Name or company of the person this quote is for, to match against existing leads",
        },
        amount: { type: "number", description: "Quote amount in USD" },
        status: {
          type: "string",
          enum: ["draft", "sent", "accepted", "declined", "expired"],
          description: "Default to 'sent' if the message implies it was already sent, otherwise 'draft'",
        },
        valid_until: { type: "string", description: "ISO date, if a validity/expiration date is mentioned" },
        notes: { type: "string" },
      },
      required: ["amount"],
    },
  },
  {
    name: "log_activity",
    description:
      "Log a sales activity (call, email, meeting, note, or task/follow-up) — use for updates about interactions with a lead or reminders to follow up.",
    input_schema: {
      type: "object",
      properties: {
        lead_name: {
          type: "string",
          description: "Name or company this activity relates to, to match against existing leads",
        },
        type: { type: "string", enum: ["call", "email", "meeting", "note", "task"] },
        subject: { type: "string", description: "Short one-line summary of the activity" },
        notes: { type: "string", description: "Fuller detail from the message" },
        due_at: {
          type: "string",
          description:
            "ISO 8601 datetime if this is a future follow-up/reminder (resolve relative dates like 'next Tuesday' using the current date given)",
        },
      },
      required: ["subject", "type"],
    },
  },
];

export async function POST(request: Request) {
  const { message } = await request.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI chat is not configured. Set ANTHROPIC_API_KEY to enable it." },
      { status: 501 },
    );
  }

  const client = new Anthropic();
  const today = new Date().toISOString().slice(0, 10);

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    output_config: { effort: "low" },
    system: `You are a data-entry assistant for a sales CRM. Extract a single structured CRM record from the sales rep's spoken/typed update. Today's date is ${today}. Always call exactly one tool with your best-guess structured fields — leave a field out if it isn't mentioned rather than guessing.`,
    tool_choice: { type: "any" },
    tools,
    messages: [{ role: "user", content: message }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );

  if (!toolUse) {
    return NextResponse.json({ error: "Could not understand that update." }, { status: 422 });
  }

  const entity = { create_lead: "lead", create_quote: "quote", log_activity: "activity" }[
    toolUse.name
  ];

  return NextResponse.json({ entity, fields: toolUse.input });
}
