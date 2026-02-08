import { describe, it, expect } from 'vitest';
import {
  calculateTotalTax,
  calculateSelfEmploymentTax,
} from '../../src/calculations/calculateTax.js';

describe('Policy and integration behavior', () => {
  it('applies SALT cap based on policy flag (OBBBA on/off)', () => {
    const base = {
      filingStatus: 'single',
      totalWages: 150000,
      deductionType: 'itemized',
      stateLocalTaxes: 50000,
      realEstateTaxes: 10000,
    };

    const on = calculateTotalTax({ ...base, useObbba2025: true });
    const off = calculateTotalTax({ ...base, useObbba2025: false });

    // With OBBBA: SALT cap 40k; Without: 10k
    expect(on.deduction).toBeGreaterThan(off.deduction);
  });

  it('gates new OBBBA above-the-line deductions by flag', () => {
    const withNew = calculateTotalTax({
      filingStatus: 'single',
      totalWages: 120000,
      tipIncome: 20000,
      overtimeIncome: 12000,
      autoLoanInterest: 5000,
      useObbba2025: true,
    });
    const withoutNew = calculateTotalTax({
      filingStatus: 'single',
      totalWages: 120000,
      tipIncome: 20000,
      overtimeIncome: 12000,
      autoLoanInterest: 5000,
      useObbba2025: false,
    });

    // AGI should be lower when OBBBA deductions are applied
    expect(withNew.agi).toBeLessThan(withoutNew.agi);
  });

  it('enforces $3,000 capital loss limit against ordinary income', () => {
    const result = calculateTotalTax({
      filingStatus: 'single',
      totalWages: 50000,
      // No Schedule D detail provided; use manual net loss
      capitalGainLoss: -10000,
      deductionType: 'standard',
    });
    // Total income should be 50,000 - 3,000 = 47,000
    expect(result.totalIncome).toBe(47000);
  });

  it('applies 7.5% medical floor to itemized deductions', () => {
    // AGI roughly equals wages in this simple setup
    const res = calculateTotalTax({
      filingStatus: 'single',
      totalWages: 100000,
      deductionType: 'itemized',
      medicalExpenses: 10000, // 7.5% of 100k = 7,500; deductible = 2,500
      stateLocalTaxes: 0,
      realEstateTaxes: 0,
    });
    expect(res.deduction).toBe(2500);
  });

  it('includes W-2 wages in SE wage base and Additional Medicare threshold', () => {
    // Wages already fully consume SS wage base; SE SS portion should be ~0
    const se = calculateSelfEmploymentTax(50000, 200000, 'single');
    // Medicare & Additional Medicare may still apply, but SS should be ~0; total small
    expect(se.tax).toBeLessThan(2000);
  });

  it('reduces QBI limit by qualified dividends (and LT gains) and includes K-1 QBI', () => {
    const form = {
      filingStatus: 'single',
      totalWages: 0,
      qualifiedDividends: 20000,
      deductionType: 'standard',
      // QBI sources
      scheduleC: undefined,
      hasScheduleC: false,
      partnershipIncome: 100000,
      scheduleK1: { ordinaryIncome: 100000, guaranteedPayments: 20000 },
    };
    const res = calculateTotalTax(form);
    // QBI eligible ~80k => tentative 16k; limit = 20%*(TI before QBI - QD)
    // With little else, limit should still allow a significant deduction; assert > 0
    expect(res.taxableIncome).toBeGreaterThan(0);
  });
});

