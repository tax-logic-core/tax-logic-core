/**
 * ============================================================================
 * TAX LOGIC CORE - MAIN CALCULATION ENGINE
 * ============================================================================
 * 
 * This file contains the core US federal income tax calculations for tax year 2025.
 * 
 * LEGAL AUTHORITY:
 * - Internal Revenue Code (IRC) Title 26
 * - IRS Publication 17: Your Federal Income Tax
 * - IRS Form 1040 Instructions
 * - One Big Beautiful Bill Act of 2025 (OBBBA) - Major tax law changes
 * 
 * IMPORTANT DISCLAIMER:
 * This code is for informational purposes only and is NOT tax advice.
 * Tax laws are complex and change frequently. Always consult a qualified
 * tax professional for your specific situation.
 * 
 * COMMUNITY CONTRIBUTION:
 * If you find an error or have a correction, please open an issue at:
 * https://github.com/rsathyam/tax-logic-core/issues
 * 
 * ============================================================================
 */

import { getSaltCap, getPolicyFlags } from '../policy.js';

// ============================================================================
// SECTION 1: TAX BRACKETS (IRC §1)
// ============================================================================
/**
 * 2025 Federal Income Tax Brackets
 * 
 * LEGAL AUTHORITY: IRC §1(a)-(d), IRC §1(i)
 * IRS REFERENCE: Rev. Proc. 2024-XX (annual inflation adjustments)
 * 
 * HOW TAX BRACKETS WORK:
 * The US uses a "progressive" or "marginal" tax system. This means:
 * - You don't pay your highest rate on ALL your income
 * - Each bracket only applies to income WITHIN that range
 * 
 * EXAMPLE (Single filer, $60,000 taxable income):
 * - First $11,925 taxed at 10% = $1,192.50
 * - Next $36,550 ($11,925 to $48,475) taxed at 12% = $4,386.00
 * - Remaining $11,525 ($48,475 to $60,000) taxed at 22% = $2,535.50
 * - TOTAL TAX = $8,114.00
 * - EFFECTIVE RATE = 13.5% (NOT 22%!)
 * 
 * 2025 OBBBA UPDATES:
 * - Tax rates were made PERMANENT (previously set to sunset in 2026)
 * - Brackets adjusted for inflation per IRC §1(f)
 * 
 * FORMAT: [income_threshold, marginal_rate]
 * The rate applies to income FROM this threshold UP TO the next threshold.
 */
export const TAX_BRACKETS_2025 = {
    /**
     * SINGLE FILERS (IRC §1(c))
     * Unmarried individuals who don't qualify for Head of Household
     */
    single: [
        [0, 0.10],       // $0 - $11,925: 10%
        [11925, 0.12],   // $11,925 - $48,475: 12%
        [48475, 0.22],   // $48,475 - $103,350: 22%
        [103350, 0.24],  // $103,350 - $197,300: 24%
        [197300, 0.32],  // $197,300 - $250,525: 32%
        [250525, 0.35],  // $250,525 - $626,350: 35%
        [626350, 0.37],  // $626,350+: 37%
    ],

    /**
     * MARRIED FILING JOINTLY (IRC §1(a))
     * Married couples who file a joint return
     * Also applies to Qualifying Surviving Spouse (widow/widower)
     * 
     * NOTE: Brackets are approximately 2x single (no "marriage penalty" at most levels)
     */
    married: [
        [0, 0.10],       // $0 - $23,850: 10%
        [23850, 0.12],   // $23,850 - $96,950: 12%
        [96950, 0.22],   // $96,950 - $206,700: 22%
        [206700, 0.24],  // $206,700 - $394,600: 24%
        [394600, 0.32],  // $394,600 - $501,050: 32%
        [501050, 0.35],  // $501,050 - $751,600: 35%
        [751600, 0.37],  // $751,600+: 37%
    ],

    /**
     * MARRIED FILING SEPARATELY (IRC §1(d))
     * Married couples who choose to file separate returns
     * 
     * WARNING: This status has DISADVANTAGES:
     * - Lose many credits (EITC, education credits, etc.)
     * - Lower phase-out thresholds
     * - Cannot take standard deduction if spouse itemizes
     * 
     * USE CASES:
     * - Liability protection (separate from spouse's tax issues)
     * - Income-driven student loan repayment strategies
     * - When one spouse owes back taxes/child support
     */
    marriedSeparate: [
        [0, 0.10],       // $0 - $11,925: 10%
        [11925, 0.12],   // $11,925 - $48,475: 12%
        [48475, 0.22],   // $48,475 - $103,350: 22%
        [103350, 0.24],  // $103,350 - $197,300: 24%
        [197300, 0.32],  // $197,300 - $250,525: 32%
        [250525, 0.35],  // $250,525 - $375,800: 35%
        [375800, 0.37],  // $375,800+: 37% (NOTE: Lower threshold than single!)
    ],

    /**
     * HEAD OF HOUSEHOLD (IRC §1(b))
     * Unmarried taxpayers who maintain a home for a qualifying person
     * 
     * REQUIREMENTS (IRC §2(b)):
     * 1. Unmarried (or "considered unmarried") on last day of year
     * 2. Paid more than half the cost of keeping up a home
     * 3. Qualifying person lived with you for more than half the year
     * 
     * BENEFITS:
     * - Higher standard deduction than single ($23,500 vs $15,700)
     * - Wider tax brackets than single
     * - Higher income thresholds for credits
     */
    head: [
        [0, 0.10],       // $0 - $17,000: 10%
        [17000, 0.12],   // $17,000 - $64,850: 12%
        [64850, 0.22],   // $64,850 - $103,350: 22%
        [103350, 0.24],  // $103,350 - $197,300: 24%
        [197300, 0.32],  // $197,300 - $250,500: 32%
        [250500, 0.35],  // $250,500 - $626,350: 35%
        [626350, 0.37],  // $626,350+: 37%
    ],

    /**
     * QUALIFYING SURVIVING SPOUSE (formerly "Qualifying Widow(er)")
     * IRC §2(a)
     * 
     * REQUIREMENTS:
     * 1. Spouse died in one of the two preceding tax years
     * 2. Did not remarry before end of current tax year
     * 3. Have a dependent child
     * 4. Paid more than half the cost of maintaining the home
     * 
     * BENEFIT: Use same brackets as Married Filing Jointly for 2 years after spouse's death
     */
    widow: [
        [0, 0.10],
        [23850, 0.12],
        [96950, 0.22],
        [206700, 0.24],
        [394600, 0.32],
        [501050, 0.35],
        [751600, 0.37],
    ],
};


// ============================================================================
// SECTION 2: STANDARD DEDUCTIONS (IRC §63(c))
// ============================================================================
/**
 * 2025 Standard Deduction Amounts
 * 
 * LEGAL AUTHORITY: IRC §63(c)
 * IRS REFERENCE: Publication 17, Chapter 20
 * 
 * WHAT IS THE STANDARD DEDUCTION?
 * A fixed dollar amount that reduces your taxable income. You choose EITHER:
 * - Standard deduction (simple, fixed amount), OR
 * - Itemized deductions (sum of specific expenses like mortgage interest, SALT, charity)
 * 
 * 2025 OBBBA UPDATES:
 * - Standard deduction amounts made PERMANENT (were set to revert to lower 2017 amounts)
 * - Amounts adjusted for inflation
 * 
 * WHO SHOULD ITEMIZE?
 * Only itemize if your itemized deductions EXCEED the standard deduction.
 * Common scenarios where itemizing makes sense:
 * - High mortgage interest (especially first few years of mortgage)
 * - High state/local taxes (though capped at $40k per OBBBA)
 * - Significant charitable giving
 * - Large unreimbursed medical expenses (>7.5% of AGI)
 * 
 * ADDITIONAL AMOUNTS (not included here):
 * - Age 65+: Additional $1,950 (single) or $1,550 per spouse (married)
 * - Blind: Additional $1,950 (single) or $1,550 (married)
 */
export const STANDARD_DEDUCTIONS_2025 = {
    single: 15700,           // Single filers
    married: 31400,          // Married Filing Jointly (exactly 2x single)
    marriedSeparate: 15700,  // Married Filing Separately (same as single)
    head: 23500,             // Head of Household (between single and married)
    widow: 31400,            // Qualifying Surviving Spouse (same as MFJ)
};


// ============================================================================
// SECTION 3: CAPITAL GAINS TAX BRACKETS (IRC §1(h))
// ============================================================================
/**
 * 2025 Long-Term Capital Gains Tax Brackets
 * 
 * LEGAL AUTHORITY: IRC §1(h)
 * IRS REFERENCE: Publication 550, Schedule D Instructions
 * 
 * WHAT ARE CAPITAL GAINS?
 * Profit from selling a capital asset (stocks, bonds, real estate, crypto, etc.)
 * 
 * SHORT-TERM vs LONG-TERM:
 * - SHORT-TERM (held ≤ 1 year): Taxed as ORDINARY INCOME (your regular rate)
 * - LONG-TERM (held > 1 year): Taxed at preferential rates below
 * 
 * WHY PREFERENTIAL RATES?
 * Congress chose to encourage long-term investment over short-term speculation.
 * This also mitigates "inflation tax" - part of the gain may be due to inflation, not real profit.
 * 
 * QUALIFIED DIVIDENDS (IRC §1(h)(11)):
 * Dividends from most US and some foreign corporations also qualify for these rates.
 * Requirements: Stock held 60+ days in 121-day period around ex-dividend date.
 * 
 * NET INVESTMENT INCOME TAX (NIIT):
 * High earners pay an ADDITIONAL 3.8% on investment income (see calculateNIIT function).
 * 
 * FORMAT: [taxable_income_threshold, rate]
 * The rate is based on your TOTAL taxable income, not just the gains.
 */
export const CAPITAL_GAINS_BRACKETS_2025 = {
    single: [
        [0, 0],          // $0 - $48,350: 0% (!!)
        [48350, 0.15],   // $48,350 - $533,400: 15%
        [533400, 0.20],  // $533,400+: 20%
    ],
    married: [
        [0, 0],          // $0 - $96,700: 0%
        [96700, 0.15],   // $96,700 - $600,050: 15%
        [600050, 0.20],  // $600,050+: 20%
    ],
    marriedSeparate: [
        [0, 0],          // $0 - $48,350: 0%
        [48350, 0.15],   // $48,350 - $300,025: 15%
        [300025, 0.20],  // $300,025+: 20%
    ],
    head: [
        [0, 0],          // $0 - $64,750: 0%
        [64750, 0.15],   // $64,750 - $566,700: 15%
        [566700, 0.20],  // $566,700+: 20%
    ],
    widow: [
        [0, 0],          // $0 - $96,700: 0%
        [96700, 0.15],   // $96,700 - $600,050: 15%
        [600050, 0.20],  // $600,050+: 20%
    ],
};


// ============================================================================
// SECTION 4: TAX CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate tax using progressive brackets
 * 
 * LEGAL AUTHORITY: IRC §1 (Imposition of Tax)
 * 
 * This implements the progressive/marginal tax system described above.
 * Each bracket's rate applies only to income WITHIN that bracket.
 * 
 * ALGORITHM:
 * 1. Start at the lowest bracket ($0)
 * 2. Calculate tax on income in each bracket
 * 3. Move to higher brackets until all income is taxed
 * 
 * @param {number} income - Taxable income after deductions
 * @param {Array} brackets - Array of [threshold, rate] pairs
 * @returns {number} - Total tax liability
 * 
 * EXAMPLE:
 * calculateBracketTax(60000, TAX_BRACKETS_2025.single)
 * Returns: $8,114 (see breakdown in TAX_BRACKETS_2025 comments above)
 */
export function calculateBracketTax(income, brackets) {
    // Handle edge case: negative or zero income results in no tax
    if (income <= 0) return 0;

    let tax = 0;

    // Iterate through each bracket
    for (let i = 0; i < brackets.length; i++) {
        const [limit, rate] = brackets[i];

        // Get the upper limit of this bracket (next bracket's threshold, or Infinity)
        const nextLimit = brackets[i + 1]?.[0] ?? Infinity;

        if (income > nextLimit) {
            // Income exceeds this bracket - tax the full bracket at this rate
            // Amount in bracket = nextLimit - limit
            tax += (nextLimit - limit) * rate;
        } else {
            // Income falls within this bracket - tax remaining income and stop
            // Amount in bracket = income - limit
            tax += (income - limit) * rate;
            break;
        }
    }

    // Safety check: tax can't be negative
    return Math.max(0, tax);
}


/**
 * Calculate capital gains tax using "stacking" method
 * 
 * LEGAL AUTHORITY: IRC §1(h)
 * IRS REFERENCE: Schedule D Instructions, Qualified Dividends Tax Worksheet
 * 
 * IMPORTANT CONCEPT - "STACKING":
 * Capital gains are taxed at preferential rates, BUT the rate depends on
 * your TOTAL taxable income (ordinary + gains). The gains are "stacked"
 * on top of your ordinary income.
 * 
 * EXAMPLE (Single, $40,000 ordinary income + $20,000 LTCG):
 * - Total taxable income: $60,000
 * - First $48,350 of gains: 0% rate (taxable income was already below this threshold)
 * - Since $40,000 ordinary + $8,350 gains = $48,350 (0% threshold)
 *   - The first $8,350 of gains: 0%
 *   - Remaining $11,650 of gains: 15%
 * - Capital gains tax: ($8,350 × 0%) + ($11,650 × 15%) = $1,747.50
 * 
 * @param {number} taxableIncome - Ordinary taxable income (before adding gains)
 * @param {number} capitalGains - Total qualified dividends + long-term capital gains
 * @param {string} filingStatus - Filing status for bracket lookup
 * @returns {number} - Capital gains tax liability
 */
export function calculateCapitalGainsTax(taxableIncome, capitalGains, filingStatus) {
    // No tax if no gains
    if (capitalGains <= 0) return 0;

    const brackets = CAPITAL_GAINS_BRACKETS_2025[filingStatus] || CAPITAL_GAINS_BRACKETS_2025.single;

    // "Stacking": Capital gains sit on top of ordinary income
    const totalIncome = taxableIncome + capitalGains;

    let tax = 0;
    let remainingGains = capitalGains;

    // Process brackets from highest to lowest (reverse order)
    // This correctly handles the stacking by finding where total income falls
    for (let i = brackets.length - 1; i >= 0 && remainingGains > 0; i--) {
        const [threshold, rate] = brackets[i];

        if (totalIncome > threshold) {
            // Calculate how much of the gains fall in this bracket
            // Gains in this bracket = min(remaining gains, total income - max(ordinary income, threshold))
            const gainsTaxedAtThisRate = Math.min(
                remainingGains,
                totalIncome - Math.max(taxableIncome, threshold)
            );

            tax += gainsTaxedAtThisRate * rate;
            remainingGains -= gainsTaxedAtThisRate;
        }
    }

    return Math.max(0, tax);
}


/**
 * Calculate Self-Employment Tax
 * 
 * LEGAL AUTHORITY: IRC §1401, IRC §1402
 * IRS REFERENCE: Schedule SE, Publication 334
 * 
 * WHAT IS SELF-EMPLOYMENT TAX?
 * The self-employed person's version of FICA (Social Security + Medicare) taxes.
 * Employees split FICA with their employer (each pays half).
 * Self-employed pay BOTH halves themselves.
 * 
 * RATES (2025):
 * - Social Security: 12.4% (6.2% employee + 6.2% employer equivalent)
 * - Medicare: 2.9% (1.45% + 1.45%)
 * - Additional Medicare: 0.9% on income over $200k (single) or $250k (married)
 * 
 * THE 92.35% FACTOR:
 * To approximate the employer's share deduction that W-2 workers get,
 * only 92.35% of net SE income is subject to SE tax.
 * Formula: 100% - (7.65% / 2) = 92.35%
 * 
 * THE 50% DEDUCTION:
 * The "employer half" of SE tax is deductible when calculating AGI.
 * This reduces your income tax (but not your SE tax).
 * 
 * SOCIAL SECURITY WAGE BASE (2025):
 * Only the first $176,100 of combined wages + SE income is subject to SS tax.
 * (Medicare has no cap)
 * 
 * @param {number} netSelfEmploymentIncome - Schedule C net profit (or K-1 SE income)
 * @returns {Object} { tax: total SE tax, deduction: deductible portion }
 */
export function calculateSelfEmploymentTax(
    netSelfEmploymentIncome,
    wages = 0,
    filingStatus = 'single'
) {
    // No SE tax if no SE income
    if (netSelfEmploymentIncome <= 0) return { tax: 0, deduction: 0 };

    // Step 1: Apply 92.35% factor (IRC §1402(a)(12))
    // This approximates the employer-equivalent deduction
    const taxableBase = netSelfEmploymentIncome * 0.9235;

    // Step 2: Calculate Social Security portion (12.4%)
    // Subject to wage base limit ($176,100 for 2025)
    // Reduce wage base by W-2 Social Security wages
    const ssWageBase = 176100;
    const remainingSSBase = Math.max(0, ssWageBase - Math.min(ssWageBase, wages || 0));
    const ssTaxableSE = Math.min(taxableBase, remainingSSBase);
    const ssTax = ssTaxableSE * 0.124;

    // Step 3: Calculate Medicare portion (2.9%)
    // No wage base limit - applies to ALL SE income
    const medicareTax = taxableBase * 0.029;

    // Step 4: Calculate Additional Medicare Tax (0.9%)
    // Applies to SE income over threshold (IRC §1401(b)(2))
    // Thresholds: $200k (single/HOH), $250k (MFJ), $125k (MFS)
    const thresholds = { single: 200000, head: 200000, married: 250000, widow: 250000, marriedSeparate: 125000 };
    const threshold = thresholds[filingStatus] || 200000;
    const addlBase = Math.max(0, taxableBase - Math.max(0, threshold - (wages || 0)));
    const additionalMedicare = addlBase * 0.009;

    // Total SE tax
    const totalTax = ssTax + medicareTax + additionalMedicare;

    // Deductible portion: 50% of SE tax (IRC §164(f))
    // This is an "above the line" deduction (reduces AGI)
    const deduction = totalTax * 0.5;

    return { tax: totalTax, deduction };
}


/**
 * Calculate Net Investment Income Tax (NIIT)
 * 
 * LEGAL AUTHORITY: IRC §1411
 * IRS REFERENCE: Form 8960, Publication 559
 * 
 * WHAT IS NIIT?
 * A 3.8% surtax on investment income for high earners.
 * Enacted in 2013 as part of the Affordable Care Act to fund Medicare.
 * 
 * WHO PAYS NIIT?
 * Taxpayers with:
 * 1. Modified AGI above threshold, AND
 * 2. Net investment income
 * 
 * THRESHOLDS (NOT adjusted for inflation):
 * - Single: $200,000
 * - Married Filing Jointly: $250,000
 * - Married Filing Separately: $125,000
 * - Head of Household: $200,000
 * 
 * WHAT COUNTS AS INVESTMENT INCOME?
 * - Interest
 * - Dividends
 * - Capital gains
 * - Rental income (passive)
 * - Royalties
 * - Non-qualified annuities
 * - Income from trading businesses
 * 
 * WHAT DOESN'T COUNT?
 * - Wages and self-employment income
 * - Active business income
 * - Tax-exempt interest
 * - Distributions from qualified retirement plans
 * 
 * CALCULATION:
 * Tax = 3.8% × LESSER OF:
 *   (a) Net investment income, OR
 *   (b) AGI minus threshold
 * 
 * @param {number} agi - Adjusted Gross Income
 * @param {number} netInvestmentIncome - Total investment income
 * @param {string} filingStatus - Filing status for threshold lookup
 * @returns {number} - NIIT liability
 */
export function calculateNIIT(agi, netInvestmentIncome, filingStatus) {
    // MAGI thresholds (these are NOT indexed for inflation)
    const thresholds = {
        single: 200000,
        married: 250000,
        marriedSeparate: 125000,
        head: 200000,
        widow: 250000,
    };

    const threshold = thresholds[filingStatus] || 200000;

    // How much AGI exceeds threshold
    const excessAGI = Math.max(0, agi - threshold);

    // Tax applies to lesser of: net investment income OR excess AGI
    const taxableNII = Math.min(excessAGI, netInvestmentIncome);

    // NIIT rate is 3.8%
    return taxableNII * 0.038;
}


// ============================================================================
// SECTION 5: MAIN TAX CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate Total Federal Income Tax
 * 
 * LEGAL AUTHORITY: IRC Title 26, Subtitle A (Income Taxes)
 * IRS REFERENCE: Form 1040 and Instructions
 * 
 * This is the main function that calculates a taxpayer's complete federal tax liability.
 * It follows the same flow as IRS Form 1040:
 * 
 * FORM 1040 FLOW:
 * 1. Total Income (Lines 1-8)
 * 2. Adjustments to Income (Schedule 1) → AGI
 * 3. Standard/Itemized Deduction
 * 4. Taxable Income
 * 5. Tax Calculation (Tax Tables or Schedule D)
 * 6. Credits
 * 7. Other Taxes (SE tax, NIIT)
 * 8. Payments and Refund/Amount Owed
 * 
 * @param {Object} form - Tax form data object with all income, deduction, and credit fields
 * @returns {Object} - Complete tax calculation breakdown
 */
export function calculateTotalTax(form) {
    // ========================================================================
    // STEP 1: DETERMINE FILING STATUS (Form 1040, top of page 1)
    // ========================================================================
    // Filing status affects: brackets, standard deduction, credit eligibility
    const filingStatus = form.filingStatus || 'single';


    // ========================================================================
    // STEP 2: CALCULATE TOTAL INCOME (Form 1040, Lines 1-8)
    // ========================================================================

    // Line 1: Wages, salaries, tips (Form W-2 Box 1)
    const totalWages = parseFloat(form.totalWages) || 0;

    // Line 2b: Taxable interest (Form 1099-INT)
    // Note: Line 2a is tax-exempt interest (not included in taxable income)
    const taxableInterest = parseFloat(form.taxableInterest) || 0;

    // Line 3b: Ordinary dividends (Form 1099-DIV Box 1a)
    // Note: Line 3a is qualified dividends (taxed at capital gains rates)
    const ordinaryDividends = parseFloat(form.ordinaryDividends) || 0;
    const qualifiedDividends = parseFloat(form.qualifiedDividends) || 0;

    // Line 4b: Taxable IRA distributions (Form 1099-R)
    const taxableIra = parseFloat(form.taxableIra) || 0;

    // Line 5b: Taxable pensions and annuities (Form 1099-R)
    const taxablePensions = parseFloat(form.taxablePensions) || 0;

    // Line 6b: Taxable Social Security benefits
    // IRC §86 formula determines taxable portion (up to 85%)
    const taxableSocialSecurity = parseFloat(form.taxableSocialSecurity) || 0;

    // Line 7: Capital gain/loss (from Schedule D or Form 8949)
    // See Schedule D calculation below
    const capitalGainLoss = parseFloat(form.capitalGainLoss) || 0;

    // Line 8: Other income (Schedule 1, Part I)
    const otherIncome = parseFloat(form.otherIncome) || 0;


    // ========================================================================
    // SCHEDULE C: SELF-EMPLOYMENT INCOME (Profit or Loss From Business)
    // ========================================================================
    /**
     * Schedule C reports income from sole proprietorships.
     * Net profit = Gross receipts - Business expenses
     * 
     * This income is subject to:
     * - Income tax (at ordinary rates)
     * - Self-employment tax (15.3%)
     * - Potentially QBI deduction (20% deduction under §199A)
     */
    let scheduleC = 0;
    if (form.hasScheduleC && form.scheduleC) {
        if (form.scheduleC.netProfit !== undefined) {
            // Parsed from PDF - use directly
            scheduleC = parseFloat(form.scheduleC.netProfit) || 0;
        } else {
            // Manual entry - calculate from components
            scheduleC = (parseFloat(form.scheduleC.grossReceipts) || 0) -
                (parseFloat(form.scheduleC.expenses) || 0);
        }
    }


    // ========================================================================
    // SCHEDULE E: RENTAL AND PASSIVE INCOME
    // ========================================================================
    /**
     * Schedule E reports:
     * - Part I: Rental real estate income
     * - Part II: Partnership/S-Corp income (K-1)
     * - Part III: Estate and trust income
     * 
     * Rental income is generally "passive" unless you're a Real Estate Professional (IRC §469(c)(7))
     * Passive losses can only offset passive income (with limited exceptions)
     */
    let scheduleE = 0;
    if (form.hasScheduleE && form.scheduleE) {
        if (form.scheduleE.netIncome !== undefined) {
            scheduleE = parseFloat(form.scheduleE.netIncome) || 0;
        } else {
            scheduleE = (parseFloat(form.scheduleE.rentalIncome) || 0) -
                (parseFloat(form.scheduleE.rentalExpenses) || 0);
        }
    }


    // ========================================================================
    // SCHEDULE D: CAPITAL GAINS AND LOSSES
    // ========================================================================
    /**
     * Schedule D summarizes capital gains and losses from Form 8949.
     * 
     * SHORT-TERM (held ≤ 1 year): Taxed as ordinary income
     * LONG-TERM (held > 1 year): Taxed at preferential rates (0%, 15%, or 20%)
     * 
     * NETTING RULES:
     * 1. Net short-term gains/losses together
     * 2. Net long-term gains/losses together
     * 3. If one is gain and one is loss, net them against each other
     * 
     * LOSS LIMIT: Can deduct up to $3,000 ($1,500 MFS) of net capital losses per year
     * Excess losses carry forward to future years (never expire)
     */
    // Net capital gains/losses with $3,000 ($1,500 MFS) loss limit against ordinary income
    let shortTermGain = 0;
    let shortTermLoss = 0;
    let longTermGain = 0;
    let longTermLoss = 0;
    if (form.hasScheduleD && form.scheduleD) {
        shortTermGain = parseFloat(form.scheduleD.shortTermGain) || 0;
        shortTermLoss = Math.abs(parseFloat(form.scheduleD.shortTermLoss) || 0);
        longTermGain = parseFloat(form.scheduleD.longTermGain) || 0;
        longTermLoss = Math.abs(parseFloat(form.scheduleD.longTermLoss) || 0);
    } else if (form.capitalGainLoss !== undefined) {
        const net = parseFloat(form.capitalGainLoss) || 0;
        if (net >= 0) longTermGain = net; else longTermLoss = Math.abs(net);
    }
    const netShortTerm = shortTermGain - shortTermLoss;
    const netLongTerm = longTermGain - longTermLoss;
    const netCapital = netShortTerm + netLongTerm;
    const capLossLimit = filingStatus === 'marriedSeparate' ? 1500 : 3000;
    const cappedCapitalForAGI = netCapital >= 0 ? netCapital : -Math.min(capLossLimit, Math.abs(netCapital));


    // ========================================================================
    // TOTAL INCOME (Form 1040, Line 9)
    // ========================================================================
    const totalIncome = totalWages + taxableInterest + ordinaryDividends + taxableIra +
        taxablePensions + taxableSocialSecurity + otherIncome +
        scheduleC + scheduleE + cappedCapitalForAGI;


    // ========================================================================
    // HELPER: Calculate Age (for senior deductions)
    // ========================================================================
    const calculateAge = (birthDate) => {
        if (!birthDate) return 40; // Default to under 65
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };


    // ========================================================================
    // 2025 OBBBA NEW DEDUCTIONS
    // ========================================================================
    /**
     * The One Big Beautiful Bill Act of 2025 introduced several NEW deductions:
     * 
     * 1. TIP INCOME DEDUCTION (new for 2025)
     *    - Deduct up to $25,000 of tip income
     *    - Phases out at higher incomes
     *    - Purpose: Tax relief for service industry workers
     * 
     * 2. OVERTIME INCOME DEDUCTION (new for 2025)
     *    - Deduct up to $12,500 of overtime pay
     *    - Phases out at higher incomes
     *    - Purpose: Encourage overtime work
     * 
     * 3. AUTO LOAN INTEREST DEDUCTION (new for 2025)
     *    - Deduct up to $10,000 of auto loan interest
     *    - For domestically manufactured vehicles
     *    - Purpose: Support domestic auto industry
     * 
     * 4. SENIOR BONUS DEDUCTION (new for 2025)
     *    - $6,000 additional deduction for age 65+
     *    - Purpose: Provide relief for fixed-income seniors
     * 
     * PHASE-OUT THRESHOLDS:
     * - Single: $150,000 - $400,000
     * - Married: $300,000 - $550,000
     */

    // Phase-out calculation for new OBBBA deductions
    const getPhaseOutPct = (income) => {
        const limits = filingStatus === 'married'
            ? { start: 300000, end: 550000 }
            : { start: 150000, end: 400000 };

        if (income <= limits.start) return 1.0;  // Full deduction
        if (income >= limits.end) return 0.0;    // No deduction
        // Linear phase-out between limits
        return 1.0 - ((income - limits.start) / (limits.end - limits.start));
    };

    // Calculate tentative income for phase-out (before new deductions)
    const tentativeTotalIncome = totalIncome;
    const tentativeAdjustments = (parseFloat(form.educatorExpenses) || 0) +
        (parseFloat(form.hsaDeduction) || 0) +
        (parseFloat(form.selfEmploymentTaxDeduction) || 0) +
        (parseFloat(form.selfEmployedSEPSimple) || 0) +
        (parseFloat(form.selfEmployedHealthInsurance) || 0) +
        (parseFloat(form.penaltyEarlyWithdrawal) || 0) +
        (parseFloat(form.alimonyPaid) || 0) +
        (parseFloat(form.iraDeduction) || 0) +
        (parseFloat(form.studentLoanInterest) || 0);

    const magiForPhaseOut = tentativeTotalIncome - tentativeAdjustments;
    const phaseOutPct = getPhaseOutPct(magiForPhaseOut);

    // Calculate new OBBBA deductions with phase-out (policy-gated)
    const { useObbba2025 } = getPolicyFlags(form);
    const tipsDeduction = useObbba2025 ? (Math.min(parseFloat(form.tipIncome) || 0, 25000) * phaseOutPct) : 0;
    const overtimeDeduction = useObbba2025 ? (Math.min(parseFloat(form.overtimeIncome) || 0, 12500) * phaseOutPct) : 0;
    const autoLoanDeduction = useObbba2025 ? Math.min(parseFloat(form.autoLoanInterest) || 0, 10000) : 0;
    const seniorBonus = useObbba2025 && calculateAge(form.birthDate) >= 65 ? 6000 : 0;


    // ========================================================================
    // ADJUSTMENTS TO INCOME (Schedule 1, Part II → Form 1040 Line 10)
    // ========================================================================
    /**
     * Adjustments are "above the line" deductions that reduce AGI.
     * They're available even if you take the standard deduction.
     * 
     * Common adjustments:
     * - Educator expenses (up to $300)
     * - HSA contributions
     * - Half of self-employment tax
     * - Self-employed retirement contributions (SEP, SIMPLE)
     * - Self-employed health insurance premiums
     * - Penalty on early withdrawal of savings
     * - Alimony paid (for divorces before 2019)
     * - IRA contributions (Traditional IRA)
     * - Student loan interest (up to $2,500)
     */
    // Include 50% SE tax deduction automatically (use provided value if larger, e.g., K-1 SE)
    const wagesForSET = parseFloat(form.totalWages) || 0;
    const { deduction: seTaxDeductionComputed } = calculateSelfEmploymentTax(scheduleC, wagesForSET, filingStatus);

    const totalAdjustments =
        (parseFloat(form.educatorExpenses) || 0) +
        (parseFloat(form.hsaDeduction) || 0) +
        Math.max(parseFloat(form.selfEmploymentTaxDeduction) || 0, seTaxDeductionComputed) +
        (parseFloat(form.selfEmployedSEPSimple) || 0) +
        (parseFloat(form.selfEmployedHealthInsurance) || 0) +
        (parseFloat(form.penaltyEarlyWithdrawal) || 0) +
        (parseFloat(form.alimonyPaid) || 0) +
        (parseFloat(form.iraDeduction) || 0) +
        (parseFloat(form.studentLoanInterest) || 0) +
        // New 2025 OBBBA deductions
        tipsDeduction +
        overtimeDeduction +
        autoLoanDeduction +
        seniorBonus;


    // ========================================================================
    // ADJUSTED GROSS INCOME (AGI) - Form 1040 Line 11
    // ========================================================================
    /**
     * AGI is a crucial number used throughout the tax code:
     * - Determines eligibility for many credits
     * - Sets phase-out thresholds
     * - Is the starting point for itemized deduction limits
     * - Used for medical expense deduction (7.5% of AGI floor)
     */
    const agi = totalIncome - totalAdjustments;


    // ========================================================================
    // STANDARD VS ITEMIZED DEDUCTION (Form 1040 Lines 12-14)
    // ========================================================================

    const standardDeduction = STANDARD_DEDUCTIONS_2025[filingStatus] || STANDARD_DEDUCTIONS_2025.single;

    /**
     * SALT CAP (State and Local Tax Deduction Limit)
     * 
     * LEGAL AUTHORITY: IRC §164(b)(6)
     * 
     * 2025 OBBBA UPDATE: Cap increased from $10,000 to $40,000
     * (MFS cap is half: $20,000)
     * 
     * This cap limits the deduction for:
     * - State and local income taxes (or sales taxes if elected)
     * - State and local property taxes
     */
    const saltCap = getSaltCap(filingStatus, form);
    const actualSalt = Math.min(
        (parseFloat(form.stateLocalTaxes) || 0) + (parseFloat(form.realEstateTaxes) || 0),
        saltCap
    );

    // Calculate total itemized deductions (Schedule A)
    const medicalDeductible = Math.max(0, (parseFloat(form.medicalExpenses) || 0) - (agi * 0.075));
    const itemizedTotal =
        medicalDeductible +                         // 7.5% AGI floor applied
        actualSalt +                                // Subject to SALT cap
        (parseFloat(form.mortgageInterest) || 0) +  // Limit: $750k acquisition debt
        (parseFloat(form.charityCash) || 0) +       // Limit: 60% of AGI
        (parseFloat(form.charityNonCash) || 0) +    // Limit: 30% of AGI
        (parseFloat(form.casualtyLosses) || 0) +    // Federally declared disasters only
        (parseFloat(form.otherItemized) || 0);

    // Use whichever is higher: standard or itemized
    const deduction = form.deductionType === 'itemized' ? itemizedTotal : standardDeduction;


    // ========================================================================
    // QBI DEDUCTION (Qualified Business Income) - IRC §199A
    // ========================================================================
    /**
     * The QBI deduction (also called "Section 199A deduction") allows
     * a 20% deduction on qualified business income from pass-through entities.
     * 
     * LEGAL AUTHORITY: IRC §199A
     * IRS REFERENCE: Form 8995 or 8995-A
     * 
     * WHO QUALIFIES:
     * - Sole proprietors (Schedule C)
     * - Partners in partnerships (Schedule E/K-1)
     * - S-corp shareholders (Schedule E/K-1)
     * - Some REIT/PTP investors
     * 
     * LIMITATIONS:
     * 1. Cannot exceed 20% of (taxable income - capital gains)
     * 2. Above income thresholds: W-2 wage and UBIA limitations apply
     * 3. Specified Service Trades (SSTB) phase out at higher incomes
     * 
     * INCOME THRESHOLDS (2025):
     * - Full deduction below: $197,300 (S), $394,600 (MFJ)
     * - Phase-in range: $50,000 (S), $100,000 (MFJ)
     * - Above phase-in: Subject to wage/UBIA limits
     * 
     * NOTE: This is a simplified calculation. Complex cases (multiple businesses,
     * specified service trades, aggregation elections) require Form 8995-A.
     */
    let qbiDeduction = 0;
    {
        // Include Schedule C and optional K‑1 ordinary income (minus guaranteed payments) when provided
        const guaranteedPayments = parseFloat(form.scheduleK1?.guaranteedPayments) || 0;
        const partnershipIncome = parseFloat(form.partnershipIncome) || parseFloat(form.scheduleK1?.ordinaryIncome) || 0;
        const sCorpIncome = parseFloat(form.sCorpIncome) || 0;
        const qbiEligible = Math.max(0, scheduleC) + Math.max(0, partnershipIncome + sCorpIncome - guaranteedPayments);

        if (qbiEligible > 0) {
            const tentativeQBI = qbiEligible * 0.20;
            const taxableBeforeQBI = Math.max(0, agi - deduction);
            const netCapGainForLimit = Math.max(0, netLongTerm) + Math.max(0, qualifiedDividends);
            const limit = (taxableBeforeQBI - netCapGainForLimit) * 0.20;
            qbiDeduction = Math.min(tentativeQBI, Math.max(0, limit));
        }
    }


    // ========================================================================
    // TAXABLE INCOME (Form 1040 Line 15)
    // ========================================================================
    // Taxable income = AGI - Deduction - QBI Deduction
    const taxableIncome = Math.max(0, agi - deduction - qbiDeduction);


    // ========================================================================
    // TAX CALCULATION (Form 1040 Line 16)
    // ========================================================================

    // Separate qualified income (taxed at preferential rates)
    const totalQualifiedIncome = qualifiedDividends + Math.max(0, netLongTerm);

    // Ordinary income = taxable income minus qualified income
    const ordinaryTaxableIncome = Math.max(0, taxableIncome - totalQualifiedIncome);

    // Calculate tax on ordinary income using brackets
    const brackets = TAX_BRACKETS_2025[filingStatus] || TAX_BRACKETS_2025.single;
    const regularTax = calculateBracketTax(ordinaryTaxableIncome, brackets);

    // Calculate tax on qualified dividends and long-term gains
    const capitalGainsTax = calculateCapitalGainsTax(ordinaryTaxableIncome, totalQualifiedIncome, filingStatus);


    // ========================================================================
    // OTHER TAXES (Schedule 2)
    // ========================================================================

    // Self-Employment Tax (Schedule SE)
    const { tax: seTax } = calculateSelfEmploymentTax(scheduleC, wagesForSET, filingStatus);

    // Net Investment Income Tax (Form 8960)
    // Investment income = Interest + Dividends + Capital Gains + Passive Rental
    const netPositiveCap = Math.max(0, netCapital);
    const investmentIncome = taxableInterest + ordinaryDividends + netPositiveCap + scheduleE;
    const niit = calculateNIIT(agi, investmentIncome, filingStatus);

    // Total tax before credits
    const totalTaxBeforeCredits = regularTax + capitalGainsTax + seTax + niit;


    // ========================================================================
    // TAX CREDITS (Form 1040 Lines 19-21, Schedule 3)
    // ========================================================================
    /**
     * Credits directly reduce your tax dollar-for-dollar.
     * Far more valuable than deductions!
     * 
     * NONREFUNDABLE CREDITS: Can reduce tax to $0 but not below
     * - Child Tax Credit (up to $2,000/child, $1,700 refundable portion)
     * - Credit for Other Dependents ($500)
     * - Education Credits (American Opportunity, Lifetime Learning)
     * - Retirement Savings Contribution Credit
     * - Child and Dependent Care Credit
     * 
     * REFUNDABLE CREDITS: Can result in refund even if you owe no tax
     * - Earned Income Tax Credit (EITC)
     * - Additional Child Tax Credit
     * - Premium Tax Credit (ACA/Obamacare)
     */

    // Calculate child-related credits from dependents
    const qualifyingChildren = (form.dependents || []).filter(d => d.qualifyingChild && d.childTaxCredit).length;
    const otherDependents = (form.dependents || []).filter(d => !d.qualifyingChild).length;

    const estimatedChildCredit = qualifyingChildren * 2000;
    const estimatedOtherDependentsCredit = otherDependents * 500;

    const totalCredits =
        (parseFloat(form.childTaxCredit) || estimatedChildCredit) +
        (parseFloat(form.creditOtherDependents) || estimatedOtherDependentsCredit) +
        (parseFloat(form.educationCredits) || 0) +
        (parseFloat(form.retirementSaversCredit) || 0) +
        (parseFloat(form.childCareCredit) || 0) +
        (parseFloat(form.earnedIncomeCredit) || 0) +
        (parseFloat(form.otherCredits) || 0);

    // Separate refundable and non-refundable credits
    const nonRefundableCredits = (parseFloat(form.childTaxCredit) || estimatedChildCredit) +
        (parseFloat(form.creditOtherDependents) || estimatedOtherDependentsCredit) +
        (parseFloat(form.educationCredits) || 0) +
        (parseFloat(form.retirementSaversCredit) || 0) +
        (parseFloat(form.childCareCredit) || 0);

    const refundableCredits = (parseFloat(form.earnedIncomeCredit) || 0) +
        (parseFloat(form.otherCredits) || 0);

    // Apply non-refundable credits (can't reduce below 0)
    const taxAfterNonRefundable = Math.max(0, totalTaxBeforeCredits - nonRefundableCredits);

    // Apply refundable credits (can go negative = refund)
    const finalTax = taxAfterNonRefundable - refundableCredits;


    // ========================================================================
    // PAYMENTS AND REFUND (Form 1040 Lines 25-34)
    // ========================================================================

    const totalWithholding = parseFloat(form.totalWithholding) || 0;
    const estimatedPayments = parseFloat(form.estimatedTaxPayments) || 0;
    const priorYearApplied = parseFloat(form.amountAppliedFromPriorYear) || 0;
    const totalPayments = totalWithholding + estimatedPayments + priorYearApplied;

    // Positive = refund, Negative = amount owed
    const refundOrOwed = totalPayments - finalTax;


    // ========================================================================
    // RETURN RESULTS
    // ========================================================================
    return {
        totalIncome,
        totalAdjustments,
        agi,
        deduction,
        taxableIncome,
        regularTax,
        capitalGainsTax,
        seTax,
        totalTaxBeforeCredits,
        totalCredits,
        finalTax,
        totalPayments,
        refundOrOwed,
        isRefund: refundOrOwed >= 0,
    };
}


/**
 * Calculate tax with form overrides - used for "what-if" scenario analysis
 * 
 * This is useful for tax planning - comparing different scenarios:
 * - What if I file as Head of Household instead of Single?
 * - What if I max out my 401(k) contribution?
 * - What if I donate more to charity?
 * 
 * @param {Object} form - Original form data
 * @param {Object} overrides - Fields to override (e.g., { filingStatus: 'marriedSeparate' })
 * @returns {Object} Tax calculation result with overrides applied
 * 
 * EXAMPLE:
 * const originalTax = calculateTotalTax(myForm);
 * const withHOH = calculateTaxWithOverrides(myForm, { filingStatus: 'head' });
 * const savings = originalTax.finalTax - withHOH.finalTax;
 */
export function calculateTaxWithOverrides(form, overrides = {}) {
    const modifiedForm = { ...form, ...overrides };
    return calculateTotalTax(modifiedForm);
}
