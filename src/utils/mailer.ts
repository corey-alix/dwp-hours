import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

type MailerConfig = {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    senderName: string;
    senderEmail: string;
    allowInvalidTls: boolean;
};

type SendEmailOptions = {
    to: string;
    subject: string;
    text: string;
    html?: string;
};

let cachedTransporter: Transporter | null = null;

export function getMailerConfigFromEnv(): MailerConfig {
    const requiredVars = [
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USER",
        "SMTP_PASS",
        "SENDER_NAME",
        "SENDER_EMAIL"
    ];

    const missing = requiredVars.filter((envVar) => !process.env[envVar]);
    if (missing.length > 0) {
        throw new Error(`Missing required SMTP environment variables: ${missing.join(", ")}`);
    }

    const port = parseInt(process.env.SMTP_PORT as string, 10);
    if (Number.isNaN(port)) {
        throw new Error("SMTP_PORT must be a valid number");
    }

    const allowInvalidTls = process.env.SMTP_TLS_REJECT_UNAUTHORIZED === "false";

    return {
        host: process.env.SMTP_HOST as string,
        port,
        secure: port === 465,
        user: process.env.SMTP_USER as string,
        pass: process.env.SMTP_PASS as string,
        senderName: process.env.SENDER_NAME as string,
        senderEmail: process.env.SENDER_EMAIL as string,
        allowInvalidTls
    };
}

export function createTransporter(config: MailerConfig): Transporter {
    const transportOptions = {
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass
        },
        ...(config.allowInvalidTls && process.env.NODE_ENV !== "production"
            ? { tls: { rejectUnauthorized: false } }
            : {})
    } as SMTPTransport.Options;

    return nodemailer.createTransport(transportOptions);
}

export function getTransporter(): Transporter {
    if (!cachedTransporter) {
        const config = getMailerConfigFromEnv();
        cachedTransporter = createTransporter(config);
    }

    return cachedTransporter;
}

export async function sendEmail(options: SendEmailOptions) {
    const config = getMailerConfigFromEnv();
    const transporter = getTransporter();

    return transporter.sendMail({
        from: `${config.senderName} <${config.senderEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
    });
}

export async function sendMagicLinkEmail(to: string, magicLink: string) {
    const subject = "Your magic login link";
    const text = `Use the following link to sign in:\n\n${magicLink}\n\nThis link expires in 1 hour.`;
    const html = `<p>Use the following link to sign in:</p><p><a href="${magicLink}">${magicLink}</a></p><p>This link expires in 1 hour.</p>`;

    return sendEmail({ to, subject, text, html });
}

export function resetMailerForTests() {
    cachedTransporter = null;
}
