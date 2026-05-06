import { jest } from "@jest/globals";

const User = {
  findByPk: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
};
const saveProfileImage = jest.fn();
const deleteFileByUrl = jest.fn();

jest.unstable_mockModule("../../Models/UserModel.js", () => ({ default: User }));
jest.unstable_mockModule("../../Utils/SaveFilesUtils.js", () => ({
  saveProfileImage,
  deleteFileByUrl,
}));

const {
  updateProfileService,
  getProfileService,
  listConsultantsService,
  getConsultantService,
} = await import("../../Services/UserServices.js");

describe("UserServices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects update when user missing", async () => {
    User.findByPk.mockResolvedValue(null);
    await expect(updateProfileService("missing", {})).rejects.toMatchObject({
      status: 404,
    });
  });

  it("updates profile and handles images", async () => {
    const user = {
      profileImage: "http://old",
      update: jest.fn(),
      toJSON: () => ({ id: "1", password: "secret" }),
    };
    User.findByPk.mockResolvedValue(user);
    saveProfileImage.mockResolvedValue("http://new");

    const result = await updateProfileService("1", {
      name: " Name ",
      file: { buffer: Buffer.from("x"), originalname: "img.png" },
    });

    expect(saveProfileImage).toHaveBeenCalled();
    expect(deleteFileByUrl).toHaveBeenCalledWith("http://old");
    expect(result.password).toBeUndefined();
  });

  it("gets safe user profile", async () => {
    const user = { toJSON: () => ({ id: "1", password: "secret" }) };
    User.findByPk.mockResolvedValue(user);

    const result = await getProfileService("1");

    expect(result.password).toBeUndefined();
  });

  it("lists consultants with search", async () => {
    User.findAll.mockResolvedValue([{ toJSON: () => ({ id: "1" }) }]);

    const result = await listConsultantsService({ search: "fin" });

    expect(User.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: "1" }]);
  });

  it("rejects missing consultant", async () => {
    User.findOne.mockResolvedValue(null);
    await expect(getConsultantService("id")).rejects.toMatchObject({ status: 404 });
  });
});
