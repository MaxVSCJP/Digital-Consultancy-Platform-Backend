import { jest } from "@jest/globals";

const User = {
  count: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
};

jest.unstable_mockModule("../../Models/UserModel.js", () => ({ default: User }));

const { listUsersForAdmin, updateUserRoleForAdmin } = await import(
  "../../Services/AdminUserServices.js"
);

describe("AdminUserServices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists users with pagination", async () => {
    User.count.mockResolvedValue(5);
    User.findAll.mockResolvedValue([{ id: "1" }, { id: "2" }]);

    const result = await listUsersForAdmin({ page: 2, limit: 2, role: "user" });

    expect(User.count).toHaveBeenCalledWith({ where: { role: "user" } });
    expect(User.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: "user" },
        limit: 2,
        offset: 2,
      })
    );
    expect(result.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 5,
      totalPages: 3,
    });
  });

  it("rejects invalid role filter", async () => {
    await expect(listUsersForAdmin({ role: "invalid" })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("rejects missing userId on update", async () => {
    await expect(updateUserRoleForAdmin("", "user")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("rejects updating own role", async () => {
    const user = { id: "abc", update: jest.fn() };
    User.findByPk.mockResolvedValue(user);

    await expect(
      updateUserRoleForAdmin("abc", "admin", { id: "abc" })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("updates user role", async () => {
    const user = { id: "abc", update: jest.fn() };
    User.findByPk.mockResolvedValue(user);

    const result = await updateUserRoleForAdmin("abc", "consultant", {
      id: "other",
    });

    expect(user.update).toHaveBeenCalledWith({ role: "consultant" });
    expect(result).toBe(user);
  });
});
