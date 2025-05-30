import { Request, Response } from 'express';
import {
  createFeeder,
  getAllFeeders,
  getFeeder,
  updateFeeder,
  deleteFeeder,
  filterFeedersByRegion,
  filterFeedersByBusinessHub,
  filterFeedersByBand,
  filterFeedersByBHAndRegion
} from '../controllers/feeder.controller';
import { Feeder } from '../models/feeder.model';
import { Region } from '../models/region.model';
import { BusinessHub } from '../models/businessHub.model';
import { isBlank } from '../utils/isBlank';

// Mock dependencies
jest.mock('../models/feeder.model');
jest.mock('../models/region.model');
jest.mock('../models/businessHub.model');
jest.mock('../utils/isBlank');

const mockFeeder = Feeder as jest.Mocked<typeof Feeder>;
const mockRegion = Region as jest.Mocked<typeof Region>;
const mockBusinessHub = BusinessHub as jest.Mocked<typeof BusinessHub>;
const mockIsBlank = isBlank as jest.MockedFunction<typeof isBlank>;

// Mock console.error to avoid noise in tests
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Feeder Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockReq = {
      body: {},
      params: {},
      query: {}
    };
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };

    jest.clearAllMocks();
  });

  describe('createFeeder', () => {
    const validFeederData = {
      name: 'Test Feeder',
      businessHub: 'Test BH',
      region: 'Test Region',
      band: 'A20H',
      dailyEnergyUptake: 100,
      monthlyDeliveryPlan: 3000,
      previousMonthConsumption: 2800
    };

    it('should create a feeder successfully', async () => {
      mockReq.body = validFeederData;
      mockIsBlank.mockReturnValue(false);
      mockFeeder.findOne.mockResolvedValue(null);
      
      const createdFeeder = { _id: 'feeder123', ...validFeederData };
      mockFeeder.create.mockResolvedValue(createdFeeder as any);

      await createFeeder(mockReq as Request, mockRes as Response);

      expect(mockFeeder.findOne).toHaveBeenCalledWith({
        name: validFeederData.name.trim(),
        businessHub: validFeederData.businessHub.trim(),
        region: validFeederData.region.trim()
      });
      expect(mockFeeder.create).toHaveBeenCalledWith(validFeederData);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder created successfully.',
        feeder: createdFeeder
      });
    });

    it('should return 400 when required fields are missing', async () => {
      mockReq.body = { name: 'Test Feeder' }; // Missing required fields
      mockIsBlank.mockImplementation((value) => !value || value.trim() === '');

      await createFeeder(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'All fields are required.'
      });
      expect(mockFeeder.findOne).not.toHaveBeenCalled();
      expect(mockFeeder.create).not.toHaveBeenCalled();
    });

    it('should return 400 when feeder already exists', async () => {
      mockReq.body = validFeederData;
      mockIsBlank.mockReturnValue(false);
      
      const existingFeeder = { _id: 'existing123', ...validFeederData };
      mockFeeder.findOne.mockResolvedValue(existingFeeder as any);

      await createFeeder(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder already exists in this Business Hub.'
      });
      expect(mockFeeder.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockReq.body = validFeederData;
      mockIsBlank.mockReturnValue(false);
      mockFeeder.findOne.mockRejectedValue(new Error('Database error'));

      await createFeeder(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Failed to create feeder.'
      });
    });
  });

  describe('getAllFeeders', () => {
    it('should fetch all feeders with populated data', async () => {
      const mockFeeders = [
        {
          _id: 'feeder1',
          name: 'Feeder 1',
          businessHub: { name: 'BH1', region: { name: 'Region1' } }
        },
        {
          _id: 'feeder2',
          name: 'Feeder 2',
          businessHub: { name: 'BH2', region: { name: 'Region2' } }
        }
      ];

      const mockPopulate = jest.fn().mockResolvedValue(mockFeeders);
      mockFeeder.find.mockReturnValue({ populate: mockPopulate } as any);

      await getAllFeeders(mockReq as Request, mockRes as Response);

      expect(mockFeeder.find).toHaveBeenCalledWith();
      expect(mockPopulate).toHaveBeenCalledWith({
        path: 'businessHub',
        select: 'name region',
        populate: {
          path: 'region',
          select: 'name'
        }
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockFeeders);
    });

    it('should handle database errors', async () => {
      const mockPopulate = jest.fn().mockRejectedValue(new Error('Database error'));
      mockFeeder.find.mockReturnValue({ populate: mockPopulate } as any);

      await getAllFeeders(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Failed to fetch feeders.'
      });
    });
  });

  describe('getFeeder', () => {
    it('should fetch a specific feeder by ID', async () => {
      const feederId = 'feeder123';
      mockReq.params = { id: feederId };
      
      const mockFeederData = {
        _id: feederId,
        name: 'Test Feeder',
        businessHub: { name: 'Test BH', region: { name: 'Test Region' } }
      };

      const mockPopulate = jest.fn().mockResolvedValue(mockFeederData);
      mockFeeder.findById.mockReturnValue({ populate: mockPopulate } as any);

      await getFeeder(mockReq as Request, mockRes as Response);

      expect(mockFeeder.findById).toHaveBeenCalledWith(feederId);
      expect(mockPopulate).toHaveBeenCalledWith({
        path: 'businessHub',
        select: 'name region',
        populate: {
          path: 'region',
          select: 'name'
        }
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockFeederData);
    });

    it('should return 404 when feeder not found', async () => {
      const feederId = 'nonexistent';
      mockReq.params = { id: feederId };

      const mockPopulate = jest.fn().mockResolvedValue(null);
      mockFeeder.findById.mockReturnValue({ populate: mockPopulate } as any);

      await getFeeder(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder not found.'
      });
    });

    it('should handle database errors', async () => {
      mockReq.params = { id: 'feeder123' };
      const mockPopulate = jest.fn().mockRejectedValue(new Error('Database error'));
      mockFeeder.findById.mockReturnValue({ populate: mockPopulate } as any);

      await getFeeder(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Failed to fetch feeder.'
      });
    });
  });

  describe('updateFeeder', () => {
    const feederId = 'feeder123';
    const updateData = {
      name: 'Updated Feeder',
      businessHub: 'Updated BH',
      region: 'Updated Region',
      band: 'B16H',
      dailyEnergyUptake: 150,
      monthlyDeliveryPlan: 4000,
      previousMonthConsumption: 3500
    };

    it('should update feeder successfully', async () => {
      mockReq.params = { id: feederId };
      mockReq.body = updateData;

      const mockFeederDoc = {
        _id: feederId,
        name: 'Old Feeder',
        businessHub: 'Old BH',
        region: 'Old Region',
        band: 'A20H',
        dailyEnergyUptake: 100,
        monthlyDeliveryPlan: 3000,
        previousMonthConsumption: 2800,
        save: jest.fn().mockResolvedValue(true)
      };

      mockFeeder.findById.mockResolvedValue(mockFeederDoc as any);
      mockFeeder.findOne.mockResolvedValue(null); // No conflict

      await updateFeeder(mockReq as Request, mockRes as Response);

      expect(mockFeeder.findById).toHaveBeenCalledWith(feederId);
      expect(mockFeeder.findOne).toHaveBeenCalledWith({
        name: updateData.name.trim(),
        businessHub: updateData.businessHub.trim(),
        region: updateData.region.trim(),
        _id: { $ne: feederId }
      });
      expect(mockFeederDoc.save).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder updated successfully.',
        feeder: mockFeederDoc
      });
    });

    it('should return 404 when feeder not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = updateData;
      
      mockFeeder.findById.mockResolvedValue(null);

      await updateFeeder(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder not found.'
      });
    });

    it('should return 400 when update would create duplicate', async () => {
      mockReq.params = { id: feederId };
      mockReq.body = updateData;

      const mockFeederDoc = { _id: feederId, save: jest.fn() };
      const conflictFeeder = { _id: 'other123' };

      mockFeeder.findById.mockResolvedValue(mockFeederDoc as any);
      mockFeeder.findOne.mockResolvedValue(conflictFeeder as any);

      await updateFeeder(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder with this name, business hub and region already exists.'
      });
      expect(mockFeederDoc.save).not.toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      mockReq.params = { id: feederId };
      mockReq.body = { name: 'Partial Update', dailyEnergyUptake: 200 };

      const mockFeederDoc = {
        _id: feederId,
        name: 'Old Name',
        dailyEnergyUptake: 100,
        save: jest.fn().mockResolvedValue(true)
      };

      mockFeeder.findById.mockResolvedValue(mockFeederDoc as any);

      await updateFeeder(mockReq as Request, mockRes as Response);

      expect(mockFeederDoc.name).toBe('Partial Update');
      expect(mockFeederDoc.dailyEnergyUptake).toBe(200);
      expect(mockFeederDoc.save).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteFeeder', () => {
    it('should delete feeder successfully', async () => {
      const feederId = 'feeder123';
      mockReq.params = { id: feederId };

      const mockFeederDoc = { _id: feederId, name: 'Test Feeder' };
      mockFeeder.findById.mockResolvedValue(mockFeederDoc as any);
      mockFeeder.findByIdAndDelete.mockResolvedValue(mockFeederDoc as any);

      await deleteFeeder(mockReq as Request, mockRes as Response);

      expect(mockFeeder.findById).toHaveBeenCalledWith(feederId);
      expect(mockFeeder.findByIdAndDelete).toHaveBeenCalledWith(feederId);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder deleted successfully.'
      });
    });

    it('should return 404 when feeder not found', async () => {
      const feederId = 'nonexistent';
      mockReq.params = { id: feederId };

      mockFeeder.findById.mockResolvedValue(null);

      await deleteFeeder(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder not found.'
      });
      expect(mockFeeder.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockReq.params = { id: 'feeder123' };
      mockFeeder.findById.mockRejectedValue(new Error('Database error'));

      await deleteFeeder(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Failed to delete feeder.'
      });
    });
  });

  describe('filterFeedersByRegion', () => {
    it('should filter feeders by region successfully', async () => {
      const regionName = 'Test Region';
      mockReq.query = { region: regionName };

      const mockRegionDoc = { _id: 'region123', name: regionName };
      const mockFeeders = [
        { _id: 'feeder1', name: 'Feeder 1', region: mockRegionDoc }
      ];

      mockRegion.findOne.mockResolvedValue(mockRegionDoc as any);
      
      const mockPopulateBH = jest.fn().mockResolvedValue(mockFeeders);
      const mockPopulateRegion = jest.fn().mockReturnValue({ populate: mockPopulateBH });
      const mockSelect = jest.fn().mockReturnValue({ populate: mockPopulateRegion });
      mockFeeder.find.mockReturnValue({ select: mockSelect } as any);

      await filterFeedersByRegion(mockReq as Request, mockRes as Response);

      expect(mockRegion.findOne).toHaveBeenCalledWith({
        name: { $regex: new RegExp(`^${regionName}$`, 'i') }
      });
      expect(mockFeeder.find).toHaveBeenCalledWith({ region: mockRegionDoc._id });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockFeeders);
    });

    it('should return 400 when region parameter is missing', async () => {
      mockReq.query = { region: '' };

      await filterFeedersByRegion(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Kindly input a region.'
      });
    });

    it('should return 404 when region not found', async () => {
      mockReq.query = { region: 'Nonexistent Region' };
      mockRegion.findOne.mockResolvedValue(null);

      await filterFeedersByRegion(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Region not found.'
      });
    });

    it('should return 404 when no feeders found in region', async () => {
      mockReq.query = { region: 'Empty Region' };
      
      const mockRegionDoc = { _id: 'region123', name: 'Empty Region' };
      mockRegion.findOne.mockResolvedValue(mockRegionDoc as any);
      
      const mockPopulateBH = jest.fn().mockResolvedValue([]);
      const mockPopulateRegion = jest.fn().mockReturnValue({ populate: mockPopulateBH });
      const mockSelect = jest.fn().mockReturnValue({ populate: mockPopulateRegion });
      mockFeeder.find.mockReturnValue({ select: mockSelect } as any);

      await filterFeedersByRegion(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'No feeders found under that region.'
      });
    });
  });

  describe('filterFeedersByBusinessHub', () => {
    it('should filter feeders by business hub successfully', async () => {
      const bhName = 'Test BH';
      mockReq.query = { businessHub: bhName };

      const mockBHDoc = { _id: 'bh123', name: bhName };
      const mockFeeders = [
        { _id: 'feeder1', name: 'Feeder 1', businessHub: mockBHDoc }
      ];

      mockBusinessHub.findOne.mockResolvedValue(mockBHDoc as any);
      
      const mockPopulateRegion = jest.fn().mockResolvedValue(mockFeeders);
      const mockPopulateBH = jest.fn().mockReturnValue({ populate: mockPopulateRegion });
      const mockSelect = jest.fn().mockReturnValue({ populate: mockPopulateBH });
      mockFeeder.find.mockReturnValue({ select: mockSelect } as any);

      await filterFeedersByBusinessHub(mockReq as Request, mockRes as Response);

      expect(mockBusinessHub.findOne).toHaveBeenCalledWith({
        name: { $regex: new RegExp(`^${bhName}$`, 'i') }
      });
      expect(mockFeeder.find).toHaveBeenCalledWith({ businessHub: mockBHDoc._id });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockFeeders);
    });

    it('should return 400 when business hub parameter is missing', async () => {
      mockReq.query = { businessHub: '' };

      await filterFeedersByBusinessHub(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Kindly input a business hub.'
      });
    });

    it('should return 404 when business hub not found', async () => {
      mockReq.query = { businessHub: 'Nonexistent BH' };
      mockBusinessHub.findOne.mockResolvedValue(null);

      await filterFeedersByBusinessHub(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Business Hub not found.'
      });
    });
  });

  describe('filterFeedersByBand', () => {
    it('should filter feeders by band successfully', async () => {
      const band = 'A20H';
      mockReq.query = { band };

      const mockFeeders = [
        { _id: 'feeder1', name: 'Feeder 1', band }
      ];

      mockIsBlank.mockReturnValue(false);
      mockFeeder.find.mockResolvedValue(mockFeeders as any);

      await filterFeedersByBand(mockReq as Request, mockRes as Response);

      expect(mockFeeder.find).toHaveBeenCalledWith({
        band: { $regex: new RegExp(`^${band.trim()}$`, 'i') }
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockFeeders);
    });

    it('should return 400 when band parameter is missing', async () => {
      mockReq.query = { band: '' };
      mockIsBlank.mockReturnValue(true);

      await filterFeedersByBand(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Kindly input a band.'
      });
    });

    it('should return 404 when no feeders found for band', async () => {
      mockReq.query = { band: 'X99H' };
      mockIsBlank.mockReturnValue(false);
      mockFeeder.find.mockResolvedValue([]);

      await filterFeedersByBand(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'No feeders found under that band.'
      });
    });
  });

  describe('filterFeedersByBHAndRegion', () => {
    it('should filter feeders by both business hub and region', async () => {
      const regionName = 'Test Region';
      const bhName = 'Test BH';
      mockReq.query = { region: regionName, businessHub: bhName };

      const mockRegionDoc = { _id: 'region123', name: regionName };
      const mockBHDoc = { _id: 'bh123', name: bhName };
      const mockFeeders = [
        { _id: 'feeder1', name: 'Feeder 1', region: mockRegionDoc, businessHub: mockBHDoc }
      ];

      mockRegion.findOne.mockResolvedValue(mockRegionDoc as any);
      mockBusinessHub.findOne.mockResolvedValue(mockBHDoc as any);
      
      const mockPopulateRegion = jest.fn().mockResolvedValue(mockFeeders);
      const mockPopulateBH = jest.fn().mockReturnValue({ populate: mockPopulateRegion });
      mockFeeder.find.mockReturnValue({ populate: mockPopulateBH } as any);

      await filterFeedersByBHAndRegion(mockReq as Request, mockRes as Response);

      expect(mockFeeder.find).toHaveBeenCalledWith({
        region: mockRegionDoc._id,
        businessHub: mockBHDoc._id
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockFeeders);
    });

    it('should filter by region only when business hub not provided', async () => {
      const regionName = 'Test Region';
      mockReq.query = { region: regionName };

      const mockRegionDoc = { _id: 'region123', name: regionName };
      const mockFeeders = [{ _id: 'feeder1', name: 'Feeder 1' }];

      mockRegion.findOne.mockResolvedValue(mockRegionDoc as any);
      
      const mockPopulateRegion = jest.fn().mockResolvedValue(mockFeeders);
      const mockPopulateBH = jest.fn().mockReturnValue({ populate: mockPopulateRegion });
      mockFeeder.find.mockReturnValue({ populate: mockPopulateBH } as any);

      await filterFeedersByBHAndRegion(mockReq as Request, mockRes as Response);

      expect(mockFeeder.find).toHaveBeenCalledWith({
        region: mockRegionDoc._id
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when region not found', async () => {
      mockReq.query = { region: 'Nonexistent Region' };
      mockRegion.findOne.mockResolvedValue(null);

      await filterFeedersByBHAndRegion(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Region not found.'
      });
    });

    it('should return 404 when business hub not found', async () => {
      mockReq.query = { businessHub: 'Nonexistent BH' };
      mockBusinessHub.findOne.mockResolvedValue(null);

      await filterFeedersByBHAndRegion(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Business Hub not found.'
      });
    });

    it('should return 404 when no feeders match filters', async () => {
      const regionName = 'Test Region';
      const bhName = 'Test BH';
      mockReq.query = { region: regionName, businessHub: bhName };

      const mockRegionDoc = { _id: 'region123', name: regionName };
      const mockBHDoc = { _id: 'bh123', name: bhName };

      mockRegion.findOne.mockResolvedValue(mockRegionDoc as any);
      mockBusinessHub.findOne.mockResolvedValue(mockBHDoc as any);
      
      const mockPopulateRegion = jest.fn().mockResolvedValue([]);
      const mockPopulateBH = jest.fn().mockReturnValue({ populate: mockPopulateRegion });
      mockFeeder.find.mockReturnValue({ populate: mockPopulateBH } as any);

      await filterFeedersByBHAndRegion(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'No feeders found for those filters.'
      });
    });
  });
});