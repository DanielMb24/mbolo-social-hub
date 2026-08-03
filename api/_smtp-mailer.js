import net from "node:net";
import tls from "node:tls";

const SMTP_TIMEOUT_MS = 15_000;

function smtpConfig() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || user;
  return { host, port, user, pass, from };
}

export function isEmailConfigured() {
  const { host, port, user, pass, from } = smtpConfig();
  return Boolean(host && port && user && pass && from);
}

export async function sendNotificationEmail(to, notification) {
  if (!to || !isEmailConfigured()) return { ok: false, skipped: true };
  const subject = notification.title || "Nouvelle notification MBolo";
  const body = [
    notification.body || "Vous avez une nouvelle notification.",
    "",
    "Connectez-vous à MBolo pour consulter les détails.",
  ].join("\n");
  return sendMail({ to, subject, text: body });
}

export async function sendMail({ to, subject, text }) {
  const config = smtpConfig();
  const client = await connect(config);
  let socket = client;

  try {
    await expect(socket, [220]);
    await command(socket, `EHLO ${config.host}`, [250]);
    if (config.port !== 465) {
      await command(socket, "STARTTLS", [220]);
      socket = await upgradeToTls(socket, config.host);
      await command(socket, `EHLO ${config.host}`, [250]);
    }
    await command(socket, "AUTH LOGIN", [334]);
    await command(socket, Buffer.from(config.user).toString("base64"), [334]);
    await command(socket, Buffer.from(config.pass).toString("base64"), [235]);
    await command(socket, `MAIL FROM:<${config.from}>`, [250]);
    await command(socket, `RCPT TO:<${to}>`, [250, 251]);
    await command(socket, "DATA", [354]);
    await command(socket, buildMessage({ from: config.from, to, subject, text }), [250]);
    await command(socket, "QUIT", [221]).catch(() => undefined);
    return { ok: true };
  } finally {
    socket.destroy();
  }
}

function upgradeToTls(socket, host) {
  return new Promise((resolve, reject) => {
    const secureSocket = tls.connect({ socket, servername: host }, () => resolve(secureSocket));
    secureSocket.setTimeout(SMTP_TIMEOUT_MS);
    secureSocket.once("error", reject);
  });
}

function connect(config) {
  return new Promise((resolve, reject) => {
    const onError = (err) => reject(err);
    const socket = config.port === 465
      ? tls.connect({ host: config.host, port: config.port, servername: config.host }, () => resolve(socket))
      : net.connect({ host: config.host, port: config.port }, () => resolve(socket));
    socket.setTimeout(SMTP_TIMEOUT_MS, () => {
      socket.destroy(new Error("SMTP timeout"));
    });
    socket.once("error", onError);
  });
}

function command(socket, line, codes) {
  const payload = line.includes("\r\n")
    ? `${line}\r\n.\r\n`
    : `${line}\r\n`;
  socket.write(payload);
  return expect(socket, codes);
}

function expect(socket, codes) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("timeout", onTimeout);
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    const onTimeout = () => {
      cleanup();
      reject(new Error("SMTP timeout"));
    };
    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1] || "";
      if (!/^\d{3}\s/.test(last)) return;
      const code = Number(last.slice(0, 3));
      cleanup();
      codes.includes(code)
        ? resolve(buffer)
        : reject(new Error(`SMTP error ${code}`));
    };
    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("timeout", onTimeout);
  });
}

function buildMessage({ from, to, subject, text }) {
  const safeSubject = encodeHeader(subject);
  const safeText = String(text || "").replace(/\r?\n/g, "\r\n");
  return [
    `From: MBolo <${from}>`,
    `To: <${to}>`,
    `Subject: ${safeSubject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    safeText,
  ].join("\r\n");
}

function encodeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(String(value || ""), "utf8").toString("base64")}?=`;
}
