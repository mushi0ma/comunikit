import { Test, TestingModule } from '@nestjs/testing';
import { EnsureUserService } from './ensure-user.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('EnsureUserService', () => {
  let service: EnsureUserService;
  let prisma: { user: { upsert: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      user: {
        upsert: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Студент AITU' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnsureUserService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(EnsureUserService);
  });

  it('should call prisma.user.upsert with correct where/create', async () => {
    await service.ensureUser('user-1');

    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      update: {},
      create: {
        id: 'user-1',
        studentId: 'user-1'.slice(0, 8),
        name: 'Студент AITU',
      },
    });
  });

  it('should pass metadata into create block when provided', async () => {
    await service.ensureUser('user-2', {
      name: 'Иван',
      avatarUrl: 'https://example.com/avatar.jpg',
      telegramId: BigInt(123456),
      telegramHandle: 'ivan',
    });

    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      update: {},
      create: {
        id: 'user-2',
        studentId: 'user-2'.slice(0, 8),
        name: 'Иван',
        avatarUrl: 'https://example.com/avatar.jpg',
        telegramId: BigInt(123456),
        telegramHandle: 'ivan',
      },
    });
  });

  it('should use default name when metadata has no name', async () => {
    await service.ensureUser('user-3', { telegramHandle: 'test' });

    const call = prisma.user.upsert.mock.calls[0][0];
    expect(call.create.name).toBe('Студент AITU');
    expect(call.create.telegramHandle).toBe('test');
  });

  it('should not throw on second call (update is no-op)', async () => {
    await service.ensureUser('user-1');
    await service.ensureUser('user-1');

    expect(prisma.user.upsert).toHaveBeenCalledTimes(2);
    // Both calls have empty update block
    expect(prisma.user.upsert.mock.calls[0][0].update).toEqual({});
    expect(prisma.user.upsert.mock.calls[1][0].update).toEqual({});
  });
});
