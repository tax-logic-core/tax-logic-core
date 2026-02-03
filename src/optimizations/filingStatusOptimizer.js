/**
 * Filing Status Optimizer
 * Analyzes MFJ vs MFS, Head of Household eligibility, and community property strategies
 */

import { calculateTotalTax, calculateTaxWithOverrides, STANDARD_DEDUCTIONS_2025 } from '../calculations/calculateTax.js';
import { DIFFICULTY, CATEGORY } from './taxOptimizer.js';
import { isCommunityPropertyState, analyzeCaliforniaMentalHealthTax } from '../stateData/communityPropertyStates.js';

/**
 * Analyze all filing status optimization opportunities
 */
export function analyzeFilingStatusOptimizations(form) {
    const optimizations = [];
    const currentStatus = form.filingStatus || 'single';

    // MFJ vs MFS analysis for married filers
    if (currentStatus === 'married') {
        const mfsOptimization = analyzeMFJvsMFS(form);
        if (mfsOptimization) {
            optimizations.push(mfsOptimization);
        }
    }

    // MFS vs MFJ analysis (if currently filing MFS but MFJ might be better)
    if (currentStatus === 'marriedSeparate') {
        const mfjOptimization = analyzeMFSvsMFJ(form);
        if (mfjOptimization) {
            optimizations.push(mfjOptimization);
        }
    }

    // Single to Head of Household analysis
    if (currentStatus === 'single') {
        const hohOptimization = analyzeSingleToHOH(form);
        if (hohOptimization) {
            optimizations.push(hohOptimization);
        }
    }

    // Community property state analysis
    const state = form.state || form.stateOfResidence || '';
    if (isCommunityPropertyState(state) && currentStatus === 'married') {
        const cpOptimization = analyzeCommunityPropertyMFS(form, state);
        if (cpOptimization) {
            optimizations.push(cpOptimization);
        }
    }

    return optimizations;
}

/**
 * Analyze MFJ vs MFS (Married Filing Jointly vs Married Filing Separately)
 */
function analyzeMFJvsMFS(form) {
    const currentTax = calculateTotalTax(form);

    // Calculate tax with MFS
    const mfsTax = calculateTaxWithOverrides(form, { filingStatus: 'marriedSeparate' });

    // Note: MFS usually costs MORE due to lost credits, but check anyway
    // Also important for: high medical expenses, student loan IDR, liability protection
    const savings = currentTax.finalTax - mfsTax.finalTax;

    // MFS is rarely beneficial except for specific situations
    if (savings > 0) {
        return {
            id: 'filing-mfj-to-mfs',
            name: 'Consider Married Filing Separately',
            category: CATEGORY.FILING_STATUS,
            potentialSavings: savings,
            difficulty: DIFFICULTY.EASY,
            description: 'Filing separately may reduce your tax liability in your situation.',
            details: [
                `Current MFJ tax: $${currentTax.finalTax.toLocaleString()}`,
                `Estimated MFS tax: $${mfsTax.finalTax.toLocaleString()}`,
                `Potential savings: $${savings.toLocaleString()}`,
            ],
            considerations: [
                'MFS may reduce access to some credits (EITC, education credits)',
                'Both spouses must itemize OR both take standard deduction',
                'May benefit if one spouse has high medical expenses',
                'Useful for student loan income-driven repayment plans',
            ],
            formOverrides: { filingStatus: 'marriedSeparate' },
            timeline: 'This Return',
        };
    }

    // Check for specific MFS advantages even if total tax is higher
    const medicalExpenses = parseFloat(form.medicalExpenses) || 0;
    const agi = currentTax.agi;

    // Check if MFS would help with medical expense deduction (7.5% AGI threshold)
    if (medicalExpenses > 0 && medicalExpenses < agi * 0.075) {
        // Split income could lower AGI threshold
        const halfAGI = agi / 2;
        if (medicalExpenses > halfAGI * 0.075) {
            const potentialMedicalDeduction = medicalExpenses - (halfAGI * 0.075);
            const estimatedSavings = potentialMedicalDeduction * 0.22; // Estimate 22% bracket

            return {
                id: 'filing-mfs-medical',
                name: 'MFS for Medical Expense Deduction',
                category: CATEGORY.FILING_STATUS,
                potentialSavings: estimatedSavings,
                difficulty: DIFFICULTY.MEDIUM,
                description: 'Filing separately could allow you to deduct more medical expenses.',
                details: [
                    `Your medical expenses: $${medicalExpenses.toLocaleString()}`,
                    `Current 7.5% AGI threshold: $${(agi * 0.075).toLocaleString()}`,
                    `Split AGI threshold would be: $${(halfAGI * 0.075).toLocaleString()}`,
                    'Expenses must exceed threshold to be deductible',
                ],
                considerations: [
                    'Calculate total tax both ways before deciding',
                    'Lost credits may outweigh medical deduction benefit',
                    'Consult a tax professional for complex situations',
                ],
                timeline: 'This Return',
            };
        }
    }

    return null;
}

/**
 * Analyze MFS vs MFJ (if currently filing separately)
 */
function analyzeMFSvsMFJ(form) {
    const currentTax = calculateTotalTax(form);

    // Calculate tax with MFJ
    const mfjTax = calculateTaxWithOverrides(form, { filingStatus: 'married' });

    const savings = currentTax.finalTax - mfjTax.finalTax;

    if (savings > 100) { // Only recommend if meaningful savings
        return {
            id: 'filing-mfs-to-mfj',
            name: 'Switch to Married Filing Jointly',
            category: CATEGORY.FILING_STATUS,
            potentialSavings: savings,
            difficulty: DIFFICULTY.EASY,
            description: 'Filing jointly would save you money compared to filing separately.',
            details: [
                `Current MFS tax: $${currentTax.finalTax.toLocaleString()}`,
                `Estimated MFJ tax: $${mfjTax.finalTax.toLocaleString()}`,
                `Potential savings: $${savings.toLocaleString()}`,
            ],
            benefits: [
                'Higher standard deduction ($31,400 vs $15,700)',
                'More favorable tax brackets',
                'Access to full credits (EITC, education, etc.)',
                'Simpler filing process',
            ],
            formOverrides: { filingStatus: 'married' },
            timeline: 'This Return',
        };
    }

    return null;
}

/**
 * Analyze Single to Head of Household opportunity
 */
function analyzeSingleToHOH(form) {
    const dependents = form.dependents || [];

    // Need qualifying person for HOH
    const hasQualifyingPerson = dependents.some(d => d.qualifyingChild || d.qualifyingRelative);

    if (!hasQualifyingPerson) {
        return null;
    }

    const currentTax = calculateTotalTax(form);
    const hohTax = calculateTaxWithOverrides(form, { filingStatus: 'head' });

    const savings = currentTax.finalTax - hohTax.finalTax;

    if (savings > 0) {
        return {
            id: 'filing-single-to-hoh',
            name: 'File as Head of Household',
            category: CATEGORY.FILING_STATUS,
            potentialSavings: savings,
            difficulty: DIFFICULTY.EASY,
            description: 'You may qualify for Head of Household status based on your dependents.',
            details: [
                `Current tax (Single): $${currentTax.finalTax.toLocaleString()}`,
                `Estimated tax (HOH): $${hohTax.finalTax.toLocaleString()}`,
                `Potential savings: $${savings.toLocaleString()}`,
                `Standard deduction increases from $${STANDARD_DEDUCTIONS_2025.single.toLocaleString()} to $${STANDARD_DEDUCTIONS_2025.head.toLocaleString()}`,
            ],
            requirements: [
                'Must be unmarried (or considered unmarried) on Dec 31',
                'Must have paid more than half the cost of keeping up a home',
                'Must have a qualifying person live with you for more than half the year',
            ],
            formOverrides: { filingStatus: 'head' },
            timeline: 'This Return',
        };
    }

    return null;
}

/**
 * Analyze Community Property MFS benefits
 */
function analyzeCommunityPropertyMFS(form, state) {
    const currentTax = calculateTotalTax(form);
    const agi = currentTax.agi;

    // California-specific: Mental Health Tax analysis
    if (state === 'CA') {
        const caAnalysis = analyzeCaliforniaMentalHealthTax(agi);

        if (caAnalysis.mfsAdvantage && caAnalysis.savings > 0) {
            return {
                id: 'filing-ca-mental-health-mfs',
                name: 'Avoid California Mental Health Tax via MFS',
                category: CATEGORY.STATE,
                potentialSavings: caAnalysis.savings,
                difficulty: DIFFICULTY.MEDIUM,
                description: caAnalysis.recommendation,
                details: [
                    `Combined income: $${agi.toLocaleString()}`,
                    `Current CA mental health tax (1% over $1M): $${caAnalysis.currentTax.toLocaleString()}`,
                    `Split income per spouse: $${caAnalysis.splitIncome.toLocaleString()}`,
                    `Potential savings: $${caAnalysis.savings.toLocaleString()}`,
                ],
                considerations: [
                    'Must file Form 8958 to allocate community income',
                    'Compare total federal + state tax both ways',
                    'May lose some federal credits by filing MFS',
                    'Consult a CA tax professional',
                ],
                requirements: [
                    'California community property rules apply',
                    'Income must be community income (earned during marriage)',
                    'Both spouses must agree to file MFS',
                ],
                timeline: 'This Return',
            };
        }
    }

    // General community property MFS analysis
    // Benefits when there's significant income disparity
    const spouseAIncome = parseFloat(form.totalWages) || 0;
    const spouseBIncome = 0; // Would need spouse income field

    // Only beneficial if we have income disparity data
    // For now, return null unless we have spouse income data
    return null;
}

/**
 * Check if user qualifies for Head of Household
 */
export function checkHOHEligibility(form) {
    const status = form.filingStatus;
    const dependents = form.dependents || [];

    // Must be unmarried or considered unmarried
    if (status === 'married') {
        return {
            eligible: false,
            reason: 'You are currently filing as married. HOH requires being unmarried.',
        };
    }

    // Must have qualifying person
    const qualifyingPerson = dependents.find(d => d.qualifyingChild || d.qualifyingRelative);

    if (!qualifyingPerson) {
        return {
            eligible: false,
            reason: 'No qualifying person found. You need a qualifying child or relative.',
        };
    }

    return {
        eligible: true,
        qualifyingPerson: qualifyingPerson.firstName,
        benefit: 'Higher standard deduction and more favorable tax brackets',
    };
}
