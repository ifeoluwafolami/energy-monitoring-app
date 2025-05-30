import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  createFeederReading,
  getAllFeederReadings,
  getReadingsByFeeder,
  getFeederReadingsByDate,
  getReadingsByRegionOrHub,
  getFeederReading,
  updateFeederReading,
  deleteFeederReading,
  submitTodayReadings
} from '../controllers/feederReading.controller';
import { FeederReading } from '../models/feederReading.model';
import { Feeder } from '../models/feeder.model';
import { isBlank } from '../utils/isBlank';

// Mock dependencies
jest.mock('../models/feederReading.model');
jest.mock('../models/feeder.model');
jest.mock('../utils/isBlank');
jest.mock('mongoose');

const mockFeederReading = FeederReading as jest.Mocked<typeof FeederReading>;
const mockFeeder = Feeder as jest.Mocked<typeof Feeder>;
const mockIsBlank = isBlank as jest.MockedFunction<typeof isBlank>;

// Mock console.error to avoid noise in tests
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('FeederReading Controller', () => {
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
      query: {},
      user: { _id: 'user123' }
    };
    
    mockRes = {
      status: mockStatus,
      json: mockJson
    };

    jest.clearAllMocks();
  });

  describe('createFeederReading', () => {
    const validReadingData = {
      date: '2024-01-15',
      cumulativeEnergyConsumption: 1500
    };

    it('should create a feeder reading successfully', async () => {
      mockReq.body = validReadingData;
      mockReq.params = { feederId: 'feeder123' };
      mockReq.user = { _id: 'user123' };

      mockIsBlank.mockReturnValue(false);
      
      const createdReading = {
        _id: 'reading123',
        date: new Date(validReadingData.date),
        feeder: 'feeder123',
        cumulativeEnergyConsumption: validReadingData.cumulativeEnergyConsumption,
        recordedBy: 'user123',
        history: []
      };
      
      mockFeederReading.create.mockResolvedValue(createdReading as any);

      await createFeederReading(mockReq as Request, mockRes as Response);

      expect(mockFeederReading.create).toHaveBeenCalledWith({
        date: new Date(validReadingData.date),
        feeder: 'feeder123',
        cumulativeEnergyConsumption: validReadingData.cumulativeEnergyConsumption,
        recordedBy: 'user123',
        history: []
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder reading created successfully.'
      });
    });

    it('should return 400 when required fields are missing', async () => {
      mockReq.body = { date: '2024-01-15' }; // Missing cumulativeEnergyConsumption
      mockReq.params = { feederId: 'feeder123' };
      
      mockIsBlank.mockImplementation((value) => value === undefined || value === null || value === '');

      await createFeederReading(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Date, feeder and energy are required.'
      });
      expect(mockFeederReading.create).not.toHaveBeenCalled();
    });

    it('should return 400 when date is blank', async () => {
      mockReq.body = { date: '', cumulativeEnergyConsumption: 1500 };
      mockReq.params = { feederId: 'feeder123' };
      
      mockIsBlank.mockImplementation((value) => value === '');

      await createFeederReading(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Date, feeder and energy are required.'
      });
    });

    it('should handle database errors', async () => {
      mockReq.body = validReadingData;
      mockReq.params = { feederId: 'feeder123' };
      mockReq.user = { _id: 'user123' };

      mockIsBlank.mockReturnValue(false);
      mockFeederReading.create.mockRejectedValue(new Error('Database error'));

      await createFeederReading(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Failed to create feeder reading.'
      });
    });
  });

  describe('getAllFeederReadings', () => {
    it('should fetch all feeder readings with pagination', async () => {
      mockReq.query = { page: '2', limit: '5' };

      const mockReadings = [
        { _id: 'reading1', date: new Date(), cumulativeEnergyConsumption: 1000 },
        { _id: 'reading2', date: new Date(), cumulativeEnergyConsumption: 1100 }
      ];

      mockFeederReading.countDocuments.mockResolvedValue(20);
      
      const mockLimit = jest.fn().mockResolvedValue(mockReadings);
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockPopulateRecordedBy = jest.fn().mockReturnValue({ sort: mockSort });
      const mockPopulateFeeder = jest.fn().mockReturnValue({ populate: mockPopulateRecordedBy });
      mockFeederReading.find.mockReturnValue({ populate: mockPopulateFeeder } as any);

      await getAllFeederReadings(mockReq as Request, mockRes as Response);

      expect(mockFeederReading.countDocuments).toHaveBeenCalled();
      expect(mockFeederReading.find).toHaveBeenCalled();
      expect(mockPopulateFeeder).toHaveBeenCalledWith('feeder', 'name businessHub region');
      expect(mockPopulateRecordedBy).toHaveBeenCalledWith('recordedBy', 'name email');
      expect(mockSort).toHaveBeenCalledWith({ date: -1 });
      expect(mockSkip).toHaveBeenCalledWith(5); // (page 2 - 1) * limit 5
      expect(mockLimit).toHaveBeenCalledWith(5);
      
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        total: 20,
        page: 2,
        pages: 4, // Math.ceil(20/5)
        data: mockReadings
      });
    });

    it('should use default pagination values', async () => {
      mockReq.query = {};

      mockFeederReading.countDocuments.mockResolvedValue(15);
      
      const mockLimit = jest.fn().mockResolvedValue([]);
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockPopulateRecordedBy = jest.fn().mockReturnValue({ sort: mockSort });
      const mockPopulateFeeder = jest.fn().mockReturnValue({ populate: mockPopulateRecordedBy });
      mockFeederReading.find.mockReturnValue({ populate: mockPopulateFeeder } as any);

      await getAllFeederReadings(mockReq as Request, mockRes as Response);

      expect(mockSkip).toHaveBeenCalledWith(0); // (page 1 - 1) * limit 10
      expect(mockLimit).toHaveBeenCalledWith(10); // default limit
      expect(mockJson).toHaveBeenCalledWith({
        total: 15,
        page: 1,
        pages: 2, // Math.ceil(15/10)
        data: []
      });
    });

    it('should handle database errors', async () => {
      mockFeederReading.countDocuments.mockRejectedValue(new Error('Database error'));

      await getAllFeederReadings(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Failed to fetch feeder readings.'
      });
    });
  });

  describe('getReadingsByFeeder', () => {
    it('should fetch readings for a specific feeder with pagination', async () => {
      const feederId = 'feeder123';
      mockReq.params = { feederId };
      mockReq.query = { page: '1', limit: '5' };

      const mockReadings = [
        { _id: 'reading1', feeder: feederId, cumulativeEnergyConsumption: 1000 }
      ];

      mockFeederReading.countDocuments.mockResolvedValue(8);
      
      const mockLimit = jest.fn().mockResolvedValue(mockReadings);
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      mockFeederReading.find.mockReturnValue({ sort: mockSort } as any);

      await getReadingsByFeeder(mockReq as Request, mockRes as Response);

      expect(mockFeederReading.countDocuments).toHaveBeenCalledWith({ feeder: feederId });
      expect(mockFeederReading.find).toHaveBeenCalledWith({ feeder: feederId });
      expect(mockSort).toHaveBeenCalledWith({ date: -1 });
      expect(mockSkip).toHaveBeenCalledWith(0);
      expect(mockLimit).toHaveBeenCalledWith(5);
      
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        total: 8,
        page: 1,
        pages: 2, // Math.ceil(8/5)
        data: mockReadings
      });
    });

    it('should handle database errors', async () => {
      mockReq.params = { feederId: 'feeder123' };
      mockFeederReading.countDocuments.mockRejectedValue(new Error('Database error'));

      await getReadingsByFeeder(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Failed to get readings for feeder.'
      });
    });
  });

  describe('getFeederReadingsByDate', () => {
    it('should fetch reading by feeder and date', async () => {
      const feederId = 'feeder123';
      const date = '2024-01-15';
      mockReq.params = { feederId };
      mockReq.query = { date };

      const mockReading = {
        _id: 'reading123',
        feeder: feederId,
        date: new Date(date),
        cumulativeEnergyConsumption: 1500
      };

      mockFeederReading.findOne.mockResolvedValue(mockReading as any);

      await getFeederReadingsByDate(mockReq as Request, mockRes as Response);

      expect(mockFeederReading.findOne).toHaveBeenCalledWith({
        feeder: feederId,
        date: new Date(date)
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockReading);
    });

    it('should return 400 when date is missing', async () => {
      mockReq.params = { feederId: 'feeder123' };
      mockReq.query = {};

      await getFeederReadingsByDate(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Date is required.'
      });
      expect(mockFeederReading.findOne).not.toHaveBeenCalled();
    });

    it('should return 404 when reading not found', async () => {
      mockReq.params = { feederId: 'feeder123' };
      mockReq.query = { date: '2024-01-15' };
      
      mockFeederReading.findOne.mockResolvedValue(null);

      await getFeederReadingsByDate(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'No reading found for the given date.'
      });
    });

    it('should handle database errors', async () => {
      mockReq.params = { feederId: 'feeder123' };
      mockReq.query = { date: '2024-01-15' };
      
      mockFeederReading.findOne.mockRejectedValue(new Error('Database error'));

      await getFeederReadingsByDate(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Failed to fetch feeder reading by date.'
      });
    });
  });

  describe('getReadingsByRegionOrHub', () => {
    it('should fetch readings by region and date range', async () => {
      mockReq.query = {
        region: 'region123',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        page: '1',
        limit: '10'
      };

      const mockFeeders = [
        { _id: 'feeder1' },
        { _id: 'feeder2' }
      ];
      const mockReadings = [
        { _id: 'reading1', feeder: 'feeder1' }
      ];

      const mockSelect = jest.fn().mockResolvedValue(mockFeeders);
      mockFeeder.find.mockReturnValue({ select: mockSelect } as any);
      
      mockFeederReading.countDocuments.mockResolvedValue(5);
      
      const mockLimit = jest.fn().mockResolvedValue(mockReadings);
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockPopulateRecordedBy = jest.fn().mockReturnValue({ sort: mockSort });
      const mockPopulateFeeder = jest.fn().mockReturnValue({ populate: mockPopulateRecordedBy });
      mockFeederReading.find.mockReturnValue({ populate: mockPopulateFeeder } as any);

      await getReadingsByRegionOrHub(mockReq as Request, mockRes as Response);

      expect(mockFeeder.find).toHaveBeenCalledWith({ region: 'region123' });
      expect(mockFeederReading.countDocuments).toHaveBeenCalledWith({
        feeder: { $in: ['feeder1', 'feeder2'] },
        date: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-01-31')
        }
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        total: 5,
        page: 1,
        pages: 1,
        data: mockReadings
      });
    });

    it('should fetch readings by business hub and single date', async () => {
      mockReq.query = {
        businessHub: 'bh123',
        startDate: '2024-01-15'
      };

      const mockFeeders = [{ _id: 'feeder1' }];
      const mockSelect = jest.fn().mockResolvedValue(mockFeeders);
      mockFeeder.find.mockReturnValue({ select: mockSelect } as any);
      
      mockFeederReading.countDocuments.mockResolvedValue(3);
      
      const mockLimit = jest.fn().mockResolvedValue([]);
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      const mockPopulateRecordedBy = jest.fn().mockReturnValue({ sort: mockSort });
      const mockPopulateFeeder = jest.fn().mockReturnValue({ populate: mockPopulateRecordedBy });
      mockFeederReading.find.mockReturnValue({ populate: mockPopulateFeeder } as any);

      await getReadingsByRegionOrHub(mockReq as Request, mockRes as Response);

      expect(mockFeeder.find).toHaveBeenCalledWith({ businessHub: 'bh123' });
      expect(mockFeederReading.countDocuments).toHaveBeenCalledWith({
        feeder: { $in: ['feeder1'] },
        date: new Date('2024-01-15')
      });
    });

    it('should return 400 when neither region nor businessHub provided', async () => {
      mockReq.query = { startDate: '2024-01-15' };

      await getReadingsByRegionOrHub(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Provide either region or businessHub.'
      });
    });

    it('should return 400 when no date provided', async () => {
      mockReq.query = { region: 'region123' };

      const mockSelect = jest.fn().mockResolvedValue([]);
      mockFeeder.find.mockReturnValue({ select: mockSelect } as any);

      await getReadingsByRegionOrHub(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Provide a date or date range.'
      });
    });

    it('should handle database errors', async () => {
      mockReq.query = { region: 'region123', startDate: '2024-01-15' };
      
      const mockSelect = jest.fn().mockRejectedValue(new Error('Database error'));
      mockFeeder.find.mockReturnValue({ select: mockSelect } as any);

      await getReadingsByRegionOrHub(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Internal server error.'
      });
    });
  });

  describe('getFeederReading', () => {
    it('should fetch a specific feeder reading by ID', async () => {
      const readingId = 'reading123';
      mockReq.params = { id: readingId };

      const mockReading = {
        _id: readingId,
        date: new Date(),
        cumulativeEnergyConsumption: 1500,
        feeder: { name: 'Test Feeder' },
        recordedBy: { name: 'John Doe', email: 'john@example.com' }
      };

      const mockPopulateRecordedBy = jest.fn().mockResolvedValue(mockReading);
      const mockPopulateFeeder = jest.fn().mockReturnValue({ populate: mockPopulateRecordedBy });
      mockFeederReading.findById.mockReturnValue({ populate: mockPopulateFeeder } as any);

      await getFeederReading(mockReq as Request, mockRes as Response);

      expect(mockFeederReading.findById).toHaveBeenCalledWith(readingId);
      expect(mockPopulateFeeder).toHaveBeenCalledWith('feeder', 'name');
      expect(mockPopulateRecordedBy).toHaveBeenCalledWith('recordedBy', 'name email');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder reading fetched successfully.',
        reading: mockReading
      });
    });

    it('should return 404 when reading not found', async () => {
      mockReq.params = { id: 'nonexistent' };

      const mockPopulateRecordedBy = jest.fn().mockResolvedValue(null);
      const mockPopulateFeeder = jest.fn().mockReturnValue({ populate: mockPopulateRecordedBy });
      mockFeederReading.findById.mockReturnValue({ populate: mockPopulateFeeder } as any);

      await getFeederReading(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder reading not found.'
      });
    });

    it('should handle database errors', async () => {
      mockReq.params = { id: 'reading123' };

      const mockPopulateFeeder = jest.fn().mockRejectedValue(new Error('Database error'));
      mockFeederReading.findById.mockReturnValue({ populate: mockPopulateFeeder } as any);

      await getFeederReading(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Failed to fetch feeder reading.'
      });
    });
  });

  describe('updateFeederReading', () => {
    it('should update feeder reading and add to history', async () => {
      const readingId = 'reading123';
      const newConsumption = 1800;
      mockReq.params = { id: readingId };
      mockReq.body = { cumulativeEnergyConsumption: newConsumption };
      mockReq.user = { _id: 'user123' };

      const mockReading = {
        _id: readingId,
        date: new Date('2024-01-15'),
        cumulativeEnergyConsumption: 1500,
        history: [],
        save: jest.fn().mockResolvedValue(true)
      };

      mockFeederReading.findById.mockResolvedValue(mockReading as any);

      await updateFeederReading(mockReq as Request, mockRes as Response);

      expect(mockFeederReading.findById).toHaveBeenCalledWith(readingId);
      expect(mockReading.history).toHaveLength(1);
      expect(mockReading.history[0]).toMatchObject({
        date: mockReading.date,
        cumulativeEnergyConsumption: 1500,
        updatedBy: 'user123'
      });
      expect(mockReading.cumulativeEnergyConsumption).toBe(newConsumption);
      expect(mockReading.save).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder reading updated successfully.',
        data: mockReading
      });
    });

    it('should return 404 when reading not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { cumulativeEnergyConsumption: 1800 };
      
      mockFeederReading.findById.mockResolvedValue(null);

      await updateFeederReading(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder reading not found.'
      });
    });

    it('should handle database errors', async () => {
      mockReq.params = { id: 'reading123' };
      mockReq.body = { cumulativeEnergyConsumption: 1800 };
      
      mockFeederReading.findById.mockRejectedValue(new Error('Database error'));

      await updateFeederReading(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Internal server error.'
      });
    });
  });

  describe('deleteFeederReading', () => {
    it('should delete feeder reading successfully', async () => {
      const readingId = 'reading123';
      mockReq.params = { id: readingId };

      const mockReading = { _id: readingId };
      mockFeederReading.findById.mockResolvedValue(mockReading as any);
      mockFeederReading.findByIdAndDelete.mockResolvedValue(mockReading as any);

      await deleteFeederReading(mockReq as Request, mockRes as Response);

      expect(mockFeederReading.findById).toHaveBeenCalledWith(readingId);
      expect(mockFeederReading.findByIdAndDelete).toHaveBeenCalledWith(readingId);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder reading deleted successfully.'
      });
    });

    it('should return 404 when reading not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      
      mockFeederReading.findById.mockResolvedValue(null);

      await deleteFeederReading(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Feeder reading not found.'
      });
      expect(mockFeederReading.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockReq.params = { id: 'reading123' };
      
      mockFeederReading.findById.mockRejectedValue(new Error('Database error'));

      await deleteFeederReading(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Internal server error.'
      });
    });
  });

  describe('submitTodayReadings', () => {
    beforeEach(() => {
      // Mock mongoose.Types.ObjectId
      (mongoose.Types.ObjectId as any) = jest.fn().mockImplementation((id) => id);
    });

    it('should submit today readings with mix of new and updated readings', async () => {
      const readings = [
        { feeder: 'feeder1', cumulativeEnergyConsumption: 1000 },
        { feeder: 'feeder2', cumulativeEnergyConsumption: 1500 }
      ];
      
      mockReq.body = { readings };
      mockReq.user = { _id: 'user123' };

      // Mock existing reading for feeder1
      const existingReading = {
        _id: 'existing1',
        feeder: 'feeder1',
        date: new Date(),
        cumulativeEnergyConsumption: 900,
        history: [],
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock no existing reading for feeder2
      mockFeederReading.findOne
        .mockResolvedValueOnce(existingReading as any) // feeder1 - existing
        .mockResolvedValueOnce(null); // feeder2 - new

      const newReadings = [
        { _id: 'new1', feeder: 'feeder2', cumulativeEnergyConsumption: 1500 }
      ];
      
      mockFeederReading.insertMany.mockResolvedValue(newReadings as any);

      await submitTodayReadings(mockReq as Request, mockRes as Response);

      expect(mockFeederReading.findOne).toHaveBeenCalledTimes(2);
      expect(existingReading.history).toHaveLength(1);
      expect(existingReading.cumulativeEnergyConsumption).toBe(1000);
      expect(existingReading.save).toHaveBeenCalled();
      
      expect(mockFeederReading.insertMany).toHaveBeenCalledWith([
        {
          feeder: 'feeder2',
          cumulativeEnergyConsumption: 1500,
          date: expect.any(Date),
          recordedBy: 'user123',
          history: []
        }
      ]);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Readings submitted successfully.',
        created: newReadings,
        updated: [existingReading]
      });
    });

    it('should return 400 when readings array is empty', async () => {
      mockReq.body = { readings: [] };

      await submitTodayReadings(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Readings are required.'
      });
    });

    it('should return 400 when readings is not an array', async () => {
      mockReq.body = { readings: 'not-an-array' };

      await submitTodayReadings(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Readings are required.'
      });
    });

    it('should return 400 when a reading is missing required fields', async () => {
    mockReq.body = {
      readings: [
        { feeder: 'feeder1' }, // Missing cumulativeEnergyConsumption
        { cumulativeEnergyConsumption: 1000 } // Missing feeder
      ]
    };
    mockReq.user = { _id: 'user123' };

    await submitTodayReadings(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Each reading must include a feeder and cumulativeEnergyConsumption.'
    });
  });

  it('should handle database errors when inserting new readings', async () => {
    const readings = [
      { feeder: 'feeder2', cumulativeEnergyConsumption: 1500 }
    ];
    mockReq.body = { readings };
    mockReq.user = { _id: 'user123' };

    mockFeederReading.findOne.mockResolvedValue(null);
    mockFeederReading.insertMany.mockRejectedValue(new Error('Database error'));

    await submitTodayReadings(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Server error while submitting readings.'
    });
  });

  it('should handle database errors when updating existing readings', async () => {
    const readings = [
      { feeder: 'feeder1', cumulativeEnergyConsumption: 1000 }
    ];
    mockReq.body = { readings };
    mockReq.user = { _id: 'user123' };

    const existingReading = {
      _id: 'existing1',
      feeder: 'feeder1',
      date: new Date(),
      cumulativeEnergyConsumption: 900,
      history: [],
      save: jest.fn().mockRejectedValue(new Error('Save error'))
    };

    mockFeederReading.findOne.mockResolvedValue(existingReading);

    await submitTodayReadings(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Server error while submitting readings.'
    });
  });

  it('should create all readings when none exist for today', async () => {
    const readings = [
      { feeder: 'feeder1', cumulativeEnergyConsumption: 1000 },
      { feeder: 'feeder2', cumulativeEnergyConsumption: 2000 }
    ];
    mockReq.body = { readings };
    mockReq.user = { _id: 'user123' };

    mockFeederReading.findOne.mockResolvedValue(null);
    const newReadings = [
      { _id: 'new1', feeder: 'feeder1', cumulativeEnergyConsumption: 1000 },
      { _id: 'new2', feeder: 'feeder2', cumulativeEnergyConsumption: 2000 }
    ];
    mockFeederReading.insertMany.mockResolvedValue(newReadings as any);

    await submitTodayReadings(mockReq as Request, mockRes as Response);

    expect(mockFeederReading.insertMany).toHaveBeenCalledWith([
      {
        feeder: 'feeder1',
        cumulativeEnergyConsumption: 1000,
        date: expect.any(Date),
        recordedBy: 'user123',
        history: []
      },
      {
        feeder: 'feeder2',
        cumulativeEnergyConsumption: 2000,
        date: expect.any(Date),
        recordedBy: 'user123',
        history: []
      }
    ]);
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Readings submitted successfully.',
      created: newReadings,
      updated: []
    });

});
});

});