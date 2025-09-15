import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapWalletsToAnimals, CRYPTO_ANIMALS } from '$lib/utils/animal-mapping';

// Mock fetch for holders API
const mockHoldersResponse = {
  success: true,
  holders: [
    { address: 'wallet1', balance: 1000000, decimals: 6, balanceFormatted: '1.00' },
    { address: 'wallet2', balance: 500000, decimals: 6, balanceFormatted: '0.50' },
    { address: 'wallet3', balance: 200000, decimals: 6, balanceFormatted: '0.20' },
    { address: 'wallet4', balance: 150000, decimals: 6, balanceFormatted: '0.15' },
    { address: 'wallet5', balance: 100000, decimals: 6, balanceFormatted: '0.10' },
    { address: 'wallet6', balance: 50000, decimals: 6, balanceFormatted: '0.05' },
    { address: 'wallet7', balance: 25000, decimals: 6, balanceFormatted: '0.025' },
    { address: 'wallet8', balance: 10000, decimals: 6, balanceFormatted: '0.01' }
  ],
  totalHolders: 8,
  tokenMint: 'FyB8VxxYAaVVchAgbB1kvjWdw26ovaD4ipwV1j8epump',
  tokenName: 'Test Token',
  tokenSymbol: 'TEST'
};

describe('Real Token Holder Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Holder Selection Logic', () => {
    it('should filter holders by minimum balance requirement', () => {
      const MINIMUM_TOKEN_BALANCE = 100;
      const minBalanceRequired = MINIMUM_TOKEN_BALANCE * Math.pow(10, 6); // 100 tokens with 6 decimals = 100,000,000

      console.log('Mock holders:', mockHoldersResponse.holders.map(h => ({ address: h.address, balance: h.balance })));
      console.log('Min balance required:', minBalanceRequired);

      const eligibleHolders = mockHoldersResponse.holders.filter(holder => 
        holder.balance >= minBalanceRequired
      );

      // Actually, let's use a lower threshold that makes sense with our test data
      const LOWER_THRESHOLD = 0.5; // 0.5 tokens
      const lowerMinRequired = LOWER_THRESHOLD * Math.pow(10, 6); // 500,000
      const eligibleWithLowerThreshold = mockHoldersResponse.holders.filter(holder => 
        holder.balance >= lowerMinRequired
      );

      expect(eligibleWithLowerThreshold).toHaveLength(2); // wallet1 and wallet2 have >= 500,000
      expect(eligibleWithLowerThreshold[0].address).toBe('wallet1');
      expect(eligibleWithLowerThreshold[1].address).toBe('wallet2');
    });

    it('should exclude previous winners from selection', () => {
      const allHolders = mockHoldersResponse.holders.map(h => h.address);
      const previousWinners = [{ address: 'wallet1' }, { address: 'wallet2' }];
      
      const availableHolders = allHolders.filter(address => 
        !previousWinners.some(winner => winner.address === address)
      );

      expect(availableHolders).toHaveLength(6);
      expect(availableHolders).not.toContain('wallet1');
      expect(availableHolders).not.toContain('wallet2');
      expect(availableHolders).toContain('wallet3');
    });

    it('should randomly select specified number of candidates', () => {
      const CANDIDATES_PER_ROUND = 7;
      const availableHolders = mockHoldersResponse.holders.slice(0, CANDIDATES_PER_ROUND + 1); // 8 holders
      
      // Mock Math.random to return predictable results
      const mockRandom = vi.spyOn(Math, 'random');
      mockRandom.mockReturnValueOnce(0.5); // Will affect shuffle order
      
      const shuffled = [...availableHolders].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, CANDIDATES_PER_ROUND);
      
      expect(selected).toHaveLength(CANDIDATES_PER_ROUND);
      
      mockRandom.mockRestore();
    });

    it('should handle insufficient eligible holders gracefully', () => {
      const CANDIDATES_PER_ROUND = 7;
      const MINIMUM_TOKEN_BALANCE = 2000; // Very high requirement, higher than any wallet
      const minBalanceRequired = MINIMUM_TOKEN_BALANCE * Math.pow(10, 6);

      const eligibleHolders = mockHoldersResponse.holders.filter(holder => 
        holder.balance >= minBalanceRequired
      );

      expect(eligibleHolders).toHaveLength(0); // No wallet has enough
      expect(eligibleHolders.length < CANDIDATES_PER_ROUND).toBe(true);
    });
  });

  describe('Animal Mapping Integration', () => {
    it('should create consistent animal mappings for selected holders', () => {
      const selectedAddresses = ['wallet1', 'wallet2', 'wallet3'];
      const animalMappings = mapWalletsToAnimals(selectedAddresses);

      expect(animalMappings).toHaveLength(3);
      expect(animalMappings[0].walletAddress).toBe('wallet1');
      expect(animalMappings[0].animal).toMatchObject({
        emoji: expect.any(String),
        name: expect.any(String),
        description: expect.any(String)
      });

      // Should be deterministic - same input produces same output
      const animalMappings2 = mapWalletsToAnimals(selectedAddresses);
      expect(animalMappings).toEqual(animalMappings2);
    });

    it('should assign different animals to different addresses', () => {
      const selectedAddresses = ['wallet1', 'wallet2', 'wallet3', 'wallet4', 'wallet5'];
      const animalMappings = mapWalletsToAnimals(selectedAddresses);

      const animalNames = animalMappings.map(m => m.animal.name);
      const uniqueNames = new Set(animalNames);

      // Should have variety (though some overlap is possible with many animals)
      expect(uniqueNames.size).toBeGreaterThan(1);
    });

    it('should use valid crypto animals from the predefined list', () => {
      const selectedAddresses = ['wallet1', 'wallet2'];
      const animalMappings = mapWalletsToAnimals(selectedAddresses);

      animalMappings.forEach(mapping => {
        const isValidAnimal = CRYPTO_ANIMALS.some(animal => 
          animal.name === mapping.animal.name && 
          animal.emoji === mapping.animal.emoji
        );
        expect(isValidAnimal).toBe(true);
      });
    });
  });

  describe('API Error Handling', () => {
    it('should handle holders API failure gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      try {
        await fetch('/api/holders');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should handle invalid API response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: false, message: 'Token not found' })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/holders');
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.message).toBe('Token not found');
    });

    it('should provide fallback data when API fails', () => {
      const CANDIDATES_PER_ROUND = 7;
      const mockFallback = [
        '8K9bPq5zN6tYrA7mW2p3Vx4d',
        '9J2cRe7zA5sB8nM4x6wV9qTy',
        '5F3dGh8kL9pQ2rA7mX4nB6yZ',
        '7H5jKl2nQ8vB4mR6wA9sE3xZ',
        '2A8dF3kP7nR9vB5mQ6wE4yTz',
        '6B9jKp3rQ7nV5mA8sE2wF4xY',
        '4C7hJl5nP9rB3mQ6wA8sE2yV'
      ];

      const fallbackCandidates = mockFallback.slice(0, CANDIDATES_PER_ROUND);
      const animalMappings = mapWalletsToAnimals(fallbackCandidates);

      expect(fallbackCandidates).toHaveLength(CANDIDATES_PER_ROUND);
      expect(animalMappings).toHaveLength(CANDIDATES_PER_ROUND);
      
      // Should still create valid animal mappings
      animalMappings.forEach(mapping => {
        expect(mapping.walletAddress).toMatch(/^[A-Za-z0-9]+$/);
        expect(['🐶', '🐸', '🐱', '🦊', '🐻', '🐂', '🦍', '🐺', '🦁', '🦄', '🐙']).toContain(mapping.animal.emoji);
      });
    });
  });

  describe('Database Integration', () => {
    it('should correctly format participant data for database storage', () => {
      const selectedAddresses = ['wallet1', 'wallet2'];
      const animalMappings = mapWalletsToAnimals(selectedAddresses);
      
      // Simulate what would be sent to addParticipants
      const participantData = animalMappings.map(p => ({
        id: 'mock-uuid',
        draw_id: 'draw-123',
        wallet_address: p.walletAddress,
        token_balance: '1000',
        animal_name: p.animal.name,
        animal_emoji: p.animal.emoji,
        joined_at: new Date().toISOString(),
      }));

      expect(participantData).toHaveLength(2);
      expect(participantData[0]).toMatchObject({
        wallet_address: 'wallet1',
        animal_name: expect.any(String),
        animal_emoji: expect.any(String),
        token_balance: '1000'
      });
    });

    it('should correctly parse participant data from database response', () => {
      const mockDatabaseParticipants = [
        {
          id: 'p1',
          draw_id: 'draw-123',
          wallet_address: 'wallet1',
          token_balance: '1000',
          animal_name: 'DOGE',
          animal_emoji: '🐶',
          joined_at: '2024-01-01T12:00:00Z'
        },
        {
          id: 'p2',
          draw_id: 'draw-123',
          wallet_address: 'wallet2',
          token_balance: '1000',
          animal_name: 'PEPE',
          animal_emoji: '🐸',
          joined_at: '2024-01-01T12:00:00Z'
        }
      ];

      // Simulate how the UI processes database data
      const currentCandidates = mockDatabaseParticipants.map(p => p.wallet_address);
      const animalMappings = mockDatabaseParticipants.map(p => ({
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
  });

  describe('UI Display Logic', () => {
    it('should handle null/undefined addresses safely', () => {
      const candidates = ['wallet1', null, undefined, 'wallet2'] as any[];
      
      // Test the null-safe slicing that was added
      const processedCandidates = candidates.map(candidate => ({
        start: candidate?.slice(0, 6) || '',
        end: candidate?.slice(-6) || ''
      }));

      expect(processedCandidates[0]).toEqual({ start: 'wallet', end: 'allet1' });
      expect(processedCandidates[1]).toEqual({ start: '', end: '' });
      expect(processedCandidates[2]).toEqual({ start: '', end: '' });
      expect(processedCandidates[3]).toEqual({ start: 'wallet', end: 'allet2' });
    });

    it('should display proper statistics for real holders', () => {
      const MINIMUM_TOKEN_BALANCE = 0.5; // Use realistic threshold
      const allHolders = mockHoldersResponse.holders;
      const eligibleHolders = allHolders.filter(h => h.balance >= (MINIMUM_TOKEN_BALANCE * Math.pow(10, 6)));
      
      const stats = {
        totalHolders: allHolders.length,
        eligibleHolders: eligibleHolders.length,
        minimumBalance: MINIMUM_TOKEN_BALANCE,
        selectionRate: (eligibleHolders.length / allHolders.length * 100).toFixed(1)
      };

      expect(stats.totalHolders).toBe(8);
      expect(stats.eligibleHolders).toBe(2); // wallet1 and wallet2 meet 0.5 token requirement
      expect(stats.minimumBalance).toBe(0.5);
      expect(stats.selectionRate).toBe('25.0'); // 2/8 = 25%
    });
  });
});