import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import { protect } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/adminMiddleware";
import { validate } from "../middleware/validateMiddleware";
import { User } from "../models/user.model";

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("express-validator");
jest.mock("../models/user.model");

const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;
const MockedUser = User as jest.Mocked<typeof User>;

describe("Middleware Tests", () => {
  let mockRequest: Partial<Request & { user?: any }>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockNext = jest.fn() as jest.MockedFunction<NextFunction>;
    
    mockRequest = {
      headers: {},
      user: undefined
    };
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };

    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup environment variable
    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe("protect middleware", () => {
    it("should authenticate user with valid token", async () => {
      const mockUser = {
        _id: "user123",
        email: "test@example.com",
        name: "Test User",
        isAdmin: false
      };

      mockRequest.headers = {
        authorization: "Bearer valid-token"
      };

      mockedJwt.verify.mockReturnValue({ id: "user123" } as any);
      MockedUser.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await protect(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockedJwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");
      expect(MockedUser.findById).toHaveBeenCalledWith("user123");
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it("should reject request with invalid token", async () => {
      mockRequest.headers = {
        authorization: "Bearer invalid-token"
      };

      mockedJwt.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await protect(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockedJwt.verify).toHaveBeenCalledWith("invalid-token", "test-secret");
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Not authorized, invalid token"
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request with expired token", async () => {
      mockRequest.headers = {
        authorization: "Bearer expired-token"
      };

      const tokenError = new Error("Token expired");
      tokenError.name = "TokenExpiredError";
      mockedJwt.verify.mockImplementation(() => {
        throw tokenError;
      });

      await protect(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Not authorized, invalid token"
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request with no authorization header", async () => {
      mockRequest.headers = {};

      await protect(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Not authorized, no token"
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockedJwt.verify).not.toHaveBeenCalled();
    });

    it("should reject request with authorization header not starting with Bearer", async () => {
      mockRequest.headers = {
        authorization: "Basic some-credential"
      };

      await protect(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Not authorized, no token"
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockedJwt.verify).not.toHaveBeenCalled();
    });

    it("should handle user not found in database", async () => {
      mockRequest.headers = {
        authorization: "Bearer valid-token"
      };

      mockedJwt.verify.mockReturnValue({ id: "nonexistent-user" } as any);
      MockedUser.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await protect(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle database error", async () => {
      mockRequest.headers = {
        authorization: "Bearer valid-token"
      };

      mockedJwt.verify.mockReturnValue({ id: "user123" } as any);
      MockedUser.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("Database error"))
      });

      await protect(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Not authorized, invalid token"
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should extract token correctly from Bearer authorization", async () => {
      const mockUser = { _id: "user123", name: "Test User" };

      mockRequest.headers = {
        authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
      };

      mockedJwt.verify.mockReturnValue({ id: "user123" } as any);
      MockedUser.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await protect(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockedJwt.verify).toHaveBeenCalledWith(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        "test-secret"
      );
    });
  });

  describe("adminOnly middleware", () => {
    it("should allow access for admin user", () => {
      mockRequest.user = {
        _id: "admin123",
        email: "admin@example.com",
        isAdmin: true
      };

      adminOnly(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it("should deny access for non-admin user", () => {
      mockRequest.user = {
        _id: "user123",
        email: "user@example.com",
        isAdmin: false
      };

      adminOnly(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Access denied: ADMINS ONLY."
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should deny access when user is not authenticated", () => {
      mockRequest.user = undefined;

      adminOnly(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Access denied: ADMINS ONLY."
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should deny access when user is null", () => {
      mockRequest.user = null;

      adminOnly(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Access denied: ADMINS ONLY."
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should deny access when isAdmin is explicitly false", () => {
      mockRequest.user = {
        _id: "user123",
        email: "user@example.com",
        isAdmin: false
      };

      adminOnly(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Access denied: ADMINS ONLY."
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should deny access when isAdmin property is missing", () => {
      mockRequest.user = {
        _id: "user123",
        email: "user@example.com"
        // isAdmin property is missing
      };

      adminOnly(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Access denied: ADMINS ONLY."
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("validate middleware", () => {
    it("should proceed when validation passes", () => {
      const mockValidationResult = {
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      };

      mockedValidationResult.mockReturnValue(mockValidationResult as any);

      validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockValidationResult.isEmpty).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it("should return 400 with errors when validation fails", () => {
      const validationErrors = [
        {
          type: "field",
          msg: "Name is required",
          path: "name",
          location: "body"
        },
        {
          type: "field", 
          msg: "Email must be valid",
          path: "email",
          location: "body"
        }
      ];

      const mockValidationResult = {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      };

      mockedValidationResult.mockReturnValue(mockValidationResult as any);

      validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockedValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockValidationResult.isEmpty).toHaveBeenCalled();
      expect(mockValidationResult.array).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        errors: validationErrors
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle single validation error", () => {
      const validationErrors = [
        {
          type: "field",
          msg: "Password is required",
          path: "password",
          location: "body"
        }
      ];

      const mockValidationResult = {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      };

      mockedValidationResult.mockReturnValue(mockValidationResult as any);

      validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        errors: validationErrors
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle empty validation errors array", () => {
      const mockValidationResult = {
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      };

      mockedValidationResult.mockReturnValue(mockValidationResult as any);

      validate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });
  });

  describe("Integration scenarios", () => {
    it("should work together - protect then adminOnly for admin user", async () => {
      const mockAdminUser = {
        _id: "admin123",
        email: "admin@example.com",
        isAdmin: true
      };

      // First, protect middleware
      mockRequest.headers = {
        authorization: "Bearer valid-admin-token"
      };

      mockedJwt.verify.mockReturnValue({ id: "admin123" } as any);
      MockedUser.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdminUser)
      });

      await protect(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual(mockAdminUser);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Reset mockNext for adminOnly test
      mockNext.mockClear();

      // Then, adminOnly middleware
      adminOnly(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it("should work together - protect then adminOnly for regular user", async () => {
      const mockRegularUser = {
        _id: "user123",
        email: "user@example.com",
        isAdmin: false
      };

      // First, protect middleware
      mockRequest.headers = {
        authorization: "Bearer valid-user-token"
      };

      mockedJwt.verify.mockReturnValue({ id: "user123" } as any);
      MockedUser.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockRegularUser)
      });

      await protect(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual(mockRegularUser);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Reset mocks for adminOnly test
      mockNext.mockClear();
      mockStatus.mockClear();
      mockJson.mockClear();

      // Then, adminOnly middleware should reject
      adminOnly(
        mockRequest as Request & { user?: any },
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Access denied: ADMINS ONLY."
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});