import { jest } from "@jest/globals";

const User = {
  findOne: jest.fn(),
  create: jest.fn(),
};
const bcrypt = {
  compare: jest.fn(),
  hash: jest.fn(),
};
const jwt = {
  sign: jest.fn(),
};
const saveCVImage = jest.fn();

jest.unstable_mockModule("../../Models/UserModel.js", () => ({ default: User }));
jest.unstable_mockModule("bcrypt", () => ({ default: bcrypt }));
jest.unstable_mockModule("jsonwebtoken", () => ({ default: jwt }));
jest.unstable_mockModule("../../Utils/SaveFilesUtils.js", () => ({ saveCVImage }));

const {
  buildUserAuthPayload,
  loginService,
  signupService,
  DEFAULT_ROLE,
} = await import("../../Services/AuthServices.js");

describe("AuthServices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds auth payload with defaults", () => {
    const payload = JSON.parse(
      buildUserAuthPayload({ id: "1", email: "a@b.com", name: "A" })
    );
    expect(payload.role).toBe(DEFAULT_ROLE);
    expect(payload.email).toBe("a@b.com");
  });

  it("rejects login without email", async () => {
    await expect(loginService("", "pass")).rejects.toMatchObject({ status: 400 });
  });

  it("rejects login when user missing", async () => {
    User.findOne.mockResolvedValue(null);
    await expect(loginService("test@example.com", "pass")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("rejects login with wrong password", async () => {
    User.findOne.mockResolvedValue({ id: "1", password: "hash", role: "user" });
    bcrypt.compare.mockResolvedValue(false);

    await expect(loginService("test@example.com", "pass")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("logs in with valid credentials", async () => {
    const user = { id: "1", password: "hash", role: "user" };
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("token");

    const result = await loginService("test@example.com", "pass");

    expect(result).toEqual({ user, token: "token" });
  });

  it("rejects signup without email", async () => {
    await expect(signupService({ userName: "Name" })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("rejects signup without name", async () => {
    await expect(signupService({ email: "a@b.com" })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("rejects signup when email exists", async () => {
    User.findOne.mockResolvedValue({ id: "1" });
    await expect(
      signupService({ userName: "Name", email: "a@b.com" })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("creates user with sanitized role and file", async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashed");
    saveCVImage.mockResolvedValue("http://file");
    User.create.mockResolvedValue({
      toJSON: () => ({ id: "1", password: "hashed", role: "user" }),
    });

    const result = await signupService({
      userName: "Name",
      email: "a@b.com",
      password: "pass",
      role: "admin",
      agreedToTerms: "true",
      file: { buffer: Buffer.from("x"), originalname: "id.png" },
    });

    const createArgs = User.create.mock.calls[0][0];
    expect(createArgs.role).toBe(DEFAULT_ROLE);
    expect(createArgs.cv).toBe("http://file");
    expect(result.password).toBeUndefined();
  });
});
