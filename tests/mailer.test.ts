import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type MailerModule = typeof import("../src/utils/mailer.js");

type TransportMock = {
    sendMail: ReturnType<typeof vi.fn>;
};

const sendMailMock = vi.fn().mockResolvedValue({ messageId: "test-message" });
const createTransportMock = vi.fn((): TransportMock => ({
    sendMail: sendMailMock
}));

vi.mock("nodemailer", () => ({
    default: {
        createTransport: createTransportMock
    }
}));

describe("mailer", () => {
    let mailer: MailerModule;

    beforeEach(async () => {
        vi.resetModules();
        process.env.SMTP_HOST = "smtp.example.com";
        process.env.SMTP_PORT = "587";
        process.env.SMTP_USER = "smtp-user";
        process.env.SMTP_PASS = "smtp-pass";
        process.env.SENDER_NAME = "DWP Hours";
        process.env.SENDER_EMAIL = "no-reply@example.com";
        process.env.NODE_ENV = "test";

        mailer = await import("../src/utils/mailer.js");
        mailer.resetMailerForTests();

        createTransportMock.mockClear();
        sendMailMock.mockClear();
    });

    afterEach(() => {
        delete process.env.SMTP_HOST;
        delete process.env.SMTP_PORT;
        delete process.env.SMTP_USER;
        delete process.env.SMTP_PASS;
        delete process.env.SENDER_NAME;
        delete process.env.SENDER_EMAIL;
        delete process.env.NODE_ENV;
    });

    it("sends email with configured sender and recipient", async () => {
        await mailer.sendEmail({
            to: "employee@example.com",
            subject: "Welcome",
            text: "Hello"
        });

        expect(createTransportMock).toHaveBeenCalledWith(expect.objectContaining({
            host: "smtp.example.com",
            port: 587,
            secure: false,
            auth: {
                user: "smtp-user",
                pass: "smtp-pass"
            }
        }));

        expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
            from: "DWP Hours <no-reply@example.com>",
            to: "employee@example.com",
            subject: "Welcome",
            text: "Hello"
        }));
    });

    it("sends magic link email with expected subject and body", async () => {
        await mailer.sendMagicLinkEmail("employee@example.com", "http://localhost:3000/?token=abc&ts=123");

        expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
            to: "employee@example.com",
            subject: "Your magic login link"
        }));

        const lastCall = sendMailMock.mock.calls[0]?.[0];
        expect(lastCall?.text).toContain("http://localhost:3000/?token=abc&ts=123");
        expect(lastCall?.html).toContain("http://localhost:3000/?token=abc&ts=123");
    });
});
