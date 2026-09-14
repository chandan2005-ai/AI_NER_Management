/**
 * NER-SAFE outbound SMS notification service.
 *
 * The platform NEVER reads a user's SMS inbox or message history. This module
 * only sends authorized outbound alerts through a configured gateway.
 *
 * Providers are pluggable and selected by environment configuration. Credentials
 * come from environment variables only — never hardcoded, never sent to the browser.
 */
export interface SmsMessage {
  to: string;
  body: string;
}

export interface SmsResult {
  to: string;
  status: "sent" | "failed";
  provider: string;
  error?: string;
}

export interface SmsProvider {
  readonly name: string;
  readonly configured: boolean;
  send(message: SmsMessage): Promise<SmsResult>;
}

class TwilioProvider implements SmsProvider {
  readonly name = "twilio";
  get configured(): boolean {
    return Boolean(
      process.env["TWILIO_ACCOUNT_SID"] &&
      process.env["TWILIO_AUTH_TOKEN"] &&
      process.env["TWILIO_FROM_NUMBER"],
    );
  }
  async send(message: SmsMessage): Promise<SmsResult> {
    const sid = process.env["TWILIO_ACCOUNT_SID"]!;
    const token = process.env["TWILIO_AUTH_TOKEN"]!;
    const from = process.env["TWILIO_FROM_NUMBER"]!;
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: message.to, From: from, Body: message.body }),
      },
    );
    if (!response.ok) {
      const detail = await response.text();
      console.error(`[sms:twilio] failed [${response.status}]: ${detail}`);
      return {
        to: message.to,
        status: "failed",
        provider: this.name,
        error: `Gateway ${response.status}`,
      };
    }
    return { to: message.to, status: "sent", provider: this.name };
  }
}

class Msg91Provider implements SmsProvider {
  readonly name = "msg91";
  get configured(): boolean {
    return Boolean(process.env["MSG91_AUTH_KEY"] && process.env["MSG91_SENDER_ID"]);
  }
  async send(message: SmsMessage): Promise<SmsResult> {
    const response = await fetch("https://api.msg91.com/api/v2/sendsms", {
      method: "POST",
      headers: {
        authkey: process.env["MSG91_AUTH_KEY"]!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: process.env["MSG91_SENDER_ID"],
        route: "4",
        country: "91",
        sms: [{ message: message.body, to: [message.to.replace(/\D/g, "")] }],
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error(`[sms:msg91] failed [${response.status}]: ${detail}`);
      return {
        to: message.to,
        status: "failed",
        provider: this.name,
        error: `Gateway ${response.status}`,
      };
    }
    return { to: message.to, status: "sent", provider: this.name };
  }
}

/**
 * Simulation provider used while no real gateway is configured. It never claims
 * a real delivery: every result is labelled as simulated in the UI.
 */
class SimulatedProvider implements SmsProvider {
  readonly name = "simulated";
  readonly configured = true;
  async send(message: SmsMessage): Promise<SmsResult> {
    // Deterministic simulated failure for a small share of numbers so the
    // delivery-monitoring UI is honest about failures instead of always green.
    const digits = message.to.replace(/\D/g, "");
    const failing = digits.length > 0 && Number(digits.at(-1)) % 9 === 0;
    if (failing) {
      return {
        to: message.to,
        status: "failed",
        provider: this.name,
        error: "Simulated gateway rejection",
      };
    }
    return { to: message.to, status: "sent", provider: this.name };
  }
}

export function resolveSmsProvider(): SmsProvider {
  const preferred = (process.env["SMS_PROVIDER"] ?? "").toLowerCase();
  const providers: SmsProvider[] = [new TwilioProvider(), new Msg91Provider()];
  const chosen =
    providers.find((p) => p.name === preferred && p.configured) ??
    providers.find((p) => p.configured);
  return chosen ?? new SimulatedProvider();
}

export async function sendBulkSms(messages: SmsMessage[]): Promise<{
  provider: string;
  simulated: boolean;
  results: SmsResult[];
}> {
  const provider = resolveSmsProvider();
  const results: SmsResult[] = [];
  for (const message of messages) {
    try {
      results.push(await provider.send(message));
    } catch (error) {
      console.error("[sms] provider threw", error);
      results.push({
        to: message.to,
        status: "failed",
        provider: provider.name,
        error: "Gateway unreachable",
      });
    }
  }
  return { provider: provider.name, simulated: provider.name === "simulated", results };
}
