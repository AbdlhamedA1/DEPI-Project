import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricingService],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateQuote', () => {
    it('should calculate accurate base quote for monthly bed accommodation', async () => {
      const quote = await service.calculateQuote({
        targetEntityType: 'BED',
        targetEntityId: 'bed-1',
        durationCount: 1,
      });

      expect(quote).toBeDefined();
      expect(quote.baseRent).toBe(1200);
      expect(quote.totalRentAmount).toBe(1200);
      expect(quote.securityDeposit).toBe(600);
      expect(quote.currency).toBe('EGP');
      expect(quote.fullTenancyValue).toBeGreaterThanOrEqual(1800);
    });

    it('should scale recurring expenses and rent linearly with duration count', async () => {
      const quote1 = await service.calculateQuote({
        targetEntityType: 'BED',
        targetEntityId: 'bed-1',
        durationCount: 1,
      });

      const quote3 = await service.calculateQuote({
        targetEntityType: 'BED',
        targetEntityId: 'bed-1',
        durationCount: 3,
      });

      expect(quote3.totalRentAmount).toBe(quote1.totalRentAmount * 3);
      expect(quote3.securityDeposit).toBe(quote1.securityDeposit); // Deposit is one-time
    });

    it('should support itemized optional expenses selection', async () => {
      const exp = await service.addExpense('prop-quote-test', {
        nameAr: 'إنترنت فائق السرعة',
        nameEn: 'High-speed Fiber Internet',
        amount: 250,
        isMandatory: false,
        isRecurring: true,
      });

      const quote = await service.calculateQuote({
        targetEntityType: 'BED',
        targetEntityId: 'bed-1',
        durationCount: 2,
        selectedOptionalExpenseIds: [exp.id],
      });

      expect(quote.optionalExpenses.selectedTotal).toBe(500); // 250 * 2
      expect(quote.optionalExpenses.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: exp.id,
            amount: 250,
          }),
        ]),
      );
    });
  });

  describe('setPricing and Rate Cards', () => {
    it('should save and retrieve custom rate card in EGP', async () => {
      const customRate = await service.setPricing('ROOM', 'room-special-99', {
        amount: 4200,
        depositAmount: 2000,
        durationUnit: 'MONTHLY',
        pricingUnit: 'PER_ROOM',
        billsIncluded: false,
      });

      expect(customRate.amount).toBe(4200);
      expect(customRate.depositAmount).toBe(2000);
      expect(customRate.billsIncluded).toBe(false);

      const retrieved = await service.getPricing('ROOM', 'room-special-99');
      expect(retrieved.amount).toBe(4200);
      expect(retrieved.depositAmount).toBe(2000);
    });
  });

  describe('Expense Management', () => {
    it('should add, list, and delete additional expenses', async () => {
      const propId = 'prop-exp-test-01';
      const created = await service.addExpense(propId, {
        nameAr: 'رسوم حراسة وصيانة',
        nameEn: 'Security & Maintenance',
        amount: 300,
        isMandatory: true,
        isRecurring: true,
        billingFrequency: 'MONTHLY',
      });

      expect(created.id).toBeDefined();
      expect(created.amount).toBe(300);

      const list = await service.getExpensesByProperty(propId);
      expect(list.some(e => e.id === created.id)).toBe(true);

      const deleted = await service.deleteExpense(created.id);
      expect(deleted).toBe(true);
    });
  });
});
