import { jest } from "@jest/globals";

const buildService = async () => {
  jest.resetModules();

  const Review = {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  };
  const Booking = {
    findOne: jest.fn(),
  };
  const User = {
    findByPk: jest.fn(),
  };
  const sequelize = {
    fn: jest.fn((...args) => ({ fnArgs: args })),
    col: jest.fn((name) => name),
  };

  jest.unstable_mockModule("../../Models/ReviewModel.js", () => ({
    default: Review,
  }));
  jest.unstable_mockModule("../../Models/BookingModel.js", () => ({
    default: Booking,
  }));
  jest.unstable_mockModule("../../Models/UserModel.js", () => ({
    default: User,
  }));
  jest.unstable_mockModule("../../Configs/DatabaseConfig.js", () => ({
    sequelize,
  }));

  const service = await import("../../Services/ReviewServices.js");

  return {
    ...service,
    Review,
    Booking,
    User,
    sequelize,
  };
};

describe("ReviewServices", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("rejects unauthenticated review creation", async () => {
    const { createReview } = await buildService();
    await expect(
      createReview({ consultantId: "c1", rating: 5, review: "Great" })
    ).rejects.toMatchObject({ status: 401 });
  });

  it("rejects invalid rating", async () => {
    const { createReview } = await buildService();
    await expect(
      createReview({ userId: "u1", consultantId: "c1", rating: 7, review: "Great" })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects missing consultant", async () => {
    const { createReview, User } = await buildService();
    User.findByPk.mockResolvedValue(null);

    await expect(
      createReview({ userId: "u1", consultantId: "c1", rating: 5, review: "Great" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("rejects ineligible reviewer", async () => {
    const { createReview, User, Booking } = await buildService();
    User.findByPk.mockResolvedValue({ id: "c1", role: "consultant" });
    Booking.findOne.mockResolvedValue(null);

    await expect(
      createReview({ userId: "u1", consultantId: "c1", rating: 5, review: "Great" })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("rejects duplicate reviews", async () => {
    const { createReview, User, Booking, Review } = await buildService();
    User.findByPk.mockResolvedValue({ id: "c1", role: "consultant" });
    Booking.findOne.mockResolvedValue({ id: "b1" });
    Review.findOne.mockResolvedValue({ id: "r1" });

    await expect(
      createReview({ userId: "u1", consultantId: "c1", rating: 5, review: "Great" })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("creates reviews for eligible users", async () => {
    const { createReview, User, Booking, Review } = await buildService();
    User.findByPk.mockResolvedValue({ id: "c1", role: "consultant" });
    Booking.findOne.mockResolvedValue({ id: "b1" });
    Review.findOne.mockResolvedValue(null);
    Review.create.mockResolvedValue({ id: "r1" });
    Review.findByPk.mockResolvedValue({ id: "r1" });

    const result = await createReview({
      userId: "u1",
      consultantId: "c1",
      rating: 4,
      review: "Great",
    });

    expect(Review.create).toHaveBeenCalled();
    expect(result).toEqual({ id: "r1" });
  });

  it("lists consultant reviews with pagination", async () => {
    const { listReviewsForConsultant, Review, User } = await buildService();
    User.findByPk.mockResolvedValue({ id: "c1", role: "consultant" });
    Review.count.mockResolvedValue(2);
    Review.findAll.mockResolvedValue([{ id: "r1" }]);

    const result = await listReviewsForConsultant({ consultantId: "c1", page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(2);
  });

  it("prevents non-owners from deleting reviews", async () => {
    const { deleteReview, Review } = await buildService();
    Review.findByPk.mockResolvedValue({ id: "r1", userId: "u1" });

    await expect(
      deleteReview("r1", { id: "u2", role: "user" })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("allows admins to delete reviews", async () => {
    const { deleteReview, Review } = await buildService();
    const review = { id: "r1", userId: "u1", destroy: jest.fn() };
    Review.findByPk.mockResolvedValue(review);

    const result = await deleteReview("r1", { id: "u2", role: "admin" });

    expect(review.destroy).toHaveBeenCalled();
    expect(result).toBe(review);
  });

  it("returns rating summaries", async () => {
    const { getConsultantRatingSummary, Review, User } = await buildService();
    User.findByPk.mockResolvedValue({ id: "c1", role: "consultant" });
    Review.findAll.mockResolvedValue([
      { averageRating: "4.5", reviewCount: "2" },
    ]);

    const result = await getConsultantRatingSummary("c1");

    expect(result.averageRating).toBe(4.5);
    expect(result.reviewCount).toBe(2);
  });

  it("returns zero summary for no reviews", async () => {
    const { getConsultantRatingSummary, Review, User } = await buildService();
    User.findByPk.mockResolvedValue({ id: "c1", role: "consultant" });
    Review.findAll.mockResolvedValue([
      { averageRating: null, reviewCount: "0" },
    ]);

    const result = await getConsultantRatingSummary("c1");

    expect(result.averageRating).toBe(0);
    expect(result.reviewCount).toBe(0);
  });
});
