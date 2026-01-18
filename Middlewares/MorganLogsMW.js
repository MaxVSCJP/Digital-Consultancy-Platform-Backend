import morgan from "morgan";
import Log from "../Models/MorganLogModel.js";

morgan.token("userId", function (req, res) {
  return req.user ? req.user.id : "Guest";
});

morgan.token("userName", function (req, res) {
  return req.user ? req.user.name : "Guest";
});

morgan.token("userRole", function (req, res) {
  return req.user ? req.user.role : "Guest";
});

morgan.token("ip", function (req, res) {
  return req.ip;
});

export const logFormat =
  ":method|:url|:status|:response-time|:userId|:userName|:userRole|:ip";

export const stream = {
  write: function (message) {
    const logData = message.trim().split("|");
    const log = new Log({
      method: logData[0],
      url: logData[1],
      status: parseInt(logData[2]),
      responseTime: parseFloat(logData[3]),
      userId: logData[4],
      userName: logData[5],
      userRole: logData[6],
      ip: logData[7],
    });
    log.save().catch((err) => console.error(err));
  },
};
