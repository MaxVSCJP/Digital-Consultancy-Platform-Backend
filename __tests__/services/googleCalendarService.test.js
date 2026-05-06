import { jest } from "@jest/globals";
import { EventEmitter } from "events";

const buildHttpsMock = (responses) =>
  jest.fn((options, callback) => {
    const next = responses.shift() || { statusCode: 200, payload: {} };
    const res = new EventEmitter();
    res.statusCode = next.statusCode;
    callback(res);

    process.nextTick(() => {
      if (typeof next.payload !== "undefined") {
        res.emit("data", JSON.stringify(next.payload));
      }
      res.emit("end");
    });

    const req = new EventEmitter();
    req.write = jest.fn();
    req.end = jest.fn();
    req.on = req.addListener;
    return req;
  });

const loadService = async ({ clientEmail, privateKey, calendarId, httpsRequestMock }) => {
  jest.resetModules();

  const jwtMock = { sign: jest.fn(() => "signed-jwt") };

  jest.unstable_mockModule("https", () => ({
    default: { request: httpsRequestMock },
  }));
  jest.unstable_mockModule("jsonwebtoken", () => ({ default: jwtMock }));
  jest.unstable_mockModule("../../Configs/ProDevConfig.js", () => ({
    GOOGLE_CLIENT_EMAIL: clientEmail,
    GOOGLE_PRIVATE_KEY: privateKey,
    GOOGLE_CALENDAR_ID: calendarId,
  }));

  const service = await import("../../Services/GoogleCalendarService.js");
  return { ...service, jwtMock };
};

describe("GoogleCalendarService", () => {
  it("reports missing config", async () => {
    const httpsRequestMock = buildHttpsMock([]);
    const { isGoogleCalendarConfigured } = await loadService({
      clientEmail: "",
      privateKey: "",
      calendarId: "",
      httpsRequestMock,
    });

    expect(isGoogleCalendarConfigured()).toBe(false);
  });

  it("creates calendar event", async () => {
    const httpsRequestMock = buildHttpsMock([
      { statusCode: 200, payload: { access_token: "token" } },
      { statusCode: 200, payload: { id: "event-1", hangoutLink: "http://meet" } },
    ]);

    const { createCalendarEvent, jwtMock } = await loadService({
      clientEmail: "client@example.com",
      privateKey: "key\\nline",
      calendarId: "calendar-id",
      httpsRequestMock,
    });

    const result = await createCalendarEvent({
      summary: "Test",
      description: "Desc",
      start: "2025-01-01T10:00:00Z",
      end: "2025-01-01T11:00:00Z",
      attendees: [{ email: "a@b.com" }],
    });

    expect(jwtMock.sign).toHaveBeenCalled();
    expect(httpsRequestMock).toHaveBeenCalledTimes(2);
    expect(result.id).toBe("event-1");
  });
});
