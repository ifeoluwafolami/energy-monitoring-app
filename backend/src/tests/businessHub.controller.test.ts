import { Request, Response } from "express";
import {
  createBusinessHub,
  getAllBusinessHubs,
  getBusinessHub,
  updateBusinessHub,
  deleteBusinessHub,
  filterBusinessHubsByRegion
} from "../controllers/businessHub.controller";
import { BusinessHub } from "../models/businessHub.model";
import { Region } from "../models/region.model";
import { isBlank } from "../utils/isBlank";

// Mock the models
jest.mock("../models/businessHub.model");
jest.mock("../models/region.model");
jest.mock("../utils/isBlank");

const MockedBusinessHub = BusinessHub as jest.Mocked<typeof BusinessHub>;
const MockedRegion = Region as jest.Mocked<typeof Region>;
const mockedIsBlank = isBlank as jest.MockedFunction<typeof isBlank>;

describe("BusinessHub Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {};
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("createBusinessHub", () => {
    beforeEach(() => {
      mockRequest.body = {
        name: "Test Hub",
        region: "Test Region"
      };
    });

    it("should create a business hub successfully", async () => {
      const mockBusinessHub = {
        _id: "123",
        name: "Test Hub",
        region: "Test Region"
      };

      mockedIsBlank.mockReturnValueOnce(false).mockReturnValueOnce(false);
      MockedBusinessHub.findOne = jest.fn().mockResolvedValue(null);
      MockedBusinessHub.create = jest.fn().mockResolvedValue(mockBusinessHub);

      await createBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(MockedBusinessHub.findOne).toHaveBeenCalledWith({
        name: "Test Hub",
        region: "Test Region"
      });
      expect(MockedBusinessHub.create).toHaveBeenCalledWith({
        name: "Test Hub",
        region: "Test Region"
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Business Hub created successfully.",
        businessHub: mockBusinessHub
      });
    });

    it("should return 400 if name is blank", async () => {
      mockedIsBlank.mockReturnValueOnce(true).mockReturnValueOnce(false);

      await createBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Both name and region of business hub are required."
      });
      expect(MockedBusinessHub.findOne).not.toHaveBeenCalled();
    });

    it("should return 400 if region is blank", async () => {
      mockedIsBlank.mockReturnValueOnce(false).mockReturnValueOnce(true);

      await createBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Both name and region of business hub are required."
      });
      expect(MockedBusinessHub.findOne).not.toHaveBeenCalled();
    });

    it("should return 400 if business hub already exists", async () => {
      const existingHub = { _id: "existing", name: "Test Hub", region: "Test Region" };

      mockedIsBlank.mockReturnValueOnce(false).mockReturnValueOnce(false);
      MockedBusinessHub.findOne = jest.fn().mockResolvedValue(existingHub);

      await createBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Business Hub already exists in this region."
      });
      expect(MockedBusinessHub.create).not.toHaveBeenCalled();
    });

    it("should handle trimming of name and region", async () => {
      mockRequest.body = {
        name: "  Test Hub  ",
        region: "  Test Region  "
      };

      mockedIsBlank.mockReturnValueOnce(false).mockReturnValueOnce(false);
      MockedBusinessHub.findOne = jest.fn().mockResolvedValue(null);
      MockedBusinessHub.create = jest.fn().mockResolvedValue({});

      await createBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(MockedBusinessHub.findOne).toHaveBeenCalledWith({
        name: "Test Hub",
        region: "Test Region"
      });
      expect(MockedBusinessHub.create).toHaveBeenCalledWith({
        name: "Test Hub",
        region: "Test Region"
      });
    });

    it("should return 500 on database error", async () => {
      mockedIsBlank.mockReturnValueOnce(false).mockReturnValueOnce(false);
      MockedBusinessHub.findOne = jest.fn().mockRejectedValue(new Error("Database error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await createBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Failed to create Business Hub."
      });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("getAllBusinessHubs", () => {
    it("should fetch all business hubs successfully", async () => {
      const mockBusinessHubs = [
        { _id: "1", name: "Hub 1", region: "Region 1" },
        { _id: "2", name: "Hub 2", region: "Region 2" }
      ];

      MockedBusinessHub.find = jest.fn().mockResolvedValue(mockBusinessHubs);

      await getAllBusinessHubs(mockRequest as Request, mockResponse as Response);

      expect(MockedBusinessHub.find).toHaveBeenCalledWith();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockBusinessHubs);
    });

    it("should return 500 on database error", async () => {
      MockedBusinessHub.find = jest.fn().mockRejectedValue(new Error("Database error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await getAllBusinessHubs(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Failed to fetch business hubs."
      });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("getBusinessHub", () => {
    beforeEach(() => {
      mockRequest.params = { id: "123" };
    });

    it("should fetch a business hub successfully", async () => {
      const mockBusinessHub = { _id: "123", name: "Test Hub", region: "Test Region" };

      MockedBusinessHub.findById = jest.fn().mockResolvedValue(mockBusinessHub);

      await getBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(MockedBusinessHub.findById).toHaveBeenCalledWith("123");
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockBusinessHub);
    });

    it("should return 404 if business hub not found", async () => {
      MockedBusinessHub.findById = jest.fn().mockResolvedValue(null);

      await getBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Business Hub not found."
      });
    });

    it("should return 500 on database error", async () => {
      MockedBusinessHub.findById = jest.fn().mockRejectedValue(new Error("Database error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await getBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Failed to fetch business hub."
      });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("updateBusinessHub", () => {
    const mockBusinessHub = {
      _id: "123",
      name: "Original Hub",
      region: "Original Region",
      save: jest.fn()
    };

    beforeEach(() => {
      mockRequest.params = { id: "123" };
      mockRequest.body = {
        name: "Updated Hub",
        region: "Updated Region"
      };
      mockBusinessHub.save.mockClear();
    });

    it("should update business hub successfully", async () => {
      mockedIsBlank.mockReturnValue(false);
      MockedBusinessHub.findById = jest.fn().mockResolvedValue(mockBusinessHub);
      MockedBusinessHub.findOne = jest.fn().mockResolvedValue(null);

      await updateBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(MockedBusinessHub.findById).toHaveBeenCalledWith("123");
      expect(MockedBusinessHub.findOne).toHaveBeenCalledWith({
        name: "Updated Hub",
        region: "Updated Region",
        _id: { $ne: "123" }
      });
      expect(mockBusinessHub.name).toBe("Updated Hub");
      expect(mockBusinessHub.region).toBe("Updated Region");
      expect(mockBusinessHub.save).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Business Hub updated successfully.",
        businessHub: mockBusinessHub
      });
    });

    it("should return 404 if business hub not found", async () => {
      MockedBusinessHub.findById = jest.fn().mockResolvedValue(null);

      await updateBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Business Hub not found."
      });
    });

    it("should return 400 if both name and region are empty", async () => {
      mockedIsBlank.mockReturnValue(true);
      MockedBusinessHub.findById = jest.fn().mockResolvedValue(mockBusinessHub);

      await updateBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Both name and region cannot be empty."
      });
    });

    it("should return 400 if conflict exists with same name and region", async () => {
      const conflictHub = { _id: "456", name: "Updated Hub", region: "Updated Region" };

      mockedIsBlank.mockReturnValue(false);
      MockedBusinessHub.findById = jest.fn().mockResolvedValue(mockBusinessHub);
      MockedBusinessHub.findOne = jest.fn().mockResolvedValue(conflictHub);

      await updateBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Business hub with this name and region already exists."
      });
    });

    it("should update only name when region is not provided", async () => {
      mockRequest.body = { name: "Updated Hub" };
      
      mockedIsBlank.mockImplementation((value) => !value || value.trim() === "");
      MockedBusinessHub.findById = jest.fn().mockResolvedValue(mockBusinessHub);
      MockedBusinessHub.findOne = jest.fn().mockResolvedValue(null);

      await updateBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(MockedBusinessHub.findOne).toHaveBeenCalledWith({
        name: "Updated Hub",
        region: "Original Region",
        _id: { $ne: "123" }
      });
      expect(mockBusinessHub.name).toBe("Updated Hub");
      expect(mockBusinessHub.region).toBe("Original Region");
    });

    it("should update only region when name is not provided", async () => {
      mockRequest.body = { region: "Updated Region" };
      
      mockedIsBlank.mockImplementation((value) => !value || value.trim() === "");
      MockedBusinessHub.findById = jest.fn().mockResolvedValue(mockBusinessHub);
      MockedBusinessHub.findOne = jest.fn().mockResolvedValue(null);

      await updateBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(MockedBusinessHub.findOne).toHaveBeenCalledWith({
        name: "Original Hub",
        region: "Updated Region",
        _id: { $ne: "123" }
      });
      expect(mockBusinessHub.name).toBe("Original Hub");
      expect(mockBusinessHub.region).toBe("Updated Region");
    });

    it("should return 500 on database error", async () => {
      MockedBusinessHub.findById = jest.fn().mockRejectedValue(new Error("Database error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await updateBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Failed to update business hub."
      });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("deleteBusinessHub", () => {
    beforeEach(() => {
      mockRequest.params = { id: "123" };
    });

    it("should delete business hub successfully", async () => {
      const mockBusinessHub = { _id: "123", name: "Test Hub" };

      MockedBusinessHub.findById = jest.fn().mockResolvedValue(mockBusinessHub);
      MockedBusinessHub.findByIdAndDelete = jest.fn().mockResolvedValue(mockBusinessHub);

      await deleteBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(MockedBusinessHub.findById).toHaveBeenCalledWith("123");
      expect(MockedBusinessHub.findByIdAndDelete).toHaveBeenCalledWith("123");
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Business hub deleted successfully."
      });
    });

    it("should return 404 if business hub not found", async () => {
      MockedBusinessHub.findById = jest.fn().mockResolvedValue(null);

      await deleteBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Business hub not found."
      });
      expect(MockedBusinessHub.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it("should return 500 on database error", async () => {
      MockedBusinessHub.findById = jest.fn().mockRejectedValue(new Error("Database error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await deleteBusinessHub(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Failed to delete business hub."
      });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("filterBusinessHubsByRegion", () => {
    beforeEach(() => {
      mockRequest.query = { region: "Test Region" };
    });

    it("should filter business hubs by region successfully", async () => {
      const mockRegions = [{ _id: "region1", name: "Test Region" }];
      const mockBusinessHubs = [
        { _id: "1", name: "Hub 1", region: "region1" },
        { _id: "2", name: "Hub 2", region: "region1" }
      ];

      MockedRegion.find = jest.fn().mockResolvedValue(mockRegions);
      MockedBusinessHub.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBusinessHubs)
      });

      await filterBusinessHubsByRegion(mockRequest as Request, mockResponse as Response);

      expect(MockedRegion.find).toHaveBeenCalledWith({
        name: { $regex: new RegExp("^Test Region$", "i") }
      });
      expect(MockedBusinessHub.find).toHaveBeenCalledWith({
        region: { $in: ["region1"] }
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockBusinessHubs);
    });

    it("should return 400 if region is empty", async () => {
      mockRequest.query = { region: "" };

      await filterBusinessHubsByRegion(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Kindly input a region."
      });
    });

    it("should return 404 if no region found", async () => {
      MockedRegion.find = jest.fn().mockResolvedValue([]);

      await filterBusinessHubsByRegion(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: "No region found with that name."
      });
    });

    it("should return 404 if no business hubs found in region", async () => {
      const mockRegions = [{ _id: "region1", name: "Test Region" }];

      MockedRegion.find = jest.fn().mockResolvedValue(mockRegions);
      MockedBusinessHub.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });

      await filterBusinessHubsByRegion(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: "No business hubs found under that region."
      });
    });

    it("should handle trimming of region query parameter", async () => {
      mockRequest.query = { region: "  Test Region  " };
      
      const mockRegions = [{ _id: "region1", name: "Test Region" }];
      MockedRegion.find = jest.fn().mockResolvedValue(mockRegions);
      MockedBusinessHub.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });

      await filterBusinessHubsByRegion(mockRequest as Request, mockResponse as Response);

      expect(MockedRegion.find).toHaveBeenCalledWith({
        name: { $regex: new RegExp("^Test Region$", "i") }
      });
    });

    it("should return 500 on database error", async () => {
      MockedRegion.find = jest.fn().mockRejectedValue(new Error("Database error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await filterBusinessHubsByRegion(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Error filtering business hubs by region."
      });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});