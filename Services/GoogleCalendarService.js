import https from "https";
import jwt from "jsonwebtoken";
import { URL } from "url";

import createError from "../Utils/CreateErrorsUtils.js";
import {
  GOOGLE_CALENDAR_ID,
  GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY,
} from "../Configs/ProDevConfig.js";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

const ensureConfig = () => {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_CALENDAR_ID) {
    throw createError(500, "Google Calendar service is not configured");
  }
};

const normalizePrivateKey = () =>
  GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

const requestJson = (urlString, { method = "GET", headers = {}, body } = {}) =>
  new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const options = {
      method,
      hostname: url.hostname,
      path: `${url.pathname}${url.search}`,
      headers,
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        let payload = {};
        if (data) {
          try {
            payload = JSON.parse(data);
          } catch (err) {
            return reject(
              createError(res.statusCode ?? 500, "Unexpected response from Google"),
            );
          }
        }

        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          return resolve(payload);
        }

        const message =
          payload.error_description ||
          payload.error ||
          payload.message ||
          "Google API request failed";
        return reject(createError(res.statusCode ?? 502, message));
      });
    });

    req.on("error", (error) => {
      reject(createError(500, error.message || "Failed to reach Google API"));
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });

const getAccessToken = async () => {
  ensureConfig();
  const now = Math.floor(Date.now() / 1000);
  const signedJwt = jwt.sign(
    {
      iss: GOOGLE_CLIENT_EMAIL,
      scope: CALENDAR_SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    },
    normalizePrivateKey(),
    { algorithm: "RS256" },
  );

  const payload = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: signedJwt,
  }).toString();

  const tokenResponse = await requestJson(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(payload),
    },
    body: payload,
  });

  if (!tokenResponse.access_token) {
    throw createError(502, "Unable to fetch access token from Google");
  }

  return tokenResponse.access_token;
};

export const createCalendarEvent = async ({
  summary,
  description,
  start,
  end,
  timezone = "UTC",
  attendees = [],
}) => {
  const accessToken = await getAccessToken();
  const sanitizedAttendees = attendees
    .map((attendee) => attendee?.email && { email: attendee.email })
    .filter(Boolean);

  const eventBody = {
    summary,
    description,
    start: {
      dateTime: new Date(start).toISOString(),
      timeZone: timezone,
    },
    end: {
      dateTime: new Date(end).toISOString(),
      timeZone: timezone,
    },
    attendees: sanitizedAttendees,
    conferenceData: {
      createRequest: {
        requestId: `dc-meet-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
  };

  const calendarEndpoint = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    GOOGLE_CALENDAR_ID,
  )}/events?conferenceDataVersion=1`;

  return requestJson(calendarEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(eventBody),
  });
};
