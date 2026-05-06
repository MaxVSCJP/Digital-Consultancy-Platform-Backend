import { jest } from "@jest/globals";

const Availability = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
};

jest.unstable_mockModule("../../Models/AvailabilityModel.js", () => ({
  default: Availability,
}));

const { createAvailability, listAvailability, updateAvailability } = await import(
  "../../Services/AvailabilityServices.js"
);

describe("AvailabilityServices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects invalid start date", async () => {
    await expect(
      createAvailability({ consultantId: "1", slotStart: "bad", slotEnd: "2024-01-02" })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects end before start", async () => {
    await expect(
      createAvailability({
        consultantId: "1",
        slotStart: "2024-01-02",
        slotEnd: "2024-01-01",
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("creates availability with defaults", async () => {
    const slotStart = new Date("2024-01-01T10:00:00Z");
    const slotEnd = new Date("2024-01-01T11:00:00Z");
    Availability.create.mockResolvedValue({ id: "a1" });

    await createAvailability({ consultantId: "1", slotStart, slotEnd });

    expect(Availability.create).toHaveBeenCalledWith(
      expect.objectContaining({
        consultantId: "1",
        slotStart,
        slotEnd,
        timezone: "UTC",
        meta: null,
      }),
      {}
    );
  });

  it("rejects list without consultantId", async () => {
    await expect(listAvailability({})).rejects.toMatchObject({ status: 400 });
  });

  it("lists availability with filters", async () => {
    Availability.findAll.mockResolvedValue([]);

    await listAvailability({ consultantId: "1", status: "open" });

    expect(Availability.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { consultantId: "1", status: "open" },
      })
    );
  });

  it("rejects updates for missing availability", async () => {
    Availability.findByPk.mockResolvedValue(null);
    await expect(updateAvailability("missing", {})).rejects.toMatchObject({
      status: 404,
    });
  });

  it("rejects invalid update range", async () => {
    const availability = { update: jest.fn() };
    Availability.findByPk.mockResolvedValue(availability);

    await expect(
      updateAvailability("id", { slotStart: "2024-01-02", slotEnd: "2024-01-01" })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("updates availability", async () => {
    const availability = { update: jest.fn() };
    Availability.findByPk.mockResolvedValue(availability);

    await updateAvailability("id", { status: "booked", timezone: "UTC" });

    expect(availability.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "booked", timezone: "UTC" }),
      {}
    );
  });
});
