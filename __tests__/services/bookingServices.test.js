import { jest } from "@jest/globals";

const buildService = async ({ price = "100" } = {}) => {
  jest.resetModules();
  process.env.BOOKING_PRICE = price;
  process.env.BOOKING_CURRENCY = "ETB";
  process.env.CHAPA_API_SECRET_KEY = "secret";
  process.env.BOOKING_PAYMENT_CALLBACK_URL = "http://callback";
  process.env.BOOKING_PAYMENT_RETURN_URL = "http://return";

  const Booking = {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
  };
  const Availability = {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  };
  const User = {
    findByPk: jest.fn(),
  };
  const sequelize = {
    transaction: jest.fn((fn) => fn({})),
  };
  const createNotification = jest.fn();
  const createCalendarEvent = jest.fn();
  const isGoogleCalendarConfigured = jest.fn();
  const reopenExpiredAvailabilitySlots = jest.fn().mockResolvedValue([]);

  jest.unstable_mockModule("../../Models/BookingModel.js", () => ({
    default: Booking,
  }));
  jest.unstable_mockModule("../../Models/AvailabilityModel.js", () => ({
    default: Availability,
  }));
  jest.unstable_mockModule("../../Models/UserModel.js", () => ({ default: User }));
  jest.unstable_mockModule("../../Configs/DatabaseConfig.js", () => ({
    sequelize,
  }));
  jest.unstable_mockModule("../../Services/NotificationServices.js", () => ({
    createNotification,
  }));
  jest.unstable_mockModule("../../Services/GoogleCalendarService.js", () => ({
    createCalendarEvent,
    isGoogleCalendarConfigured,
  }));
  jest.unstable_mockModule("../../Services/AvailabilityServices.js", () => ({
    reopenExpiredAvailabilitySlots,
  }));
  jest.unstable_mockModule("../../Configs/ProDevConfig.js", () => ({
    frontendOrigin: "http://frontend",
    origin: "http://api",
  }));

  const service = await import("../../Services/BookingServices.js");
  return {
    ...service,
    Booking,
    Availability,
    User,
    sequelize,
    createNotification,
    createCalendarEvent,
    isGoogleCalendarConfigured,
    reopenExpiredAvailabilitySlots,
  };
};

describe("BookingServices", () => {
  afterEach(() => {
    delete global.fetch;
    jest.clearAllMocks();
  });

  it("rejects when unauthenticated", async () => {
    const { createBookingRequest } = await buildService();
    await expect(createBookingRequest({})).rejects.toMatchObject({ status: 401 });
  });

  it("rejects self bookings", async () => {
    const { createBookingRequest } = await buildService();
    await expect(
      createBookingRequest({ userId: "u1", consultantId: "u1" })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("creates booking requests", async () => {
    const {
      createBookingRequest,
      Booking,
      Availability,
      User,
      createNotification,
      reopenExpiredAvailabilitySlots,
    } = await buildService();

    const user = {
      id: "user-1",
      name: "User",
      email: "user@example.com",
      phone: "123",
    };
    const consultant = { id: "consultant-1", role: "consultant", name: "Consultant" };
    const availability = {
      id: "avail-1",
      consultantId: "consultant-1",
      status: "open",
      slotStart: new Date("2025-01-01T10:00:00Z"),
      slotEnd: new Date("2025-01-01T11:00:00Z"),
      timezone: "UTC",
      update: jest.fn(),
    };

    User.findByPk.mockImplementation((id) =>
      Promise.resolve(id === "user-1" ? user : consultant)
    );
    Availability.findOne.mockResolvedValue(availability);
    Booking.create.mockResolvedValue({ id: "booking-1" });
    Booking.findByPk.mockResolvedValue({ id: "booking-1" });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "success",
        data: { checkout_url: "http://checkout" },
      }),
    });

    const result = await createBookingRequest({
      userId: "user-1",
      consultantId: "consultant-1",
      availabilityId: "avail-1",
      notes: "Notes",
    });

    expect(Booking.create).toHaveBeenCalled();
    expect(reopenExpiredAvailabilitySlots).toHaveBeenCalledWith({ consultantId: "consultant-1" });
    expect(availability.update).toHaveBeenCalledWith({ status: "pending" }, { transaction: {} });
    expect(createNotification).toHaveBeenCalled();
    expect(result.payment.checkout_url).toBe("http://checkout");
  });

  it("verifies booking payment", async () => {
    const { verifyBookingPayment, Booking } = await buildService();
    const booking = { metadata: { paymentStatus: "paid" }, update: jest.fn() };

    Booking.findOne.mockResolvedValue(booking);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "success",
        data: { status: "success" },
      }),
    });

    const result = await verifyBookingPayment("tx-1");
    expect(result).toBe(booking);
  });

  it("rejects invalid status updates", async () => {
    const { updateBookingStatus } = await buildService();
    await expect(updateBookingStatus({ bookingId: "b1", status: "bad" })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("accepts bookings and sends notifications", async () => {
    const {
      updateBookingStatus,
      Booking,
      createNotification,
      isGoogleCalendarConfigured,
    } = await buildService();

    const availability = {
      slotStart: new Date("2025-01-01T10:00:00Z"),
      slotEnd: new Date("2025-01-01T11:00:00Z"),
      timezone: "UTC",
      update: jest.fn(),
    };
    const booking = {
      id: "booking-1",
      status: "pending",
      consultantId: "consultant-1",
      userId: "user-1",
      slotStart: availability.slotStart,
      slotEnd: availability.slotEnd,
      availability,
      user: { name: "User", email: "user@example.com" },
      consultant: { email: "consultant@example.com" },
      update: jest.fn(),
    };

    isGoogleCalendarConfigured.mockReturnValue(false);
    Booking.findOne.mockResolvedValue(booking);
    Booking.findByPk.mockResolvedValue({ id: "booking-1", status: "accepted" });

    const result = await updateBookingStatus({
      bookingId: "booking-1",
      status: "accepted",
      note: "ok",
      consultantId: "consultant-1",
    });

    expect(availability.update).toHaveBeenCalledWith({ status: "booked" }, { transaction: {} });
    expect(createNotification).toHaveBeenCalledTimes(2);
    expect(result.status).toBe("accepted");
  });
});
