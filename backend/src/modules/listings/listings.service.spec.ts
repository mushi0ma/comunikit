import { Test } from '@nestjs/testing';
import { ListingsService } from './listings.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockPrisma = {
  listing: {
    findMany: jest.fn().mockResolvedValue([
      { id: '1', title: 'Test', type: 'sell', status: 'active', author: {} },
    ]),
    findUnique: jest.fn().mockResolvedValue({ id: '1', title: 'Test', authorId: 'user-1', author: {} }),
    create: jest.fn().mockResolvedValue({ id: '2', title: 'New', author: {} }),
    delete: jest.fn().mockResolvedValue({ id: '1' }),
  },
  user: {
    upsert: jest.fn().mockResolvedValue({ id: 'user-1' }),
  },
};

describe('ListingsService', () => {
  let service: ListingsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ListingsService);
  });

  it('findAll returns listings array', async () => {
    const result = await service.findAll();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('findAll passes type filter', async () => {
    await service.findAll({ type: 'sell' });
    expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ type: 'sell' }) }),
    );
  });

  it('findOne returns listing by id', async () => {
    const result = await service.findOne('1');
    expect(result).toBeDefined();
    expect(result.id).toBe('1');
  });

  it('findOne throws NotFoundException when not found', async () => {
    mockPrisma.listing.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('delete removes listing for owner', async () => {
    const result = await service.delete('1', 'user-1');
    expect(result).toEqual({ success: true });
    expect(mockPrisma.listing.delete).toHaveBeenCalled();
  });

  it('delete throws NotFoundException when listing missing', async () => {
    mockPrisma.listing.findUnique.mockResolvedValueOnce(null);
    await expect(service.delete('missing', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('delete throws ForbiddenException for non-owner', async () => {
    await expect(service.delete('1', 'other-user')).rejects.toThrow(ForbiddenException);
  });
});
