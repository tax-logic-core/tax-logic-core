/**
 * ============================================================================
 * TAX LOGIC CORE - MAIN OPTIMIZATION ENGINE
 * ============================================================================
 * 
 * This file orchestrates all tax optimization strategies and provides
 * actionable recommendations to reduce tax liability.
 * 
 * PHILOSOPHY:
 * Every optimization in this library is:
 * 1. LEGAL - Based on established tax law
 * 2. CITED - Includes IRS authority (IRC section, Publication, Form)
 * 3. ACTIONABLE - Provides specific steps to implement
 * 4. AUDITABLE - Community can verify and correct
 * 
 * DISCLAIMER:
 * This is NOT tax advice. Tax laws are complex and depend on your specific
 * situation. Always consult a qualified tax professional before implementing
 * any tax strategy.
 * 
 * COMMUNITY CONTRIBUTION:
 * Found an error? Have a suggestion? Open an issue:
 * https://github.com/rsathyam/tax-logic-core/issues
 * 
 * ============================================================================
 */

import { calculateTotalTax, calculateTaxWithOverrides, STANDARD_DEDUCTIONS_2025 } from '../calculations/calculateTax.js';
import { analyzeFilingStatusOptimizations } from './filingStatusOptimizer';
import { analyzeDeductionOptimizations } from './deductionOptimizer';
import { analyzeRetirementOptimizations } from './retirementOptimizer';
import { analyzeCreditsOptimizations } from './creditsOptimizer';
import { analyzeSelfEmploymentOptimizations } from './selfEmploymentOptimizer';
import { analyzeCapitalGainsOptimizations } from './capitalGainsOptimizer';
import { analyzeStateOptimizations } from './stateOptimizer';
// New optimizers added for 2025 audit
import { analyzeAugustaRuleOptimization } from './augustaRuleOptimizer';
import { analyzeK1Optimizations } from './k1Optimizer';
import { analyzeAMTOptimizations } from './amtOptimizer';
// State PTET and special tax optimizers
import { analyzeStatePTETOptimizations } from './statePTETOptimizer';
import { analyzeCryptoTaxOptimizations } from './cryptoTaxOptimizer';
import { analyzeRealEstateProfessionalOptimizations } from './realEstateProfessionalOptimizer';
import { analyzeInternationalTaxOptimizations } from './internationalTaxOptimizer';


// ============================================================================
// OPTIMIZATION DIFFICULTY LEVELS
// ============================================================================
/**
 * Every optimization is rated by implementation difficulty:
 * 
 * EASY: Can be done immediately on this tax return
 * - No lifestyle changes required
 * - Example: Switching from Standard to Itemized deduction
 * - Example: Claiming a credit you missed
 * 
 * MEDIUM: Requires some planning or documentation
 * - May need to gather records
 * - Might involve timing of income/expenses
 * - Example: Setting up HSA before year-end
 * - Example: Making estimated tax payments
 * 
 * HARD: Requires significant changes or professional help
 * - Major financial or business decisions
 * - Complex tax elections
 * - Example: S-Corp election
 * - Example: Real Estate Professional status
 * - Example: Moving to a different state
 */
export const DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
};


// ============================================================================
// OPTIMIZATION CATEGORIES
// ============================================================================
/**
 * Optimizations are grouped into categories for easy navigation:
 * 
 * FILING_STATUS: Changing how you file (Single vs HOH vs MFJ)
 * DEDUCTIONS: Itemized vs Standard, maximizing deductions
 * RETIREMENT: 401(k), IRA, SEP, Solo 401(k), HSA
 * CREDITS: Child Tax Credit, EITC, education, energy
 * SELF_EMPLOYMENT: SE tax reduction, QBI, business structure
 * CAPITAL_GAINS: Loss harvesting, holding periods, NIIT
 * STATE: State-specific strategies, relocation, PTET
 * INCOME_TIMING: Deferral, acceleration, tax bracket management
 * COMPLIANCE: Required filings, penalties, deadlines (informational)
 */
export const CATEGORY = {
    FILING_STATUS: 'Filing Status',
    DEDUCTIONS: 'Deductions',
    RETIREMENT: 'Retirement',
    CREDITS: 'Credits',
    SELF_EMPLOYMENT: 'Self-Employment',
    CAPITAL_GAINS: 'Capital Gains',
    STATE: 'State',
    INCOME_TIMING: 'Income Timing',
    COMPLIANCE: 'Compliance',
};


// ============================================================================
// MAIN OPTIMIZATION FUNCTION
// ============================================================================
/**
 * Analyze a tax form and return all applicable optimization recommendations
 * 
 * HOW IT WORKS:
 * 1. Calculate the current tax liability
 * 2. Run each specialized optimizer module
 * 3. Collect all recommendations
 * 4. Filter to beneficial ones (positive savings)
 * 5. Sort by potential savings (highest first)
 * 6. Generate summary statistics
 * 
 * OPTIMIZER MODULES:
 * - Filing Status: Can changing status reduce taxes?
 * - Deductions: Itemized vs Standard, maximize deductions
 * - Retirement: Max out tax-advantaged accounts
 * - Credits: Are you missing any credits?
 * - Self-Employment: SE tax, QBI, S-Corp election
 * - Capital Gains: Loss harvesting, 0% bracket
 * - State: State-specific strategies
 * - Augusta Rule: §280A 14-day rental for business owners
 * - K-1: Pass-through optimization
 * - AMT: Alternative Minimum Tax planning
 * 
 * @param {Object} form - Tax form data with all income/deduction/credit fields
 * @returns {Object} - Optimization results:
 *   - currentTax: Current calculated tax liability
 *   - optimizations: Array of optimization objects
 *   - totalPotentialSavings: Sum of all potential savings
 *   - optimizedTax: Tax after applying all optimizations
 *   - summary: Statistics and top recommendations
 */
export function analyzeTaxOptimizations(form) {
    // Get state for state-specific optimizations
    const state = form.state || form.stateOfResidence || '';

    // Step 1: Calculate current tax liability
    // This is the baseline we're trying to reduce
    const currentTax = calculateTotalTax(form);

    // Step 2: Gather all optimizations from each module
    // Each module is wrapped in try/catch so one failure doesn't break all
    const allOptimizations = [];

    // ----- FILING STATUS OPTIMIZER -----
    // Analyzes whether a different filing status would reduce taxes.
    // Common savings: Single → Head of Household, MFJ vs MFS comparison
    try {
        const filingStatusOpts = analyzeFilingStatusOptimizations(form);
        allOptimizations.push(...filingStatusOpts);
    } catch (e) {
        console.warn('Filing status optimizer error:', e);
    }

    // ----- DEDUCTION OPTIMIZER -----
    // Compares standard vs itemized, identifies missing deductions.
    // Analyzes: SALT cap impact, bunching strategy, charity, mortgage interest
    try {
        const deductionOpts = analyzeDeductionOptimizations(form);
        allOptimizations.push(...deductionOpts);
    } catch (e) {
        console.warn('Deduction optimizer error:', e);
    }

    // ----- RETIREMENT OPTIMIZER -----
    // Identifies opportunities to increase retirement contributions.
    // Analyzes: 401(k), IRA, Roth conversions, HSA (triple tax advantage)
    // These reduce taxable income AND build retirement wealth
    try {
        const retirementOpts = analyzeRetirementOptimizations(form);
        allOptimizations.push(...retirementOpts);
    } catch (e) {
        console.warn('Retirement optimizer error:', e);
    }

    // ----- CREDITS OPTIMIZER -----
    // Identifies missed tax credits.
    // Credits are MORE valuable than deductions (dollar-for-dollar reduction)
    // Analyzes: Child Tax Credit, EITC, Education, Child Care, Energy
    try {
        const creditsOpts = analyzeCreditsOptimizations(form);
        allOptimizations.push(...creditsOpts);
    } catch (e) {
        console.warn('Credits optimizer error:', e);
    }

    // ----- SELF-EMPLOYMENT OPTIMIZER -----
    // Specialized strategies for self-employed individuals.
    // Analyzes: SE tax reduction, QBI deduction, S-Corp election,
    // SEP-IRA vs Solo 401(k), home office, health insurance
    try {
        const seOpts = analyzeSelfEmploymentOptimizations(form);
        allOptimizations.push(...seOpts);
    } catch (e) {
        console.warn('Self-employment optimizer error:', e);
    }

    // ----- CAPITAL GAINS OPTIMIZER -----
    // Strategies for investment income.
    // Analyzes: Tax-loss harvesting, 0% bracket opportunity, wash sales,
    // NIIT planning, holding periods, Qualified Opportunity Zones
    try {
        const cgOpts = analyzeCapitalGainsOptimizations(form);
        allOptimizations.push(...cgOpts);
    } catch (e) {
        console.warn('Capital gains optimizer error:', e);
    }

    // ----- STATE OPTIMIZER -----
    // State-specific tax strategies.
    // Analyzes: No-income-tax states, 529 deductions, credits,
    // state-specific deductions, residency considerations
    try {
        if (state) {
            const stateOpts = analyzeStateOptimizations(form, state);
            allOptimizations.push(...stateOpts);
        }
    } catch (e) {
        console.warn('State optimizer error:', e);
    }

    // ----- AUGUSTA RULE OPTIMIZER -----
    // Section 280A(g) - 14-day tax-free rental strategy
    // For business owners who can rent their home to their business
    // LEGAL AUTHORITY: IRC §280A(g)
    try {
        const augustaOpts = analyzeAugustaRuleOptimization(form);
        allOptimizations.push(...augustaOpts);
    } catch (e) {
        console.warn('Augusta Rule optimizer error:', e);
    }

    // ----- K-1 OPTIMIZER -----
    // Pass-through entity optimization (S-Corps, Partnerships)
    // Analyzes: QBI eligibility, reasonable compensation, SE tax,
    // basis tracking, guaranteed payments
    try {
        const k1Opts = analyzeK1Optimizations(form);
        allOptimizations.push(...k1Opts);
    } catch (e) {
        console.warn('K-1 optimizer error:', e);
    }

    // ----- AMT OPTIMIZER -----
    // Alternative Minimum Tax analysis and planning
    // Analyzes: AMT exposure, ISO exercise timing, SALT impact,
    // AMT credit carryforward
    try {
        const amtOpts = analyzeAMTOptimizations(form);
        allOptimizations.push(...amtOpts);
    } catch (e) {
        console.warn('AMT optimizer error:', e);
    }

    // ----- STATE PTET OPTIMIZER -----
    // Pass-Through Entity Tax elections for SALT cap workaround
    // Analyzes: NY PTET, CA PTE, NJ BAIT, TX Margin Tax, CA Mental Health Tax
    // Covers 16 states: CA, NY, NJ, CT, GA, IL, MA, AZ, MD, MN, WI, NC, OH, OR, SC, VA
    // LEGAL AUTHORITY: IRS Notice 2020-75
    try {
        const ptetOpts = analyzeStatePTETOptimizations(form);
        allOptimizations.push(...ptetOpts);
    } catch (e) {
        console.warn('State PTET optimizer error:', e);
    }

    // ----- CRYPTOCURRENCY TAX OPTIMIZER -----
    // Tax strategies for cryptocurrency holdings
    // Analyzes: Cost basis methods (FIFO, LIFO, HIFO), tax-loss harvesting,
    // staking income, mining, airdrops, NFTs, DeFi
    // NOTE: Crypto is NOT subject to wash sale rules!
    try {
        const cryptoOpts = analyzeCryptoTaxOptimizations(form);
        allOptimizations.push(...cryptoOpts);
    } catch (e) {
        console.warn('Crypto tax optimizer error:', e);
    }

    // ----- REAL ESTATE PROFESSIONAL OPTIMIZER -----
    // Real Estate Professional status under IRC §469(c)(7)
    // Analyzes: REP qualification (750 hours), material participation,
    // grouping elections, suspended passive losses, $25k exception
    try {
        const repOpts = analyzeRealEstateProfessionalOptimizations(form);
        allOptimizations.push(...repOpts);
    } catch (e) {
        console.warn('Real Estate Professional optimizer error:', e);
    }

    // ----- INTERNATIONAL TAX OPTIMIZER -----
    // Tax strategies for US citizens abroad and foreign income
    // Analyzes: FEIE ($130,000 exclusion), Foreign Tax Credit,
    // FBAR, FATCA Form 8938, tax treaties, PFIC warnings
    try {
        const intlOpts = analyzeInternationalTaxOptimizations(form);
        allOptimizations.push(...intlOpts);
    } catch (e) {
        console.warn('International tax optimizer error:', e);
    }

    // Step 3: Filter and sort optimizations
    // Only show optimizations with positive savings potential
    const beneficialOptimizations = allOptimizations
        .filter(opt => opt.potentialSavings > 0)
        .sort((a, b) => b.potentialSavings - a.potentialSavings);

    // Step 4: Calculate total potential savings
    // Note: Savings may not be fully additive (some optimizations are mutually exclusive)
    const totalPotentialSavings = beneficialOptimizations.reduce(
        (sum, opt) => sum + (opt.potentialSavings || 0),
        0
    );

    // Return comprehensive results
    return {
        currentTax,
        optimizations: beneficialOptimizations,
        totalPotentialSavings,
        optimizedTax: Math.max(0, currentTax.finalTax - totalPotentialSavings),
        summary: generateSummary(beneficialOptimizations),
    };
}


/**
 * Generate summary statistics for optimizations
 * 
 * Provides quick overview:
 * - Total number of recommendations
 * - Breakdown by category
 * - Top recommendation
 * - Number of "easy wins" (low-effort, high-value)
 * 
 * @param {Array} optimizations - Array of optimization objects
 * @returns {Object} - Summary statistics
 */
function generateSummary(optimizations) {
    // Group by category
    const byCategory = {};

    optimizations.forEach(opt => {
        if (!byCategory[opt.category]) {
            byCategory[opt.category] = {
                count: 0,
                totalSavings: 0,
            };
        }
        byCategory[opt.category].count++;
        byCategory[opt.category].totalSavings += opt.potentialSavings || 0;
    });

    return {
        totalCount: optimizations.length,
        byCategory,
        topRecommendation: optimizations[0] || null,
        easyWins: optimizations.filter(o => o.difficulty === DIFFICULTY.EASY).length,
    };
}


// ============================================================================
// WHAT-IF SCENARIO ANALYSIS
// ============================================================================
/**
 * Run a "what-if" scenario with selected optimizations
 * 
 * USE CASE:
 * User wants to see the impact of implementing specific optimizations.
 * "What if I max out my 401(k) AND switch to Head of Household?"
 * 
 * HOW IT WORKS:
 * 1. Get all available optimizations
 * 2. Filter to user-selected ones
 * 3. Apply form overrides from each optimization
 * 4. Recalculate tax with modified form
 * 5. Return comparison (original vs. optimized)
 * 
 * @param {Object} form - Original form data
 * @param {Array} selectedOptimizationIds - Array of optimization IDs to apply
 * @returns {Object} - Scenario results:
 *   - originalTax: Tax before optimizations
 *   - newTax: Tax after optimizations
 *   - savings: Difference (positive = savings)
 *   - selectedOptimizations: Applied optimizations
 */
export function runWhatIfScenario(form, selectedOptimizationIds) {
    // Get all possible optimizations
    const { optimizations } = analyzeTaxOptimizations(form);

    // Filter to selected ones
    const selectedOpts = optimizations.filter(opt =>
        selectedOptimizationIds.includes(opt.id)
    );

    // Build modified form by applying each optimization's formOverrides
    let modifiedForm = { ...form };

    selectedOpts.forEach(opt => {
        if (opt.formOverrides) {
            modifiedForm = { ...modifiedForm, ...opt.formOverrides };
        }
    });

    // Calculate taxes before and after
    const originalTax = calculateTotalTax(form);
    const newTax = calculateTotalTax(modifiedForm);

    return {
        originalTax,
        newTax,
        savings: originalTax.finalTax - newTax.finalTax,
        selectedOptimizations: selectedOpts,
    };
}


// ============================================================================
// FILTERING UTILITIES
// ============================================================================

/**
 * Get optimizations filtered by category
 * 
 * @param {Array} optimizations - Array of optimization objects
 * @param {string} category - Category to filter by (from CATEGORY enum)
 * @returns {Array} - Filtered optimizations
 * 
 * EXAMPLE:
 * const retirementOpts = getOptimizationsByCategory(results.optimizations, CATEGORY.RETIREMENT);
 */
export function getOptimizationsByCategory(optimizations, category) {
    return optimizations.filter(opt => opt.category === category);
}


/**
 * Get optimizations filtered by difficulty
 * 
 * @param {Array} optimizations - Array of optimization objects
 * @param {string} difficulty - Difficulty level (from DIFFICULTY enum)
 * @returns {Array} - Filtered optimizations
 * 
 * EXAMPLE:
 * const easyWins = getOptimizationsByDifficulty(results.optimizations, DIFFICULTY.EASY);
 */
export function getOptimizationsByDifficulty(optimizations, difficulty) {
    return optimizations.filter(opt => opt.difficulty === difficulty);
}


// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format currency for display
 * 
 * @param {number} amount - Dollar amount
 * @returns {string} - Formatted string (e.g., "$12,345")
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}


/**
 * Calculate effective tax rate
 * 
 * Effective rate = (Total Tax / Total Income) × 100
 * 
 * This is different from marginal rate!
 * - Marginal rate: Rate on the NEXT dollar of income
 * - Effective rate: Average rate across ALL income
 * 
 * @param {number} tax - Total tax liability
 * @param {number} income - Total income
 * @returns {number} - Effective rate as percentage
 * 
 * EXAMPLE:
 * calculateEffectiveRate(15000, 100000) → 15 (meaning 15%)
 */
export function calculateEffectiveRate(tax, income) {
    if (income <= 0) return 0;
    return (tax / income) * 100;
}
