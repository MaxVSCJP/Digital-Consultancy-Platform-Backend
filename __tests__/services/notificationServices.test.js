import { jest } from "@jest/globals";

const Notification = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
};

jest.unstable_mockModule("../../Models/NotificationModel.js", () => ({
  default: Notification,
}));

const {
  createNotification,
  listNotificationsForRecipient,
  markNotificationRead,
} = await import("../../Services/NotificationServices.js");

describe("NotificationServices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates notifications", async () => {
    Notification.create.mockResolvedValue({ id: "n1" });
    const result = await createNotification({ recipientId: "1" });
    expect(Notification.create).toHaveBeenCalledWith({ recipientId: "1" }, {});
    expect(result).toEqual({ id: "n1" });
  });

  it("requires recipientId for listing", async () => {
    await expect(listNotificationsForRecipient("")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("marks notification read", async () => {
    const notification = { read: false, update: jest.fn() };
    Notification.findByPk.mockResolvedValue(notification);

    await markNotificationRead("n1");

    expect(notification.update).toHaveBeenCalledWith({ read: true });
  });

  it("returns already read notifications", async () => {
    const notification = { read: true };
    Notification.findByPk.mockResolvedValue(notification);

    const result = await markNotificationRead("n1");

    expect(result).toBe(notification);
  });
});
