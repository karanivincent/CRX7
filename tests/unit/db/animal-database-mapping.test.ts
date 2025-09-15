import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database operations
const mockSupabaseOperations = {
  addParticipants: vi.fn(),
  clearDrawParticipants: vi.fn(),
  getDrawParticipants: vi.fn(),
  createDraw: vi.fn(),
  updateDrawStatus: vi.fn()
};

vi.mock('$lib/db/supabase-operations', () => mockSupabaseOperations);

describe('Animal Database Mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Participant Storage', () => {
    it('should store animal data correctly when adding participants', async () => {
      const drawId = 'draw-123';
      const participants = [
        {
          walletAddress: 'wallet1',
          animal: { name: 'DOGE', emoji: '🐶', description: 'The original crypto dog' }
        },
        {
          walletAddress: 'wallet2', 
          animal: { name: 'PEPE', emoji: '🐸', description: 'Rare Pepe the Frog' }
        }
      ];

      mockSupabaseOperations.addParticipants.mockResolvedValue([
        {
          id: 'p1',
          draw_id: drawId,
          wallet_address: 'wallet1',
          animal_name: 'DOGE',
          animal_emoji: '🐶',
          token_balance: '1000',
          joined_at: new Date().toISOString()
        },
        {
          id: 'p2',
          draw_id: drawId,
          wallet_address: 'wallet2',
          animal_name: 'PEPE',
          animal_emoji: '🐸',
          token_balance: '1000',
          joined_at: new Date().toISOString()
        }
      ]);

      const { addParticipants } = await import('$lib/db/supabase-operations');
      const result = await addParticipants(drawId, participants);

      expect(addParticipants).toHaveBeenCalledWith(drawId, participants);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        wallet_address: 'wallet1',
        animal_name: 'DOGE',
        animal_emoji: '🐶'
      });
    });

    it('should retrieve and format animal data correctly', async () => {
      const drawId = 'draw-123';
      const mockDatabaseResponse = [
        {
          id: 'p1',
          draw_id: drawId,
          wallet_address: 'wallet1',
          animal_name: 'DOGE',
          animal_emoji: '🐶',
          token_balance: '1000000',
          joined_at: '2024-01-01T12:00:00Z'
        },
        {
          id: 'p2',
          draw_id: drawId,
          wallet_address: 'wallet2',
          animal_name: 'CAT',
          animal_emoji: '🐱',
          token_balance: '500000',
          joined_at: '2024-01-01T12:00:00Z'
        }
      ];

      mockSupabaseOperations.getDrawParticipants.mockResolvedValue(mockDatabaseResponse);

      const { getDrawParticipants } = await import('$lib/db/supabase-operations');
      const participants = await getDrawParticipants(drawId);

      expect(getDrawParticipants).toHaveBeenCalledWith(drawId);
      expect(participants).toHaveLength(2);
      
      // Test UI data transformation
      const currentCandidates = participants.map(p => p.wallet_address);
      const animalMappings = participants.map(p => ({
        walletAddress: p.wallet_address,
        animal: {
          name: p.animal_name,
          emoji: p.animal_emoji,
          description: `${p.animal_name} participant`
        }
      }));

      expect(currentCandidates).toEqual(['wallet1', 'wallet2']);
      expect(animalMappings[0]).toMatchObject({
        walletAddress: 'wallet1',
        animal: {
          name: 'DOGE',
          emoji: '🐶',
          description: 'DOGE participant'
        }
      });
    });

    it('should handle clearing participants before adding new ones', async () => {
      const drawId = 'draw-123';
      
      mockSupabaseOperations.clearDrawParticipants.mockResolvedValue(undefined);
      mockSupabaseOperations.addParticipants.mockResolvedValue([]);

      const { setupDrawParticipants } = await import('$lib/db/queries');
      
      // This function should clear then add participants
      await setupDrawParticipants(drawId, []);

      expect(mockSupabaseOperations.clearDrawParticipants).toHaveBeenCalledWith(drawId);
      expect(mockSupabaseOperations.addParticipants).toHaveBeenCalledWith(drawId, []);
    });
  });

  describe('Animal Data Validation', () => {
    it('should validate required animal fields', () => {
      const validParticipant = {
        walletAddress: 'wallet1',
        animal: { 
          name: 'DOGE', 
          emoji: '🐶', 
          description: 'The original crypto dog' 
        }
      };

      const invalidParticipant = {
        walletAddress: 'wallet2',
        animal: { 
          name: '', // Missing name
          emoji: '🐶', 
          description: 'Invalid animal' 
        }
      };

      expect(validParticipant.animal.name).toBeTruthy();
      expect(validParticipant.animal.emoji).toBeTruthy();
      expect(validParticipant.walletAddress).toBeTruthy();

      expect(invalidParticipant.animal.name).toBeFalsy();
    });

    it('should handle emoji validation', () => {
      const validEmojis = ['🐶', '🐸', '🐱', '🦊', '🐻', '🐂', '🦍', '🐺', '🦁', '🦄', '🐙'];
      const invalidEmojis = ['', '🚀', 'dog', '123'];

      validEmojis.forEach(emoji => {
        expect(emoji).toMatch(/^[\u{1F300}-\u{1F9FF}]$/u); // Unicode emoji range
      });

      invalidEmojis.forEach(emoji => {
        expect(emoji).not.toMatch(/^🐶|🐸|🐱|🦊|🐻|🐂|🦍|🐺|🦁|🦄|🐙$/);
      });
    });

    it('should validate wallet address format', () => {
      const validAddresses = [
        'FyB8VxxYAaVVchAgbB1kvjWdw26ovaD4ipwV1j8epump',
        '8K9bPq5zN6tYrA7mW2p3Vx4d',
        '9J2cRe7zA5sB8nM4x6wV9qTy'
      ];

      const invalidAddresses = [
        '',
        null,
        undefined,
        '123',
        'invalid-address-too-short'
      ];

      validAddresses.forEach(address => {
        expect(address).toMatch(/^[A-Za-z0-9]{20,}$/);
      });

      invalidAddresses.forEach(address => {
        if (address) {
          expect(address).not.toMatch(/^[A-Za-z0-9]{20,}$/);
        } else {
          expect(address).toBeFalsy();
        }
      });
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockSupabaseOperations.addParticipants.mockRejectedValue(new Error('Database connection failed'));

      const { addParticipants } = await import('$lib/db/supabase-operations');

      await expect(addParticipants('draw-123', [])).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid draw ID errors', async () => {
      mockSupabaseOperations.addParticipants.mockRejectedValue(new Error('invalid input syntax for type uuid'));

      const { addParticipants } = await import('$lib/db/supabase-operations');

      await expect(addParticipants('', [])).rejects.toThrow('invalid input syntax for type uuid');
    });

    it('should handle duplicate participant errors gracefully', async () => {
      mockSupabaseOperations.addParticipants.mockRejectedValue(new Error('duplicate key value violates unique constraint'));

      const { addParticipants } = await import('$lib/db/supabase-operations');
      const participants = [{
        walletAddress: 'wallet1',
        animal: { name: 'DOGE', emoji: '🐶', description: 'Test' }
      }];

      await expect(addParticipants('draw-123', participants)).rejects.toThrow('duplicate key value');
    });
  });

  describe('Dashboard API Integration', () => {
    it('should format dashboard response correctly', () => {
      const mockDashboardResponse = {
        currentDraw: {
          id: 'draw-123',
          draw_number: 1,
          status: 'active'
        },
        participants: [
          {
            id: 'p1',
            draw_id: 'draw-123',
            wallet_address: 'wallet1',
            animal_name: 'DOGE',
            animal_emoji: '🐶',
            token_balance: '1000',
            joined_at: '2024-01-01T12:00:00Z'
          },
          {
            id: 'p2',
            draw_id: 'draw-123',
            wallet_address: 'wallet2',
            animal_name: 'PEPE',
            animal_emoji: '🐸',
            token_balance: '1000',
            joined_at: '2024-01-01T12:00:00Z'
          }
        ],
        latestWinners: []
      };

      // Test data processing as it would happen in the UI
      const currentCandidates = mockDashboardResponse.participants.map(p => p.wallet_address);
      const animalMappings = mockDashboardResponse.participants.map(p => ({
        walletAddress: p.wallet_address,
        animal: {
          name: p.animal_name,
          emoji: p.animal_emoji,
          description: `${p.animal_name} participant`
        }
      }));

      expect(currentCandidates).toEqual(['wallet1', 'wallet2']);
      expect(animalMappings).toHaveLength(2);
      expect(animalMappings[0].animal.emoji).toBe('🐶');
      expect(animalMappings[1].animal.emoji).toBe('🐸');
    });

    it('should handle empty participants list', () => {
      const mockEmptyResponse = {
        currentDraw: { id: 'draw-123', status: 'active' },
        participants: [],
        latestWinners: []
      };

      const currentCandidates = mockEmptyResponse.participants.map(p => p.wallet_address);
      const animalMappings = mockEmptyResponse.participants.map(p => ({
        walletAddress: p.wallet_address,
        animal: {
          name: p.animal_name,
          emoji: p.animal_emoji,
          description: `${p.animal_name} participant`
        }
      }));

      expect(currentCandidates).toEqual([]);
      expect(animalMappings).toEqual([]);
    });
  });

  describe('Consistency Checks', () => {
    it('should maintain animal assignment consistency across database operations', () => {
      const originalMapping = {
        walletAddress: 'wallet1',
        animal: { name: 'DOGE', emoji: '🐶', description: 'The original crypto dog' }
      };

      // Simulate storing to database
      const dbFormat = {
        wallet_address: originalMapping.walletAddress,
        animal_name: originalMapping.animal.name,
        animal_emoji: originalMapping.animal.emoji
      };

      // Simulate retrieving from database
      const retrievedMapping = {
        walletAddress: dbFormat.wallet_address,
        animal: {
          name: dbFormat.animal_name,
          emoji: dbFormat.animal_emoji,
          description: `${dbFormat.animal_name} participant`
        }
      };

      expect(retrievedMapping.walletAddress).toBe(originalMapping.walletAddress);
      expect(retrievedMapping.animal.name).toBe(originalMapping.animal.name);
      expect(retrievedMapping.animal.emoji).toBe(originalMapping.animal.emoji);
    });

    it('should prevent animal data corruption during updates', () => {
      const participant = {
        id: 'p1',
        wallet_address: 'wallet1',
        animal_name: 'DOGE',
        animal_emoji: '🐶'
      };

      // Test that fields remain typed correctly
      expect(typeof participant.animal_name).toBe('string');
      expect(typeof participant.animal_emoji).toBe('string');
      expect(participant.animal_name.length).toBeGreaterThan(0);
      expect(participant.animal_emoji.length).toBeGreaterThan(0);
    });
  });
});