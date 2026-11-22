import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../../database/database.module';

export interface RateCardRecord {
  id: string;
  targetType: string;
  targetId: string;
  amountEgp: number;
  durationUnit: string;
  depositAmountEgp: number;
  pricingUnit: string;
  billsIncluded: boolean;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdditionalExpenseRecord {
  id: string;
  propertyId: string;
  entityType: string;
  entityId: string;
  nameAr: string;
  nameEn: string;
  amount: number;
  isMandatory: boolean;
  isRecurring: boolean;
  billingFrequency: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PricingService {
  private readonly rateCards = new Map<string, RateCardRecord>();
  private readonly expenses: AdditionalExpenseRecord[] = [];

  constructor(
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {
    this.seedDefaultRates();
  }

  private seedDefaultRates() {
    this.setPricing('PROPERTY', 'prop-1', {
      amount: 3500,
      durationUnit: 'MONTHLY',
      depositAmount: 1500,
      pricingUnit: 'PER_UNIT',
      billsIncluded: true,
    });
    this.setPricing('ROOM', 'room-1', {
      amount: 1800,
      durationUnit: 'MONTHLY',
      depositAmount: 1000,
      pricingUnit: 'PER_ROOM',
      billsIncluded: true,
    });
    this.setPricing('BED', 'bed-1', {
      amount: 1200,
      durationUnit: 'MONTHLY',
      depositAmount: 600,
      pricingUnit: 'PER_BED',
      billsIncluded: true,
    });
    this.setPricing('BED', 'bed-2', {
      amount: 1200,
      durationUnit: 'MONTHLY',
      depositAmount: 600,
      pricingUnit: 'PER_BED',
      billsIncluded: true,
    });

    this.expenses.push({
      id: 'exp-1',
      propertyId: 'prop-1',
      entityType: 'PROPERTY',
      entityId: 'prop-1',
      nameAr: 'استهلاك المياه والصيانة',
      nameEn: 'Water & Maintenance Fee',
      amount: 200,
      isMandatory: true,
      isRecurring: true,
      billingFrequency: 'MONTHLY',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.expenses.push({
      id: 'exp-2',
      propertyId: 'prop-1',
      entityType: 'PROPERTY',
      entityId: 'prop-1',
      nameAr: 'خدمة تنظيف الغرف الأسبوعية (اختياري)',
      nameEn: 'Weekly Housekeeping (Optional)',
      amount: 300,
      isMandatory: false,
      isRecurring: true,
      billingFrequency: 'MONTHLY',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  getRateMap(): Map<string, RateCardRecord> {
    return this.rateCards;
  }

  async getPricing(targetType: string, targetId: string) {
    const key = `${targetType.toUpperCase()}:${targetId}`;
    const rate = this.rateCards.get(key);
    if (!rate) {
      return {
        targetType,
        targetId,
        amountEgp: 2500,
        amount: 2500,
        durationUnit: 'MONTHLY',
        depositAmountEgp: 1000,
        depositAmount: 1000,
        pricingUnit: 'PER_PERSON',
        billsIncluded: true,
        currency: 'EGP',
      };
    }
    return {
      ...rate,
      amount: rate.amountEgp,
      depositAmount: rate.depositAmountEgp,
    };
  }

  async setPricing(targetType: string, targetId: string, data: any) {
    const key = `${targetType.toUpperCase()}:${targetId}`;
    const amount = Number(data.amount || data.amountEgp || 2500);
    const depositAmount = Number(data.depositAmount || data.depositAmountEgp || 0);

    const record: RateCardRecord = {
      id: randomUUID(),
      targetType: targetType.toUpperCase(),
      targetId,
      amountEgp: amount,
      durationUnit: data.durationUnit || 'MONTHLY',
      depositAmountEgp: depositAmount,
      pricingUnit: data.pricingUnit || 'PER_PERSON',
      billsIncluded: data.billsIncluded ?? data.utilitiesIncluded ?? true,
      currency: 'EGP',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rateCards.set(key, record);

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO pricing (id, target_type, target_id, amount_egp, duration_unit, deposit_amount_egp, bills_included)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            record.id,
            record.targetType,
            record.targetId,
            record.amountEgp,
            record.durationUnit,
            record.depositAmountEgp,
            record.billsIncluded,
          ],
        );
      } catch {}
    }

    return {
      ...record,
      amount: record.amountEgp,
      depositAmount: record.depositAmountEgp,
    };
  }

  async getExpensesByProperty(propertyId: string): Promise<AdditionalExpenseRecord[]> {
    return this.expenses.filter(e => e.propertyId === propertyId);
  }

  async addExpense(propertyId: string, data: any): Promise<AdditionalExpenseRecord> {
    const id = randomUUID();
    const newExpense: AdditionalExpenseRecord = {
      id,
      propertyId,
      entityType: data.entityType || 'PROPERTY',
      entityId: data.entityId || propertyId,
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      amount: Number(data.amount),
      isMandatory: data.isMandatory ?? true,
      isRecurring: data.isRecurring ?? true,
      billingFrequency: data.billingFrequency || 'MONTHLY',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.expenses.push(newExpense);

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO additional_expenses (id, property_id, entity_type, entity_id, name_ar, name_en, amount, is_mandatory, is_recurring, billing_frequency)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            newExpense.id,
            propertyId,
            newExpense.entityType,
            newExpense.entityId,
            newExpense.nameAr,
            newExpense.nameEn,
            newExpense.amount,
            newExpense.isMandatory,
            newExpense.isRecurring,
            newExpense.billingFrequency,
          ],
        );
      } catch {}
    }

    return newExpense;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const idx = this.expenses.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.expenses.splice(idx, 1);
      return true;
    }
    return false;
  }

  async calculateQuote(dto: {
    targetEntityType: string;
    targetEntityId: string;
    durationUnit?: string;
    durationCount?: number;
    selectedOptionalExpenseIds?: string[];
  }) {
    const durationCount = dto.durationCount || 1;
    const rate = await this.getPricing(dto.targetEntityType, dto.targetEntityId);
    const baseRent = rate.amount || rate.amountEgp || 2500;
    const depositAmount = rate.depositAmount || rate.depositAmountEgp || 0;
    const totalRent = baseRent * durationCount;

    // Fetch expenses for property
    const propExpenses = this.expenses;
    const mandatory = propExpenses.filter(e => e.isMandatory);
    const optional = propExpenses.filter(e => !e.isMandatory);

    let recurringMandatoryTotal = 0;
    let oneTimeMandatoryTotal = 0;

    mandatory.forEach(m => {
      if (m.isRecurring) {
        recurringMandatoryTotal += m.amount * durationCount;
      } else {
        oneTimeMandatoryTotal += m.amount;
      }
    });

    const selectedIds = new Set(dto.selectedOptionalExpenseIds || []);
    let selectedOptionalTotal = 0;
    const selectedOptionalItems: AdditionalExpenseRecord[] = [];

    optional.forEach(opt => {
      if (selectedIds.has(opt.id)) {
        selectedOptionalItems.push(opt);
        if (opt.isRecurring) {
          selectedOptionalTotal += opt.amount * durationCount;
        } else {
          selectedOptionalTotal += opt.amount;
        }
      }
    });

    const recurringMandatoryPerPeriod = mandatory
      .filter(m => m.isRecurring)
      .reduce((sum, m) => sum + m.amount, 0);

    const firstPaymentTotal =
      baseRent +
      depositAmount +
      recurringMandatoryPerPeriod +
      oneTimeMandatoryTotal +
      selectedOptionalTotal / (durationCount || 1);

    const fullTenancyValue =
      totalRent +
      depositAmount +
      recurringMandatoryTotal +
      oneTimeMandatoryTotal +
      selectedOptionalTotal;

    return {
      currency: 'EGP',
      baseRent,
      durationUnit: dto.durationUnit || rate.durationUnit || 'MONTHLY',
      durationCount,
      totalRentAmount: totalRent,
      securityDeposit: depositAmount,
      mandatoryExpenses: {
        recurringPerPeriod: recurringMandatoryPerPeriod,
        totalRecurring: recurringMandatoryTotal,
        oneTimeTotal: oneTimeMandatoryTotal,
        items: mandatory,
      },
      optionalExpenses: {
        selectedTotal: selectedOptionalTotal,
        items: selectedOptionalItems,
      },
      firstPaymentTotal: Math.round(firstPaymentTotal * 100) / 100,
      fullTenancyValue: Math.round(fullTenancyValue * 100) / 100,
    };
  }
}
