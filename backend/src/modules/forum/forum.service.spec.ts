import { Test } from '@nestjs/testing';
import { ForumService } from './forum.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';

const mockThread = {
  id: 'thread-1',
  title: 'Test Thread',
  category: 'general',
  isPinned: false,
  author: { id: 'user-1', name: 'Test', avatarUrl: null, karma: 0 },
  _count: { comments: 0, votes: 0 },
};

const mockPrisma = {
  forumThread: {
    findMany: jest.fn().mockResolvedValue([mockThread]),
    findUnique: jest.fn().mockResolvedValue({
      ...mockThread,
      comments: [],
      votes: [],
    }),
    create: jest.fn().mockResolvedValue(mockThread),
  },
  user: {
    upsert: jest.fn().mockResolvedValue({ id: 'user-1' }),
  },
};

describe('ForumService', () => {
  let service: ForumService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ForumService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ForumService);
  });

  it('findAll returns threads array', async () => {
    const result = await service.findAll();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('findAll passes category filter', async () => {
    await service.findAll('general');
    expect(mockPrisma.forumThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ category: 'general' }) }),
    );
  });

  it('findOne returns thread by id', async () => {
    const result = await service.findOne('thread-1');
    expect(result).toBeDefined();
    expect(result.id).toBe('thread-1');
  });

  it('findOne throws NotFoundException when not found', async () => {
    mockPrisma.forumThread.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });
});
