import { Request, Response } from 'express';
import { createRegion, getAllRegions, getRegion, updateRegion, deleteRegion } from '../controllers/region.controller';
import { Region } from '../models/region.model';
import { isBlank } from '../utils/isBlank';

// Mock the Region model
jest.mock('../models/region.model');
const MockedRegion = Region as jest.Mocked<typeof Region>;

// Mock the isBlank utility
jest.mock('../utils/isBlank');
const mockedIsBlank = isBlank as jest.MockedFunction<typeof isBlank>;

// Mock console.error to avoid cluttering test output
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Region Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn().mockReturnThis();
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('createRegion', () => {
    beforeEach(() => {
      mockRequest = {
        body: { name: 'Test Region' }
      };
    });

    it('should create a new region successfully', async () => {
      const mockRegion = { _id: '123', name: 'Test Region' };
      
      MockedRegion.findOne.mockResolvedValue(null);
      MockedRegion.create.mockResolvedValue(mockRegion as any);

      await createRegion(mockRequest as Request, mockResponse as Response);

      expect(MockedRegion.findOne).toHaveBeenCalledWith({ name: 'Test Region' });
      expect(MockedRegion.create).toHaveBeenCalledWith({ name: 'Test Region' });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Region created successfully.',
        region: mockRegion
      });
    });

    it('should trim whitespace from region name', async () => {
      mockRequest.body.name = '  Test Region  ';
      const mockRegion = { _id: '123', name: 'Test Region' };
      
      MockedRegion.findOne.mockResolvedValue(null);
      MockedRegion.create.mockResolvedValue(mockRegion as any);

      await createRegion(mockRequest as Request, mockResponse as Response);

      expect(MockedRegion.findOne).toHaveBeenCalledWith({ name: 'Test Region' });
      expect(MockedRegion.create).toHaveBeenCalledWith({ name: 'Test Region' });
    });

    it('should return 400 if region already exists', async () => {
      const existingRegion = { _id: '123', name: 'Test Region' };
      MockedRegion.findOne.mockResolvedValue(existingRegion as any);

      await createRegion(mockRequest as Request, mockResponse as Response);

      expect(MockedRegion.findOne).toHaveBeenCalledWith({ name: 'Test Region' });
      expect(MockedRegion.create).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Region already exists.' });
    });

    it('should handle database errors', async () => {
      MockedRegion.findOne.mockRejectedValue(new Error('Database error'));

      await createRegion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error creating region.' });
      expect(console.error).toHaveBeenCalledWith('Error creating region: ', expect.any(Error));
    });
  });

  describe('getAllRegions', () => {
    beforeEach(() => {
      mockRequest = {};
    });

    it('should fetch all regions successfully', async () => {
      const mockRegions = [
        { _id: '1', name: 'Region 1' },
        { _id: '2', name: 'Region 2' }
      ];
      
      MockedRegion.find.mockResolvedValue(mockRegions as any);

      await getAllRegions(mockRequest as Request, mockResponse as Response);

      expect(MockedRegion.find).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockRegions);
    });

    it('should return empty array when no regions exist', async () => {
      MockedRegion.find.mockResolvedValue([]);

      await getAllRegions(mockRequest as Request, mockResponse as Response);

      expect(MockedRegion.find).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([]);
    });

    it('should handle database errors', async () => {
      MockedRegion.find.mockRejectedValue(new Error('Database error'));

      await getAllRegions(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Failed to fetch regions.' });
      expect(console.error).toHaveBeenCalledWith('Error fetching regions: ', expect.any(Error));
    });
  });

  describe('getRegion', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: '123' }
      };
    });

    it('should fetch a single region successfully', async () => {
      const mockRegion = { _id: '123', name: 'Test Region' };
      MockedRegion.findById.mockResolvedValue(mockRegion as any);

      await getRegion(mockRequest as Request, mockResponse as Response);

      expect(MockedRegion.findById).toHaveBeenCalledWith('123');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockRegion);
    });

    it('should return 404 if region not found', async () => {
      MockedRegion.findById.mockResolvedValue(null);

      await getRegion(mockRequest as Request, mockResponse as Response);

      expect(MockedRegion.findById).toHaveBeenCalledWith('123');
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Region not found.' });
    });

    it('should handle database errors', async () => {
      MockedRegion.findById.mockRejectedValue(new Error('Database error'));

      await getRegion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Failed to fetch region.' });
      expect(console.error).toHaveBeenCalledWith('Error fetching region: ', expect.any(Error));
    });
  });

  describe('updateRegion', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: '123' },
        body: { name: 'Updated Region' }
      };
    });

    it('should update a region successfully', async () => {
      const mockRegion = {
        _id: '123',
        name: 'Original Region',
        save: jest.fn().mockResolvedValue(true)
      };
      
      MockedRegion.findById.mockResolvedValue(mockRegion as any);
      mockedIsBlank.mockReturnValue(false);

      await updateRegion(mockRequest as Request, mockResponse as Response);

      expect(MockedRegion.findById).toHaveBeenCalledWith('123');
      expect(isBlank).toHaveBeenCalledWith('Updated Region');
      expect(mockRegion.name).toBe('Updated Region');
      expect(mockRegion.save).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Region updated successfully.',
        region: mockRegion
      });
    });

    it('should trim whitespace from updated name', async () => {
      mockRequest.body.name = '  Updated Region  ';
      const mockRegion = {
        _id: '123',
        name: 'Original Region',
        save: jest.fn().mockResolvedValue(true)
      };
      
      MockedRegion.findById.mockResolvedValue(mockRegion as any);
      mockedIsBlank.mockReturnValue(false);

      await updateRegion(mockRequest as Request, mockResponse as Response);

      expect(mockRegion.name).toBe('Updated Region');
    });

    it('should return 404 if region not found', async () => {
      MockedRegion.findById.mockResolvedValue(null);

      await updateRegion(mockRequest as Request, mockResponse as Response);

      expect(MockedRegion.findById).toHaveBeenCalledWith('123');
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Region not found.' });
    });

    it('should return 400 if name is blank', async () => {
      const mockRegion = { _id: '123', name: 'Original Region' };
      MockedRegion.findById.mockResolvedValue(mockRegion as any);
      mockedIsBlank.mockReturnValue(true);

      await updateRegion(mockRequest as Request, mockResponse as Response);

      expect(MockedRegion.findById).toHaveBeenCalledWith('123');
      expect(isBlank).toHaveBeenCalledWith('Updated Region');
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Region name cannot be blank.' });
    });

    it('should handle database errors', async () => {
      MockedRegion.findById.mockRejectedValue(new Error('Database error'));

      await updateRegion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Failed to update region.' });
      expect(console.error).toHaveBeenCalledWith('Error updating region: ', expect.any(Error));
    });

    it('should handle save operation errors', async () => {
      const mockRegion = {
        _id: '123',
        name: 'Original Region',
        save: jest.fn().mockRejectedValue(new Error('Save error'))
      };
      
      MockedRegion.findById.mockResolvedValue(mockRegion as any);
      mockedIsBlank.mockReturnValue(false);

      await updateRegion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Failed to update region.' });
    });
  });

  describe('deleteRegion', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: '123' }
      };
    });

    it('should delete a region successfully', async () => {
      const mockRegion = { _id: '123', name: 'Test Region' };
      MockedRegion.findById.mockResolvedValue(mockRegion as any);
      MockedRegion.findByIdAndDelete.mockResolvedValue(mockRegion as any);

      await deleteRegion(mockRequest as Request, mockResponse as Response);

      expect(MockedRegion.findById).toHaveBeenCalledWith('123');
      expect(MockedRegion.findByIdAndDelete).toHaveBeenCalledWith('123');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Region deleted successfully.' });
    });

    it('should return 404 if region not found', async () => {
      MockedRegion.findById.mockResolvedValue(null);

      await deleteRegion(mockRequest as Request, mockResponse as Response);

      expect(MockedRegion.findById).toHaveBeenCalledWith('123');
      expect(MockedRegion.findByIdAndDelete).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Region not found.' });
    });

    it('should handle database errors during findById', async () => {
      MockedRegion.findById.mockRejectedValue(new Error('Database error'));

      await deleteRegion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Failed to delete region.' });
      expect(console.error).toHaveBeenCalledWith('Error deleting region: ', expect.any(Error));
    });

    it('should handle database errors during deletion', async () => {
      const mockRegion = { _id: '123', name: 'Test Region' };
      MockedRegion.findById.mockResolvedValue(mockRegion as any);
      MockedRegion.findByIdAndDelete.mockRejectedValue(new Error('Delete error'));

      await deleteRegion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Failed to delete region.' });
      expect(console.error).toHaveBeenCalledWith('Error deleting region: ', expect.any(Error));
    });
  });
});