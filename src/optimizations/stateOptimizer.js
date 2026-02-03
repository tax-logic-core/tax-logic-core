/**
 * State Tax Optimizer
 * Comprehensive state-specific tax optimization strategies for all 50 states
 */

import { calculateTotalTax } from '../calculations/calculateTax.js';
import { DIFFICULTY, CATEGORY } from './taxOptimizer.js';
import {
    NO_INCOME_TAX_STATES,
    FLAT_TAX_STATES,
    MASSACHUSETTS_RATES,
    WASHINGTON_CAPITAL_GAINS,
    CALIFORNIA_MENTAL_HEALTH_TAX,
    STATE_TAX_BRACKETS,
    calculateStateTax,
    calculateWashingtonCapitalGainsTax,
    getStateName,
} from '../stateData/stateTaxRates.js';
import {
    STATE_EITC,
    STATE_CTC,
    calculateStateEITC,
    calculateStateCTC,
    hasStateEITC,
    hasStateCTC,
} from '../stateData/stateCredits.js';
import {
    STATE_529_DEDUCTIONS,
    calculate529Benefit,
    has529Benefit,
} from '../stateData/state529Plans.js';
import {
    COMMUNITY_PROPERTY_STATES,
    isCommunityPropertyState,
    analyzeCaliforniaMentalHealthTax,
} from '../stateData/communityPropertyStates.js';
import {
    isSSFullyExempt,
    calculateSSStateExclusion,
    getStateRetirementSummary,
} from '../stateData/stateRetirementExclusions.js';

/**
 * Analyze all state-specific optimization opportunities
 */
export function analyzeStateOptimizations(form, state) {
    const optimizations = [];

    if (!state) return optimizations;

    // No income tax state info
    if (NO_INCOME_TAX_STATES.includes(state)) {
        const noTaxOpt = analyzeNoIncomeTaxState(form, state);
        if (noTaxOpt) {
            optimizations.push(noTaxOpt);
        }
    }

    // Washington capital gains tax
    if (state === 'WA') {
        const waCapGainsOpt = analyzeWashingtonCapitalGains(form);
        if (waCapGainsOpt) {
            optimizations.push(waCapGainsOpt);
        }
    }

    // California-specific optimizations
    if (state === 'CA') {
        const caOpts = analyzeCaliforniaOptimizations(form);
        optimizations.push(...caOpts);
    }

    // New York-specific optimizations
    if (state === 'NY') {
        const nyOpts = analyzeNewYorkOptimizations(form);
        optimizations.push(...nyOpts);
    }

    // Massachusetts millionaire's tax
    if (state === 'MA') {
        const maOpt = analyzeMassachusettsTax(form);
        if (maOpt) {
            optimizations.push(maOpt);
        }
    }

    // State EITC
    if (hasStateEITC(state)) {
        const eitcOpt = analyzeStateEITC(form, state);
        if (eitcOpt) {
            optimizations.push(eitcOpt);
        }
    }

    // State CTC
    if (hasStateCTC(state)) {
        const ctcOpt = analyzeStateCTC(form, state);
        if (ctcOpt) {
            optimizations.push(ctcOpt);
        }
    }

    // 529 Plan deduction
    if (has529Benefit(state)) {
        const plan529Opt = analyze529PlanDeduction(form, state);
        if (plan529Opt) {
            optimizations.push(plan529Opt);
        }
    }

    // Community property state MFS analysis
    if (isCommunityPropertyState(state)) {
        const cpOpt = analyzeCommunityPropertyFilingStatus(form, state);
        if (cpOpt) {
            optimizations.push(cpOpt);
        }
    }

    // State retirement income exclusions
    const retirementOpt = analyzeStateRetirementExclusion(form, state);
    if (retirementOpt) {
        optimizations.push(retirementOpt);
    }

    // Pass-through entity tax (PTET) - SALT workaround
    const ptetOpt = analyzePassThroughEntityTax(form, state);
    if (ptetOpt) {
        optimizations.push(ptetOpt);
    }

    // High-tax state general strategies
    if (isHighTaxState(state)) {
        const highTaxOpts = analyzeHighTaxStateStrategies(form, state);
        optimizations.push(...highTaxOpts);
    }

    return optimizations;
}

/**
 * No income tax state info
 */
function analyzeNoIncomeTaxState(form, state) {
    const stateName = getStateName(state);
    const notes = [];

    if (state === 'WA') {
        notes.push('Washington has a 7% long-term capital gains tax on gains over $270,000');
    }
    if (state === 'NH') {
        notes.push('New Hampshire eliminated interest/dividend tax starting 2025');
    }
    if (state === 'TN') {
        notes.push('Tennessee Hall Tax on interest/dividends fully repealed');
    }

    return {
        id: `state-${state.toLowerCase()}-no-income-tax`,
        name: `${stateName} - No State Income Tax`,
        category: CATEGORY.STATE,
        potentialSavings: 0,
        difficulty: DIFFICULTY.EASY,
        description: `${stateName} does not impose a state income tax on wages and salary.`,
        details: [
            'No state income tax withholding required',
            'Federal tax planning is your primary focus',
            ...notes,
        ],
        considerations: [
            'Consider higher property taxes or sales taxes',
            'Review domicile requirements if relocating',
            'Some local taxes may still apply',
        ],
        isInformational: true,
        timeline: 'N/A',
    };
}

/**
 * Washington capital gains tax analysis
 */
function analyzeWashingtonCapitalGains(form) {
    const longTermGain = form.hasScheduleD
        ? parseFloat(form.scheduleD?.longTermGain) || 0
        : 0;

    if (longTermGain > WASHINGTON_CAPITAL_GAINS.threshold) {
        const waTax = calculateWashingtonCapitalGainsTax(longTermGain);

        return {
            id: 'state-wa-capital-gains',
            name: 'Washington Capital Gains Tax Applies',
            category: CATEGORY.STATE,
            potentialSavings: 0,
            difficulty: DIFFICULTY.HARD,
            description: `Washington imposes a 7% tax on long-term capital gains over $${WASHINGTON_CAPITAL_GAINS.threshold.toLocaleString()}.`,
            details: [
                `Your long-term gains: $${longTermGain.toLocaleString()}`,
                `Threshold: $${WASHINGTON_CAPITAL_GAINS.threshold.toLocaleString()}`,
                `Estimated WA capital gains tax: $${waTax.toLocaleString()}`,
            ],
            strategies: [
                'Time gains to stay under $270,000 threshold',
                'Consider tax-loss harvesting to offset gains',
                'Review charitable giving of appreciated assets',
                'Plan gains across multiple tax years if possible',
            ],
            isInformational: true,
            timeline: 'Tax Planning',
        };
    }

    return null;
}

/**
 * California-specific optimizations
 */
function analyzeCaliforniaOptimizations(form) {
    const optimizations = [];
    const currentTax = calculateTotalTax(form);
    const agi = currentTax.agi;
    const filingStatus = form.filingStatus;

    // 1. Mental Health Tax (1% over $1M)
    if (filingStatus === 'married' && agi > CALIFORNIA_MENTAL_HEALTH_TAX.threshold) {
        const caAnalysis = analyzeCaliforniaMentalHealthTax(agi);

        if (caAnalysis.applies) {
            optimizations.push({
                id: 'state-ca-mental-health-tax',
                name: 'California Mental Health Tax (1%)',
                category: CATEGORY.STATE,
                potentialSavings: caAnalysis.mfsAdvantage ? caAnalysis.savings : 0,
                difficulty: caAnalysis.mfsAdvantage ? DIFFICULTY.MEDIUM : DIFFICULTY.EASY,
                description: `Your income exceeds $1M - subject to 1% mental health surcharge.`,
                details: [
                    `Combined AGI: $${agi.toLocaleString()}`,
                    `Mental health tax: $${caAnalysis.currentTax.toLocaleString()}`,
                    caAnalysis.mfsAdvantage
                        ? `Filing MFS could save: $${caAnalysis.savings.toLocaleString()}`
                        : 'MFS would not help (each spouse still over $1M)',
                ],
                strategy: caAnalysis.mfsAdvantage
                    ? [
                        'Consider Married Filing Separately (MFS)',
                        'Community property rules split income 50/50',
                        'Each spouse stays under $1M threshold',
                        'File Form 8958 for income allocation',
                    ]
                    : [],
                timeline: caAnalysis.mfsAdvantage ? 'This Return' : 'N/A',
            });
        }
    }

    // 2. CalEITC
    const dependents = form.dependents || [];
    const numChildren = dependents.filter(d => d.qualifyingChild).length;

    if (STATE_EITC.CA) {
        // Calculate earned income including self-employment
        let seIncome = 0;
        if (form.hasScheduleC && form.scheduleC) {
            if (form.scheduleC.netProfit !== undefined && form.scheduleC.netProfit !== 0) {
                seIncome = Math.max(0, parseFloat(form.scheduleC.netProfit) || 0);
            } else {
                seIncome = Math.max(0, (parseFloat(form.scheduleC?.grossReceipts) || 0) -
                    (parseFloat(form.scheduleC?.expenses) || 0));
            }
        }
        const earnedIncome = (parseFloat(form.totalWages) || 0) + seIncome;

        if (earnedIncome > 0 && earnedIncome <= STATE_EITC.CA.incomeLimit) {
            optimizations.push({
                id: 'state-ca-eitc',
                name: 'California Earned Income Tax Credit (CalEITC)',
                category: CATEGORY.STATE,
                potentialSavings: STATE_EITC.CA.maxCredit,
                difficulty: DIFFICULTY.EASY,
                description: `Claim CalEITC - up to $${STATE_EITC.CA.maxCredit.toLocaleString()} for eligible workers.`,
                details: [
                    `Your earned income: $${earnedIncome.toLocaleString()}`,
                    `Income limit: $${STATE_EITC.CA.incomeLimit.toLocaleString()}`,
                    `Maximum credit: $${STATE_EITC.CA.maxCredit.toLocaleString()}`,
                    'Fully refundable - get cash back!',
                ],
                timeline: 'This Return',
            });

            // 3. Young Child Tax Credit
            const childrenUnder6 = dependents.filter(d => d.age && d.age < 6).length;
            if (childrenUnder6 > 0) {
                optimizations.push({
                    id: 'state-ca-yctc',
                    name: 'California Young Child Tax Credit',
                    category: CATEGORY.STATE,
                    potentialSavings: STATE_CTC.CA?.maxCredit || 1183,
                    difficulty: DIFFICULTY.EASY,
                    description: 'Additional credit for children under 6.',
                    details: [
                        `Children under 6: ${childrenUnder6}`,
                        `Maximum credit: $${(STATE_CTC.CA?.maxCredit || 1183).toLocaleString()}`,
                        'Stacks with CalEITC',
                        'Same income limits as CalEITC',
                    ],
                    timeline: 'This Return',
                });
            }
        }
    }

    // 4. CA 529 - No deduction available
    // Informational note handled elsewhere

    return optimizations;
}

/**
 * New York-specific optimizations
 */
function analyzeNewYorkOptimizations(form) {
    const optimizations = [];
    const currentTax = calculateTotalTax(form);
    const agi = currentTax.agi;

    // 1. Empire State Child Credit
    const dependents = form.dependents || [];
    const qualifyingChildren = dependents.filter(d => d.qualifyingChild).length;

    if (qualifyingChildren > 0) {
        const childrenUnder4 = dependents.filter(d => d.age && d.age < 4).length;
        const children4to16 = qualifyingChildren - childrenUnder4;

        const esccCredit = (childrenUnder4 * 1000) + (children4to16 * 330);

        optimizations.push({
            id: 'state-ny-escc',
            name: 'New York Empire State Child Credit',
            category: CATEGORY.STATE,
            potentialSavings: esccCredit,
            difficulty: DIFFICULTY.EASY,
            description: 'Claim the Empire State Child Credit for your children.',
            details: [
                `Children under 4: ${childrenUnder4} × $1,000 = $${(childrenUnder4 * 1000).toLocaleString()}`,
                `Children 4-16: ${children4to16} × $330 = $${(children4to16 * 330).toLocaleString()}`,
                `Total credit: $${esccCredit.toLocaleString()}`,
                'Fully refundable!',
            ],
            timeline: 'This Return',
        });
    }

    // 2. NY EITC (30% of federal)
    const federalEITC = parseFloat(form.earnedIncomeCredit) || 0;
    if (federalEITC > 0) {
        const nyEITC = federalEITC * 0.30;

        optimizations.push({
            id: 'state-ny-eitc',
            name: 'New York EITC',
            category: CATEGORY.STATE,
            potentialSavings: Math.round(nyEITC),
            difficulty: DIFFICULTY.EASY,
            description: 'New York matches 30% of your federal EITC.',
            details: [
                `Federal EITC: $${federalEITC.toLocaleString()}`,
                `NY EITC (30%): $${nyEITC.toLocaleString()}`,
                'Fully refundable',
            ],
            timeline: 'This Return',
        });
    }

    // 3. NY 529 deduction
    const contributions529 = parseFloat(form.contributions529) || 0;
    if (contributions529 > 0) {
        const maxDeduction = form.filingStatus === 'married' ? 10000 : 5000;
        const deduction = Math.min(contributions529, maxDeduction);

        optimizations.push({
            id: 'state-ny-529',
            name: 'New York 529 Deduction',
            category: CATEGORY.STATE,
            potentialSavings: Math.round(deduction * getStateMarignalRate(agi, 'NY')),
            difficulty: DIFFICULTY.EASY,
            description: 'Deduct 529 contributions from NY taxable income.',
            details: [
                `Your contributions: $${contributions529.toLocaleString()}`,
                `Maximum deduction: $${maxDeduction.toLocaleString()}`,
                `Deduction allowed: $${deduction.toLocaleString()}`,
                'Must contribute to NY 529 plan',
            ],
            timeline: 'This Return',
        });
    }

    // 4. High earner surcharge (>$25M)
    if (agi > 25000000) {
        optimizations.push({
            id: 'state-ny-surcharge',
            name: 'NY High Earner Surcharge Alert',
            category: CATEGORY.STATE,
            potentialSavings: 0,
            difficulty: DIFFICULTY.HARD,
            description: 'Your income triggers NY\'s highest bracket (10.9%).',
            details: [
                `Your AGI: $${agi.toLocaleString()}`,
                'Income over $25M taxed at 10.9%',
                'Consider income timing strategies',
            ],
            isInformational: true,
            timeline: 'Tax Planning',
        });
    }

    return optimizations;
}

/**
 * Massachusetts millionaire's tax
 */
function analyzeMassachusettsTax(form) {
    const currentTax = calculateTotalTax(form);
    const taxableIncome = currentTax.taxableIncome;

    if (taxableIncome > MASSACHUSETTS_RATES.millionaireThreshold) {
        const excessIncome = taxableIncome - MASSACHUSETTS_RATES.millionaireThreshold;
        const additionalTax = excessIncome * (MASSACHUSETTS_RATES.millionaireRate - MASSACHUSETTS_RATES.regular);

        return {
            id: 'state-ma-millionaire-tax',
            name: 'Massachusetts Millionaire\'s Tax',
            category: CATEGORY.STATE,
            potentialSavings: 0,
            difficulty: DIFFICULTY.HARD,
            description: 'Your income over $1M is subject to 9% tax (vs 5% regular rate).',
            details: [
                `Taxable income: $${taxableIncome.toLocaleString()}`,
                `Excess over $1M: $${excessIncome.toLocaleString()}`,
                `Additional tax (4% surcharge): $${additionalTax.toLocaleString()}`,
            ],
            strategies: [
                'Maximize 401(k) and IRA contributions',
                'Time income realization across years',
                'Consider charitable giving to reduce income',
                'Review installment sale for large gains',
            ],
            isInformational: true,
            timeline: 'Tax Planning',
        };
    }

    return null;
}

/**
 * State EITC analysis
 */
function analyzeStateEITC(form, state) {
    const stateEITC = STATE_EITC[state];
    if (!stateEITC) return null;

    const federalEITC = parseFloat(form.earnedIncomeCredit) || 0;
    if (federalEITC <= 0) return null;

    const dependents = form.dependents || [];
    const numChildren = dependents.filter(d => d.qualifyingChild).length;

    const stateCredit = calculateStateEITC(state, federalEITC, numChildren);

    if (stateCredit > 0) {
        return {
            id: `state-${state.toLowerCase()}-eitc`,
            name: `${stateEITC.name}`,
            category: CATEGORY.STATE,
            potentialSavings: Math.round(stateCredit),
            difficulty: DIFFICULTY.EASY,
            description: stateEITC.description,
            details: [
                `Federal EITC: $${federalEITC.toLocaleString()}`,
                stateEITC.type === 'percentage'
                    ? `State credit (${stateEITC.percentage * 100}%): $${stateCredit.toLocaleString()}`
                    : `State credit: $${stateCredit.toLocaleString()}`,
                stateEITC.refundable ? 'Fully refundable' : 'Non-refundable',
            ],
            timeline: 'This Return',
        };
    }

    return null;
}

/**
 * State CTC analysis
 */
function analyzeStateCTC(form, state) {
    const stateCTC = STATE_CTC[state];
    if (!stateCTC) return null;

    const dependents = form.dependents || [];
    const numChildren = dependents.filter(d => d.qualifyingChild).length;
    if (numChildren === 0) return null;

    const childrenUnder6 = dependents.filter(d => d.age && d.age < 6).length;
    const stateCredit = calculateStateCTC(state, numChildren, childrenUnder6, form);

    if (stateCredit > 0) {
        return {
            id: `state-${state.toLowerCase()}-ctc`,
            name: stateCTC.name,
            category: CATEGORY.STATE,
            potentialSavings: Math.round(stateCredit),
            difficulty: DIFFICULTY.EASY,
            description: stateCTC.description || `${getStateName(state)} child tax credit`,
            details: [
                `Qualifying children: ${numChildren}`,
                `Estimated credit: $${stateCredit.toLocaleString()}`,
                stateCTC.refundable ? 'Fully refundable' : 'Non-refundable',
            ],
            timeline: 'This Return',
        };
    }

    return null;
}

/**
 * 529 Plan deduction analysis
 */
function analyze529PlanDeduction(form, state) {
    const contributions529 = parseFloat(form.contributions529) || 0;

    // Even if no current contributions, suggest if they have children
    const dependents = form.dependents || [];
    const hasChildren = dependents.length > 0;

    if (contributions529 > 0) {
        const benefit = calculate529Benefit(
            state,
            contributions529,
            form.filingStatus,
            getStateMarignalRate(calculateTotalTax(form).taxableIncome, state)
        );

        if (benefit.type !== 'none') {
            return {
                id: `state-${state.toLowerCase()}-529`,
                name: `${getStateName(state)} 529 Plan ${benefit.type === 'credit' ? 'Credit' : 'Deduction'}`,
                category: CATEGORY.STATE,
                potentialSavings: Math.round(benefit.amount || benefit.taxSavings || 0),
                difficulty: DIFFICULTY.EASY,
                description: benefit.description,
                details: [
                    `Your contributions: $${contributions529.toLocaleString()}`,
                    benefit.type === 'credit'
                        ? `Tax credit: $${benefit.amount.toLocaleString()}`
                        : `Deduction: $${benefit.deductionAmount.toLocaleString()}`,
                    benefit.taxParity ? 'Any state\'s 529 plan qualifies' : 'Must be state\'s own 529 plan',
                ],
                timeline: 'This Return',
            };
        }
    } else if (hasChildren) {
        const planInfo = STATE_529_DEDUCTIONS[state];
        if (planInfo) {
            const maxDeduction = typeof planInfo.maxDeduction?.[form.filingStatus === 'married' ? 'married' : 'single'] === 'number'
                ? planInfo.maxDeduction[form.filingStatus === 'married' ? 'married' : 'single']
                : 'unlimited';

            return {
                id: `state-${state.toLowerCase()}-529-opportunity`,
                name: `${getStateName(state)} 529 Plan Opportunity`,
                category: CATEGORY.STATE,
                potentialSavings: 0, // Opportunity, not current savings
                difficulty: DIFFICULTY.EASY,
                description: `${getStateName(state)} offers tax benefits for 529 contributions.`,
                details: [
                    planInfo.type === 'credit'
                        ? 'Tax credit available for contributions'
                        : `Deduction up to $${typeof maxDeduction === 'number' ? maxDeduction.toLocaleString() : maxDeduction}`,
                    planInfo.inStateOnly === false ? 'Any state\'s 529 qualifies' : 'Must use in-state 529 plan',
                    'Contributions grow tax-free for education',
                ],
                isOpportunity: true,
                timeline: 'Future Planning',
            };
        }
    }

    return null;
}

/**
 * Community property filing status
 */
function analyzeCommunityPropertyFilingStatus(form, state) {
    const filingStatus = form.filingStatus;
    if (filingStatus !== 'married') return null;

    // Already handling CA mental health tax separately
    if (state === 'CA') return null;

    return {
        id: `state-${state.toLowerCase()}-community-property`,
        name: `${getStateName(state)} Community Property Rules`,
        category: CATEGORY.STATE,
        potentialSavings: 0,
        difficulty: DIFFICULTY.MEDIUM,
        description: `${getStateName(state)} is a community property state - special rules for MFS.`,
        details: [
            'Community income split 50/50 between spouses',
            'May benefit from filing MFS in certain situations',
            'Form 8958 required to allocate income',
        ],
        scenarios: [
            'High income disparity between spouses',
            'One spouse has high medical expenses',
            'Student loan income-driven repayment',
            'State-specific tax threshold avoidance',
        ],
        isInformational: true,
        timeline: 'Review Before Filing',
    };
}

/**
 * State retirement income exclusion
 */
function analyzeStateRetirementExclusion(form, state) {
    const ssIncome = parseFloat(form.taxableSocialSecurity) || 0;
    const pensionIncome = parseFloat(form.taxablePensions) || 0;

    if (ssIncome <= 0 && pensionIncome <= 0) return null;

    const summary = getStateRetirementSummary(state);

    if (summary.socialSecurity.fullyExempt || summary.pension) {
        const details = [];

        if (ssIncome > 0 && summary.socialSecurity.fullyExempt) {
            details.push(`Social Security: $${ssIncome.toLocaleString()} - fully exempt from state tax`);
        } else if (ssIncome > 0 && summary.socialSecurity.rules) {
            details.push(`Social Security: Check ${summary.socialSecurity.rules.description}`);
        }

        if (pensionIncome > 0 && summary.pension) {
            details.push(`Pension income: Review ${getStateName(state)} exclusion rules`);
        }

        return {
            id: `state-${state.toLowerCase()}-retirement`,
            name: `${getStateName(state)} Retirement Income Exclusions`,
            category: CATEGORY.STATE,
            potentialSavings: 0,
            difficulty: DIFFICULTY.EASY,
            description: `${getStateName(state)} may exclude some retirement income from state tax.`,
            details,
            isInformational: true,
            timeline: 'This Return',
        };
    }

    return null;
}

/**
 * Pass-through entity tax (PTET) analysis
 */
function analyzePassThroughEntityTax(form, state) {
    // PTET is available in many states as SALT workaround
    const ptetStates = ['CA', 'NY', 'NJ', 'CT', 'MD', 'IL', 'MA', 'GA', 'CO', 'WI', 'OR', 'RI', 'AZ', 'OK', 'LA', 'AL', 'AR', 'ID', 'MI', 'MN', 'NC', 'SC'];

    if (!ptetStates.includes(state)) return null;
    if (!form.hasScheduleC && !form.hasSCorp && !form.hasPartnership) return null;

    // Check if SALT deduction is limited
    const stateLocalTaxes = parseFloat(form.stateLocalTaxes) || 0;
    const realEstateTaxes = parseFloat(form.realEstateTaxes) || 0;
    const totalSALT = stateLocalTaxes + realEstateTaxes;
    const saltCap = form.filingStatus === 'marriedSeparate' ? 20000 : 40000;

    if (totalSALT <= saltCap) return null; // Not benefiting from PTET

    return {
        id: `state-${state.toLowerCase()}-ptet`,
        name: `${getStateName(state)} Pass-Through Entity Tax Election`,
        category: CATEGORY.STATE,
        potentialSavings: Math.round((totalSALT - saltCap) * 0.30), // Rough estimate
        difficulty: DIFFICULTY.HARD,
        description: 'PTET election can help work around SALT deduction cap.',
        details: [
            `Your total SALT: $${totalSALT.toLocaleString()}`,
            `SALT cap: $${saltCap.toLocaleString()}`,
            `Excess limited: $${(totalSALT - saltCap).toLocaleString()}`,
            'PTET shifts state tax to entity level (deductible for entity)',
        ],
        requirements: [
            'Must have pass-through business income (S-Corp, Partnership, or Sole Prop)',
            'Election must be made by deadline (varies by state)',
            'Consult with CPA for proper setup',
        ],
        timeline: 'Future Tax Year',
    };
}

/**
 * High-tax state strategies
 */
function analyzeHighTaxStateStrategies(form, state) {
    const optimizations = [];
    const currentTax = calculateTotalTax(form);
    const taxableIncome = currentTax.taxableIncome;

    // Get state marginal rate
    const stateRate = getStateMarignalRate(taxableIncome, state);

    if (stateRate > 0.06) { // 6% threshold for "high tax"
        optimizations.push({
            id: `state-${state.toLowerCase()}-high-tax-strategies`,
            name: `${getStateName(state)} High Tax State Strategies`,
            category: CATEGORY.STATE,
            potentialSavings: 0,
            difficulty: DIFFICULTY.MEDIUM,
            description: `${getStateName(state)} has a ${(stateRate * 100).toFixed(1)}% top marginal rate.`,
            details: [
                `Your state marginal rate: ${(stateRate * 100).toFixed(1)}%`,
                'Consider these strategies to reduce state tax burden:',
            ],
            strategies: [
                'Maximize 401(k) and IRA contributions (reduces state taxable income)',
                'Consider municipal bonds from your state (exempt from state + federal)',
                'Review charitable giving strategies',
                'If self-employed, consider PTET election',
                'Time income and deductions strategically',
            ],
            isInformational: true,
            timeline: 'Ongoing',
        });
    }

    return optimizations;
}

/**
 * Check if state is high-tax
 */
function isHighTaxState(state) {
    const highTaxStates = ['CA', 'NY', 'NJ', 'OR', 'HI', 'MN', 'MA', 'DC', 'VT', 'IA', 'WI', 'ME', 'CT', 'NE', 'MD'];
    return highTaxStates.includes(state);
}

/**
 * Helper: Get state marginal rate (simplified)
 */
function getStateMarignalRate(taxableIncome, state) {
    if (NO_INCOME_TAX_STATES.includes(state)) return 0;

    if (FLAT_TAX_STATES[state]) {
        return FLAT_TAX_STATES[state].rate;
    }

    if (state === 'MA') {
        return taxableIncome > MASSACHUSETTS_RATES.millionaireThreshold
            ? MASSACHUSETTS_RATES.millionaireRate
            : MASSACHUSETTS_RATES.regular;
    }

    const brackets = STATE_TAX_BRACKETS[state];
    if (brackets && brackets.single) {
        const bracketList = brackets.single;
        for (let i = bracketList.length - 1; i >= 0; i--) {
            if (taxableIncome >= bracketList[i][0]) {
                return bracketList[i][1];
            }
        }
    }

    return 0.05; // Default assumption
}
