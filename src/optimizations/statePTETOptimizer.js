/**
 * ============================================================================
 * STATE PASS-THROUGH ENTITY TAX (PTET) OPTIMIZER
 * ============================================================================
 * 
 * This module analyzes state PTET elections, which provide a LEGAL workaround
 * to the federal $10,000 (now $40,000 after OBBBA) SALT deduction cap.
 * 
 * ============================================================================
 * WHAT IS PTET?
 * ============================================================================
 * 
 * Pass-Through Entity Tax allows S-corps, partnerships, and LLCs to pay state
 * income tax at the ENTITY level instead of the individual owner level.
 * 
 * WHY IT MATTERS:
 * - Entity-level taxes are deductible as BUSINESS expenses (no SALT cap!)
 * - Owners receive a state tax CREDIT for taxes paid by the entity
 * - Net effect: Bypass the federal SALT cap on pass-through income
 * 
 * EXAMPLE:
 * - S-Corp has $500,000 of pass-through income
 * - Owner in NY at 10% state rate = $50,000 state tax
 * - Without PTET: Only deduct first $40,000 (SALT cap), lose $10,000 deduction
 * - With PTET: Entity pays $50,000, deducts full amount as business expense
 * - Federal tax savings: $10,000 × 37% marginal rate = $3,700
 * 
 * ============================================================================
 * LEGAL AUTHORITY
 * ============================================================================
 * 
 * FEDERAL:
 * - IRS Notice 2020-75: Safe harbor confirming PTET deductibility
 *   https://www.irs.gov/pub/irs-drop/n-20-75.pdf
 * - IRC §164(b)(6): SALT cap (suspended for entity-level taxes)
 * 
 * STATE-SPECIFIC:
 * - Each state has its own enabling legislation (cited below per state)
 * 
 * ============================================================================
 * IMPORTANT NOTES
 * ============================================================================
 * 
 * 1. ELECTION REQUIRED: Most states require annual election by deadline
 * 2. OWNER CONSENT: Some states require all owners to consent
 * 3. ESTIMATED PAYMENTS: Many states require quarterly estimated payments
 * 4. CREDIT MECHANISM: Owners receive state credit for entity taxes paid
 * 5. NOT TAX ADVICE: Complex rules vary by state - consult professional
 * 
 * ============================================================================
 */

import { calculateTotalTax } from '../calculations/calculateTax.js';
import { DIFFICULTY, CATEGORY } from './taxOptimizer.js';


// ============================================================================
// SECTION 1: STATE PTET PROGRAM DATABASE
// ============================================================================
/**
 * Comprehensive database of state PTET programs as of 2025
 * 
 * States are continually adding and modifying programs.
 * This database covers the most commonly used programs.
 * 
 * KEY STATES: CA, NY, NJ, CT, GA, IL, MA, AZ, MD, MN, WI, NC, OH, OR, SC, VA
 * 
 * STRUCTURE:
 * - name: Official program name
 * - rate: Tax rate (flat or graduated)
 * - deadline: Election deadline
 * - eligibleEntities: Which entity types can elect
 * - minOwners: Minimum owners required (if any)
 * - notes: Special considerations
 * - authority: Legal citation
 */
export const STATE_PTET_PROGRAMS = {

    // ========================================================================
    // CALIFORNIA - Elective Pass-Through Entity Tax
    // ========================================================================
    /**
     * California's PTET was enacted in 2021 (AB 150) and extended through 2030.
     * 
     * HOW IT WORKS:
     * - Entity elects to pay 9.3% tax on qualified net income
     * - Owners receive nonrefundable credit equal to pro-rata share of tax paid
     * - Credit can reduce CA regular tax to tentative minimum tax
     * - Excess credit carries forward 5 years (no carryback)
     * 
     * QUALIFIED TAXPAYERS:
     * - Must be individual, estate, or trust (not corporations)
     * - Shareholders, partners, or members of qualifying entity
     * 
     * QUALIFIED ENTITIES:
     * - S corporations
     * - General partnerships
     * - Limited partnerships
     * - LLCs taxed as partnerships
     * 
     * EXCLUSIONS:
     * - Publicly traded partnerships
     * - Entities with corporate owners
     * 
     * LEGAL AUTHORITY: California Revenue and Taxation Code §19900-19906
     */
    CA: {
        name: 'California Elective Pass-Through Entity Tax',
        rate: 0.093,  // 9.3% flat rate
        deadline: 'March 15 (estimated), June 15 (final election)',
        minOwners: 1,
        eligibleEntities: ['S-Corp', 'Partnership', 'LP', 'LLC'],
        saltWorkaround: true,
        extendedTo: 2030,
        estimatedPayments: [
            { due: 'June 15', percent: 50, description: 'First installment with election' },
            { due: 'Return due date', percent: 50, description: 'Balance with return' },
        ],
        notes: [
            'Extended through 2030 by AB 150',
            'Credit is nonrefundable against CA regular tax',
            'Excess credit carries forward 5 years',
            'Cannot reduce tax below tentative minimum tax',
        ],
        authority: {
            citation: 'California Revenue & Taxation Code §19900-19906',
            url: 'https://www.ftb.ca.gov/file/business/credits/pass-through-entity-elective-tax.html',
        },
    },

    // ========================================================================
    // NEW YORK - Pass-Through Entity Tax
    // ========================================================================
    /**
     * New York's PTET uses GRADUATED rates (like NY individual rates).
     * This makes it more beneficial for higher-income pass-throughs.
     * 
     * HOW IT WORKS:
     * - Entity makes annual irrevocable election by March 15
     * - Tax paid on PTE taxable income at graduated rates
     * - Resident owners get refundable credit
     * - Nonresident owners: Credit limited to income sourced to NY
     * 
     * RATES (2025):
     * - $0 - $2M: 6.85%
     * - $2M - $5M: 9.65%
     * - $5M - $25M: 10.30%
     * - Over $25M: 10.90%
     * 
     * QUALIFIED ENTITIES:
     * - S corporations
     * - Partnerships (including LLCs treated as partnerships)
     * - Excludes: PTPs, entities with C-corp owners
     * 
     * LEGAL AUTHORITY: NY Tax Law Article 24-A (§860-§867)
     */
    NY: {
        name: 'New York Pass-Through Entity Tax',
        rates: [
            { min: 0, max: 2000000, rate: 0.0685, description: 'Up to $2M' },
            { min: 2000000, max: 5000000, rate: 0.0965, description: '$2M - $5M' },
            { min: 5000000, max: 25000000, rate: 0.1030, description: '$5M - $25M' },
            { min: 25000000, max: Infinity, rate: 0.1090, description: 'Over $25M' },
        ],
        deadline: 'March 15 (annual election - irrevocable for that year)',
        minOwners: 1,
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        estimatedPayments: [
            { due: 'March 15', percent: 25, description: 'Q1 estimated' },
            { due: 'June 15', percent: 25, description: 'Q2 estimated' },
            { due: 'September 15', percent: 25, description: 'Q3 estimated' },
            { due: 'January 15', percent: 25, description: 'Q4 estimated' },
        ],
        notes: [
            'Election is irrevocable for the tax year',
            'Resident owners receive refundable credit',
            'Nonresident credit limited to NY-source income',
            'Graduated rates mirror individual rates',
        ],
        authority: {
            citation: 'NY Tax Law Article 24-A (§860-§867)',
            url: 'https://www.tax.ny.gov/bus/ptet/',
        },
    },

    // ========================================================================
    // NEW JERSEY - Business Alternative Income Tax (BAIT)
    // ========================================================================
    /**
     * New Jersey's program uses GRADUATED rates similar to individual rates.
     * 
     * RATES (2025):
     * - Up to $250K: 5.675%
     * - $250K - $1M: 6.52%
     * - $1M - $5M: 9.12%
     * - Over $5M: 10.9%
     * 
     * UNIQUE FEATURES:
     * - Mandatory election if one owner elects (not truly elective)
     * - Credit is fully refundable
     * - Can elect on amended return for prior years
     * 
     * LEGAL AUTHORITY: N.J.S.A. 54A:12-1 through 12-12
     */
    NJ: {
        name: 'New Jersey Business Alternative Income Tax (BAIT)',
        rates: [
            { min: 0, max: 250000, rate: 0.05675, description: 'Up to $250K' },
            { min: 250000, max: 1000000, rate: 0.0652, description: '$250K - $1M' },
            { min: 1000000, max: 5000000, rate: 0.0912, description: '$1M - $5M' },
            { min: 5000000, max: Infinity, rate: 0.109, description: 'Over $5M' },
        ],
        deadline: 'March 15 (or 15th day of 3rd month)',
        minOwners: 1,
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        estimatedPayments: [
            { due: '15th of 4th month', percent: 25 },
            { due: '15th of 6th month', percent: 25 },
            { due: '15th of 9th month', percent: 25 },
            { due: '15th of 12th month', percent: 25 },
        ],
        notes: [
            'Credit is fully refundable',
            'Can file amended return to make election',
            'If one owner elects, all are bound',
        ],
        authority: {
            citation: 'N.J.S.A. 54A:12-1 through 12-12',
            url: 'https://www.state.nj.us/treasury/taxation/bait.shtml',
        },
    },

    // ========================================================================
    // CONNECTICUT - Pass-Through Entity Tax
    // ========================================================================
    /**
     * Connecticut's PTET is MANDATORY for most pass-throughs (unique!).
     * 
     * HOW IT WORKS:
     * - Entity pays tax at 6.99%
     * - Owners receive credit on individual returns
     * - Credit is refundable for residents
     * 
     * LEGAL AUTHORITY: Conn. Gen. Stat. §12-699 et seq.
     */
    CT: {
        name: 'Connecticut Pass-Through Entity Tax',
        rate: 0.0699,  // 6.99%
        mandatory: true,  // Unlike most states, CT PTET is mandatory
        deadline: 'N/A - Mandatory',
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        estimatedPayments: [
            { due: 'April 15', percent: 25 },
            { due: 'June 15', percent: 25 },
            { due: 'September 15', percent: 25 },
            { due: 'January 15', percent: 25 },
        ],
        notes: [
            'MANDATORY for most pass-throughs (not elective!)',
            'One of the first states to implement workaround',
            'Credit is refundable for CT residents',
        ],
        authority: {
            citation: 'Conn. Gen. Stat. §12-699 et seq.',
            url: 'https://portal.ct.gov/DRS/Businesses/Business-Pass-Through-Entity-Tax',
        },
    },

    // ========================================================================
    // GEORGIA - Pass-Through Entity Tax
    // ========================================================================
    /**
     * Georgia's PTET is one of the simpler programs.
     * 
     * RATE: 5.49% (reduced from 5.75% in 2024)
     * 
     * UNIQUE: Must elect by original due date (no extensions)
     * 
     * LEGAL AUTHORITY: O.C.G.A. § 48-7-21.1
     */
    GA: {
        name: 'Georgia Pass-Through Entity Tax',
        rate: 0.0549,  // 5.49% for 2025 (rate is decreasing)
        deadline: 'Due date of return (no extensions for election)',
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        notes: [
            'Rate decreasing annually (was 5.75% in 2023)',
            'Election must be made by original due date',
            'No estimated payment requirement',
        ],
        authority: {
            citation: 'O.C.G.A. § 48-7-21.1',
            url: 'https://dor.georgia.gov/pass-through-entity-taxation',
        },
    },

    // ========================================================================
    // ILLINOIS - Pass-Through Entity Tax
    // ========================================================================
    /**
     * Illinois requires election on FIRST DAY of tax year.
     * 
     * RATE: 4.95% (matches IL individual rate)
     * 
     * LEGAL AUTHORITY: 35 ILCS 5/201(p)
     */
    IL: {
        name: 'Illinois Pass-Through Entity Tax',
        rate: 0.0495,  // 4.95%
        deadline: 'First day of tax year (prospective election)',
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        notes: [
            'Must elect by FIRST day of tax year',
            'Very early deadline - plan ahead!',
            'Rate matches individual tax rate',
        ],
        authority: {
            citation: '35 ILCS 5/201(p)',
            url: 'https://www2.illinois.gov/rev/research/taxinformation/passthrough/Pages/default.aspx',
        },
    },

    // ========================================================================
    // MASSACHUSETTS - Pass-Through Entity Excise
    // ========================================================================
    /**
     * Massachusetts uses term "Excise" but functions like other PTETs.
     * 
     * RATE: 5% (matches MA Part B income rate)
     * 
     * LEGAL AUTHORITY: M.G.L. c. 63D
     */
    MA: {
        name: 'Massachusetts Pass-Through Entity Excise',
        rate: 0.05,  // 5%
        deadline: 'With extension request or original due date',
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        notes: [
            'Called "Excise" but functions as PTET',
            'Credit for residents is refundable',
            'MA has 4% surtax on income over $1M (separate)',
        ],
        authority: {
            citation: 'M.G.L. c. 63D',
            url: 'https://www.mass.gov/info-details/pass-through-entity-excise-pte-e',
        },
    },

    // ========================================================================
    // ARIZONA - Pass-Through Entity Tax
    // ========================================================================
    /**
     * Arizona's flat 2.5% rate is one of the LOWEST in the nation.
     * 
     * RATE: 2.5% (matches AZ flat individual rate)
     * 
     * LEGAL AUTHORITY: A.R.S. § 43-1014
     */
    AZ: {
        name: 'Arizona Pass-Through Entity Tax',
        rate: 0.025,  // 2.5%
        deadline: 'Due date of return (with extension)',
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        notes: [
            'Lowest PTET rate among major programs',
            'AZ moved to flat 2.5% individual rate',
            'Small savings due to low state rate',
        ],
        authority: {
            citation: 'A.R.S. § 43-1014',
            url: 'https://azdor.gov/businesses-arizona/pass-through-entity-tax',
        },
    },

    // ========================================================================
    // MARYLAND - Pass-Through Entity Tax
    // ========================================================================
    /**
     * Maryland was one of the first states with PTET.
     * Uses graduated rates matching individual rates.
     * 
     * LEGAL AUTHORITY: Md. Code Ann., Tax-Gen. § 10-102.1
     */
    MD: {
        name: 'Maryland Pass-Through Entity Tax',
        rates: [
            { min: 0, max: 100000, rate: 0.0575, description: 'Up to $100K' },
            { min: 100000, max: 150000, rate: 0.0625, description: '$100K - $150K' },
            { min: 150000, max: 250000, rate: 0.0675, description: '$150K - $250K' },
            { min: 250000, max: Infinity, rate: 0.0725, description: 'Over $250K (+county)' },
        ],
        deadline: 'Due date of return',
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        notes: [
            'State rate is 5.75% but shown as combined rate with county',
            'County tax adds 2.25% - 3.2% depending on county',
            'One of the earliest PTET programs',
        ],
        authority: {
            citation: 'Md. Code Ann., Tax-Gen. § 10-102.1',
            url: 'https://marylandtaxes.gov/pass-through-entities/index.php',
        },
    },

    // ========================================================================
    // MINNESOTA - Pass-Through Entity Tax
    // ========================================================================
    /**
     * Minnesota PTET at flat 9.85% (highest bracket rate).
     * 
     * LEGAL AUTHORITY: Minn. Stat. § 289A.08
     */
    MN: {
        name: 'Minnesota Pass-Through Entity Tax',
        rate: 0.0985,  // 9.85%
        deadline: 'March 15 (election with first payment)',
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        estimatedPayments: [
            { due: 'March 15', percent: 25 },
            { due: 'April 15', percent: 25 },
            { due: 'June 15', percent: 25 },
            { due: 'September 15', percent: 25 },
        ],
        notes: [
            'Rate matches highest MN individual bracket',
            'Election made with first estimated payment',
            'Credit is refundable',
        ],
        authority: {
            citation: 'Minn. Stat. § 289A.08',
            url: 'https://www.revenue.state.mn.us/pass-through-entity-tax',
        },
    },

    // ========================================================================
    // WISCONSIN - Pass-Through Entity Tax
    // ========================================================================
    /**
     * Wisconsin PTET at flat 7.65% rate.
     * 
     * LEGAL AUTHORITY: Wis. Stat. § 71.195
     */
    WI: {
        name: 'Wisconsin Pass-Through Entity Tax',
        rate: 0.0765,  // 7.65%
        deadline: '15th day of 3rd month of tax year (March 15 for calendar year)',
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        notes: [
            'Flat 7.65% rate regardless of income',
            'Election is irrevocable for the year',
            'Credit is fully refundable',
        ],
        authority: {
            citation: 'Wis. Stat. § 71.195',
            url: 'https://www.revenue.wi.gov/Pages/Businesses/pass-through-entity-tax.aspx',
        },
    },

    // ========================================================================
    // NORTH CAROLINA - Pass-Through Entity Tax
    // ========================================================================
    /**
     * North Carolina's flat 4.75% rate (decreasing annually).
     */
    NC: {
        name: 'North Carolina Pass-Through Entity Tax',
        rate: 0.0475,  // 4.75% for 2025 (decreasing annually)
        deadline: 'Due date of return',
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        notes: [
            'NC rate decreasing annually toward 0%',
            'Rate was 5.25% in 2022',
            'Scheduled to reach 0% eventually',
        ],
        authority: {
            citation: 'N.C. Gen. Stat. § 105-154.1',
            url: 'https://www.ncdor.gov/taxes-forms/income-tax/pass-through-entity-tax',
        },
    },

    // ========================================================================
    // OHIO - Pass-Through Entity Tax
    // ========================================================================
    /**
     * Ohio's PTET at 3% (relatively low).
     */
    OH: {
        name: 'Ohio Pass-Through Entity Tax',
        rate: 0.03,  // 3%
        deadline: 'Due date of return',
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        notes: [
            'Flat 3% rate',
            'Lower rate limits federal benefit',
            'Ohio also has CAT (Commercial Activity Tax)',
        ],
        authority: {
            citation: 'Ohio Rev. Code § 5733.41',
        },
    },

    // ========================================================================
    // OREGON - Pass-Through Entity Tax
    // ========================================================================
    /**
     * Oregon's PTET at 9% flat rate.
     */
    OR: {
        name: 'Oregon Pass-Through Entity Tax',
        rate: 0.09,  // 9%
        deadline: 'Due date of return',
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        notes: [
            'Flat 9% rate',
            'Oregon has no sales tax',
            'High income tax state',
        ],
        authority: {
            citation: 'ORS 314.778',
        },
    },

    // ========================================================================
    // SOUTH CAROLINA - Pass-Through Entity Tax
    // ========================================================================
    /**
     * South Carolina's PTET at graduated rates.
     */
    SC: {
        name: 'South Carolina Pass-Through Entity Tax',
        rate: 0.0625,  // Top rate 6.25% (simplified)
        deadline: 'Due date of return',
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        notes: [
            'Graduated rates up to 6.25%',
            'SC rate is relatively low',
        ],
        authority: {
            citation: 'S.C. Code § 12-6-545',
        },
    },

    // ========================================================================
    // VIRGINIA - Pass-Through Entity Tax
    // ========================================================================
    /**
     * Virginia's PTET at 5.75% flat rate.
     */
    VA: {
        name: 'Virginia Pass-Through Entity Tax',
        rate: 0.0575,  // 5.75%
        deadline: 'Due date of return',
        eligibleEntities: ['S-Corp', 'Partnership', 'LLC'],
        saltWorkaround: true,
        notes: [
            'Flat 5.75% rate',
            'Matches VA top individual rate',
        ],
        authority: {
            citation: 'Va. Code § 58.1-390.3',
        },
    },
};


// ============================================================================
// SECTION 2: TEXAS MARGIN TAX (FRANCHISE TAX)
// ============================================================================
/**
 * Texas Margin Tax (Franchise Tax) Details
 * 
 * IMPORTANT: Texas has NO state income tax, but it DOES have a Franchise Tax
 * (also called "Margin Tax") on businesses.
 * 
 * WHO PAYS:
 * - Corporations
 * - LLCs
 * - Partnerships
 * - Professional associations
 * - Business trusts
 * - Other legal entities doing business in Texas
 * 
 * WHO IS EXEMPT:
 * - Sole proprietorships (not legal entities)
 * - General partnerships owned entirely by natural persons
 * - Passive entities (certain conditions apply)
 * - Entities with annualized revenue below threshold
 * 
 * CALCULATION METHODS (taxpayer chooses best option):
 * 1. Cost of Goods Sold: Revenue minus COGS
 * 2. Compensation Deduction: Revenue minus total wages/benefits
 * 3. 70% of Revenue: Automatic 30% deduction
 * 4. EZ Computation: 0.331% on gross receipts (simpler method)
 * 
 * LEGAL AUTHORITY: Texas Tax Code Chapter 171
 */
export const TX_MARGIN_TAX = {
    name: 'Texas Margin Tax (Franchise Tax)',

    // Revenue thresholds (2025 - adjusted annually for inflation)
    thresholds: {
        exemption: 2470000,      // Revenue below this = exempt from filing
        noTaxDue: 1230000,       // Revenue below this = no tax, but must file
        ezComputation: 20000000, // Revenue below this can use EZ method
    },

    // Tax rates by business type
    rates: {
        retail: 0.00375,        // 0.375% for retail/wholesale
        wholesale: 0.00375,     // 0.375% for retail/wholesale
        other: 0.0075,          // 0.75% for all other businesses
        ezComputation: 0.00331, // 0.331% EZ computation rate
    },

    // Calculation methods available
    methods: [
        {
            name: 'Cost of Goods Sold',
            description: 'Revenue minus cost of goods sold (manufacturing, retail, wholesale)',
            formula: 'Total Revenue - COGS',
            bestFor: 'Businesses with high cost of goods',
        },
        {
            name: 'Compensation Deduction',
            description: 'Revenue minus total compensation (wages, benefits, etc.)',
            formula: 'Total Revenue - Compensation (capped)',
            bestFor: 'Service businesses with high labor costs',
        },
        {
            name: '70% of Revenue',
            description: 'Automatic 30% deduction from total revenue',
            formula: 'Total Revenue × 70%',
            bestFor: 'Businesses with low COGS and low compensation',
        },
        {
            name: 'EZ Computation',
            description: 'Simplified method at 0.331% of gross receipts',
            formula: 'Total Revenue × 0.331%',
            bestFor: 'Businesses with revenue under $20M wanting simplicity',
        },
    ],

    // Key dates
    deadlines: {
        annualReport: 'May 15',
        extension: 'November 15 (automatic 6-month extension)',
        noTaxDueReport: 'May 15 (still required even if no tax due)',
    },

    notes: [
        'Texas has no state income tax',
        'Margin tax is based on REVENUE, not profit',
        'Must file annual report even if no tax due',
        'Late filing may lose exemption for the year',
        'Combined reporting required for related entities',
    ],

    authority: {
        citation: 'Texas Tax Code Chapter 171',
        url: 'https://comptroller.texas.gov/taxes/franchise/',
    },
};


// ============================================================================
// SECTION 3: CALIFORNIA MENTAL HEALTH SERVICES TAX
// ============================================================================
/**
 * California Mental Health Services Tax (Proposition 63)
 * 
 * WHAT IT IS:
 * A 1% surtax on California taxable income exceeding $1 million.
 * Applies on top of regular California income tax.
 * 
 * WHO PAYS:
 * - Individuals with CA taxable income over $1,000,000
 * - Married filing jointly: $1,000,000 (not doubled)
 * - Married filing separately: $500,000 each
 * 
 * HISTORY:
 * - Proposition 63 passed by voters in 2004
 * - Funds go to county mental health programs
 * - Cannot be repealed without 2/3 legislative vote
 * 
 * MITIGATION STRATEGIES:
 * 1. Income timing (defer income below threshold if possible)
 * 2. Charitable deductions to reduce below $1M
 * 3. Municipal bond interest (excluded from CA income)
 * 4. Qualified Opportunity Zone deferrals
 * 5. Installment sales to spread recognition over years
 * 
 * LEGAL AUTHORITY: California Revenue & Taxation Code §17043
 */
export const CA_MENTAL_HEALTH_TAX = {
    name: 'California Mental Health Services Tax (Proposition 63)',
    rate: 0.01,  // 1%
    thresholds: {
        single: 1000000,
        married: 1000000,  // NOT doubled for married
        marriedSeparate: 500000,
    },
    notes: [
        'Enacted by Proposition 63 (2004)',
        'Funds county mental health programs',
        'Applies on top of regular CA income tax',
        'Cannot be avoided but can be mitigated',
    ],
    mitigation: [
        'Defer income into years below $1M threshold',
        'Increase charitable giving to reduce below threshold',
        'Municipal bond income is excluded',
        'QOZ (Qualified Opportunity Zone) investments',
        'Installment sales to spread income over years',
    ],
    authority: {
        citation: 'California Revenue & Taxation Code §17043',
        url: 'https://www.ftb.ca.gov/about-ftb/newsroom/mental-health-services-tax/index.html',
    },
};


// ============================================================================
// SECTION 4: MAIN ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Main entry point: Analyze all state PTET opportunities
 * 
 * This function is called by the main taxOptimizer and analyzes:
 * 1. State-specific PTET elections
 * 2. Texas Margin Tax
 * 3. California Mental Health Tax
 * 4. General PTET awareness for other states
 * 
 * @param {Object} form - Tax form data
 * @returns {Array} - Array of optimization objects
 */
export function analyzeStatePTETOptimizations(form) {
    const optimizations = [];
    const state = (form.state || '').toUpperCase();

    // ========================================================================
    // PREREQUISITE: Check if taxpayer has pass-through income
    // ========================================================================
    // PTET only applies to pass-through entities (S-corps, partnerships, LLCs)
    const hasPassThrough = form.hasScheduleK1 || form.hasSCorp ||
        form.hasPartnership || form.hasScheduleC;

    if (!hasPassThrough) return optimizations;

    // ========================================================================
    // Calculate total pass-through income
    // ========================================================================
    const k1Income = parseFloat(form.scheduleK1?.ordinaryIncome) || 0;
    const sCorpIncome = parseFloat(form.sCorpIncome) || 0;
    const partnershipIncome = parseFloat(form.partnershipIncome) || 0;
    const totalPassThrough = k1Income + sCorpIncome + partnershipIncome;

    if (totalPassThrough <= 0) return optimizations;

    // ========================================================================
    // Check for state-specific PTET program
    // ========================================================================
    const ptetProgram = STATE_PTET_PROGRAMS[state];

    if (ptetProgram) {
        const ptetOpt = analyzePTETElection(form, ptetProgram, totalPassThrough, state);
        if (ptetOpt) optimizations.push(ptetOpt);
    }

    // ========================================================================
    // Texas Margin Tax analysis
    // ========================================================================
    if (state === 'TX') {
        const txOpt = analyzeTexasMarginTax(form);
        if (txOpt) optimizations.push(txOpt);
    }

    // ========================================================================
    // California Mental Health Tax analysis
    // ========================================================================
    if (state === 'CA') {
        const caOpt = analyzeCaliforniaMentalHealthTax(form);
        if (caOpt) optimizations.push(caOpt);
    }

    // ========================================================================
    // General PTET awareness for states without specific implementation
    // ========================================================================
    if (!ptetProgram && totalPassThrough > 50000) {
        const generalOpt = analyzeGeneralPTETOpportunity(form, state, totalPassThrough);
        if (generalOpt) optimizations.push(generalOpt);
    }

    return optimizations;
}


/**
 * Analyze specific state PTET election opportunity
 * 
 * Calculates the potential federal tax savings from making a PTET election.
 * 
 * THE MATH:
 * 1. Calculate state tax that would be paid at entity level
 * 2. This becomes a federal business deduction (bypasses SALT cap)
 * 3. Federal tax savings = Entity tax × Federal marginal rate
 * 4. Credit reduces state tax owed on personal return (wash)
 * 5. Net benefit = Federal tax savings
 * 
 * @param {Object} form - Tax form data
 * @param {Object} program - State PTET program details
 * @param {number} passThroughIncome - Total pass-through income
 * @param {string} state - State abbreviation
 * @returns {Object|null} - Optimization object or null
 */
function analyzePTETElection(form, program, passThroughIncome, state) {
    const currentTax = calculateTotalTax(form);
    const federalRate = getMarginalRate(currentTax.taxableIncome);

    // SALT cap is $40,000 after OBBBA 2025
    const saltCap = 40000;
    const stateLocalTaxPaid = parseFloat(form.stateLocalTaxes) || 0;
    const saltLimited = stateLocalTaxPaid > saltCap;

    // If SALT isn't being limited, PTET provides no benefit
    if (!saltLimited) {
        return {
            id: `ptet-${state.toLowerCase()}-not-limited`,
            name: `${state} PTET - May Not Benefit You`,
            category: CATEGORY.STATE,
            potentialSavings: 0,
            difficulty: DIFFICULTY.MEDIUM,
            description: 'Your SALT is under the cap - PTET election may not provide federal benefit.',
            details: [
                `State/local taxes paid: $${stateLocalTaxPaid.toLocaleString()}`,
                `SALT cap (2025): $${saltCap.toLocaleString()}`,
                'PTET primarily benefits those limited by SALT cap',
                'Still may be worth electing for other reasons',
            ],
            authority: program.authority,
            isInformational: true,
            timeline: 'Review Annually',
        };
    }

    // Calculate PTET rate (handle both flat and graduated rates)
    let ptetRate;
    let rateDescription;

    if (typeof program.rate === 'number') {
        // Flat rate
        ptetRate = program.rate;
        rateDescription = `${(ptetRate * 100).toFixed(2)}% (flat rate)`;
    } else if (program.rates) {
        // Graduated rates - find applicable bracket
        const bracket = program.rates.find(r => passThroughIncome <= r.max) ||
            program.rates[program.rates.length - 1];
        ptetRate = bracket.rate;
        rateDescription = `${(ptetRate * 100).toFixed(2)}% (${bracket.description})`;
    }

    // Calculate PTET benefit
    const ptetAmount = passThroughIncome * ptetRate;
    const federalDeduction = ptetAmount;  // Entity-level deduction
    const federalTaxSavings = federalDeduction * federalRate;
    const excessSalt = stateLocalTaxPaid - saltCap;

    return {
        id: `ptet-${state.toLowerCase()}-opportunity`,
        name: program.name,
        category: CATEGORY.STATE,
        potentialSavings: Math.round(federalTaxSavings),
        difficulty: DIFFICULTY.MEDIUM,
        description: 'Elect PTET to bypass federal SALT deduction cap and save on federal taxes.',

        details: [
            `Pass-through income: $${passThroughIncome.toLocaleString()}`,
            `PTET rate: ${rateDescription}`,
            `PTET tax amount: $${Math.round(ptetAmount).toLocaleString()}`,
            `Your federal marginal rate: ${(federalRate * 100).toFixed(0)}%`,
            `Federal tax savings: $${Math.round(federalTaxSavings).toLocaleString()}`,
            `SALT currently being lost due to cap: $${excessSalt.toLocaleString()}`,
        ],

        howItWorks: [
            '1. Entity elects to pay state income tax at entity level',
            '2. Entity-level tax is deductible as business expense (no SALT cap!)',
            '3. You receive state tax credit for your share of PTET paid',
            '4. Net effect: Full deduction bypasses $40k SALT cap',
            '5. Your federal tax goes down by entity tax × your federal rate',
        ],

        requirements: [
            `Election deadline: ${program.deadline}`,
            `Eligible entities: ${program.eligibleEntities?.join(', ')}`,
            program.mandatory ? '⚠️ This election is MANDATORY in your state' : 'Election is voluntary',
            ...(program.notes || []),
        ],

        estimatedPayments: program.estimatedPayments,

        warnings: [
            'Election is typically irrevocable for the tax year',
            'May affect timing of when tax is paid',
            'Coordinate with all entity owners',
            'May have cash flow implications',
        ],

        authority: {
            citation: `IRS Notice 2020-75 • ${program.authority?.citation || `${state} Tax Law`}`,
            details: [
                'IRS Notice 2020-75: Federal safe harbor for PTET workaround',
                `${program.authority?.citation || `${state} specific rules apply`}`,
            ],
            url: program.authority?.url || 'https://www.irs.gov/pub/irs-drop/n-20-75.pdf',
        },

        timeline: program.deadline,
        formImpact: [`${state} PTET Election Form`, `${state} Entity Return`],
    };
}


/**
 * Analyze Texas Margin Tax (Franchise Tax)
 * 
 * Texas has no income tax but does have a gross receipts-based tax on businesses.
 * This function analyzes exemption status and calculates estimated liability.
 * 
 * @param {Object} form - Tax form data
 * @returns {Object|null} - Optimization object or null
 */
function analyzeTexasMarginTax(form) {
    // Get gross revenue
    const grossRevenue = parseFloat(form.businessRevenue) ||
        parseFloat(form.scheduleC?.grossReceipts) || 0;

    if (grossRevenue <= 0) return null;

    const { thresholds, rates, methods } = TX_MARGIN_TAX;

    // ========================================================================
    // Check exemption status
    // ========================================================================
    if (grossRevenue <= thresholds.exemption) {
        return {
            id: 'tx-margin-tax-exempt',
            name: 'Texas Margin Tax - You\'re Exempt!',
            category: CATEGORY.STATE,
            potentialSavings: 0,
            difficulty: DIFFICULTY.EASY,
            description: 'Your business is exempt from Texas Franchise (Margin) Tax.',

            details: [
                `Your gross revenue: $${grossRevenue.toLocaleString()}`,
                `Exemption threshold: $${thresholds.exemption.toLocaleString()}`,
                `You are $${(thresholds.exemption - grossRevenue).toLocaleString()} under the threshold`,
                '✅ No margin tax due',
            ],

            requirements: [
                `File No Tax Due Report by May 15`,
                'Report is REQUIRED even though no tax is due',
                '⚠️ Late filing = loss of exemption for that year!',
                'Can file electronically through Comptroller website',
            ],

            context: [
                'Texas has no state income tax',
                'Margin Tax is based on REVENUE, not profit',
                'Sole proprietorships are generally exempt',
            ],

            authority: TX_MARGIN_TAX.authority,
            isInformational: true,
            timeline: 'May 15 annually',
        };
    }

    // ========================================================================
    // Calculate estimated margin tax
    // ========================================================================
    const businessType = form.businessType || 'other';
    const rate = rates[businessType] || rates.other;

    // Estimate deductions for each method
    const costOfGoods = parseFloat(form.costOfGoodsSold) || grossRevenue * 0.50;
    const compensation = parseFloat(form.totalCompensation) || grossRevenue * 0.30;

    // Calculate taxable margin under each method
    const methodCalculations = {
        'Cost of Goods Sold': {
            margin: Math.max(0, grossRevenue - costOfGoods),
            eligible: true,
            description: 'Revenue minus cost of goods sold',
        },
        'Compensation Deduction': {
            margin: Math.max(0, grossRevenue - compensation),
            eligible: true,
            description: 'Revenue minus total compensation',
        },
        '70% of Revenue': {
            margin: grossRevenue * 0.70,
            eligible: true,
            description: 'Automatic 30% deduction',
        },
        'EZ Computation': {
            margin: grossRevenue,
            rate: rates.ezComputation,
            eligible: grossRevenue < thresholds.ezComputation,
            description: '0.331% of total revenue (simpler)',
        },
    };

    // Find best method (lowest tax)
    let bestMethod = null;
    let lowestTax = Infinity;

    for (const [name, calc] of Object.entries(methodCalculations)) {
        if (!calc.eligible) continue;
        const methodRate = calc.rate || rate;
        const tax = calc.margin * methodRate;
        if (tax < lowestTax) {
            lowestTax = tax;
            bestMethod = { name, ...calc, tax, rate: methodRate };
        }
    }

    return {
        id: 'tx-margin-tax-analysis',
        name: 'Texas Margin Tax Analysis',
        category: CATEGORY.STATE,
        potentialSavings: 0,  // Informational
        difficulty: DIFFICULTY.MEDIUM,
        description: 'Texas has no income tax but does have Franchise (Margin) Tax on businesses.',

        details: [
            `Gross revenue: $${grossRevenue.toLocaleString()}`,
            `Best calculation method: ${bestMethod.name}`,
            `Taxable margin: $${Math.round(bestMethod.margin).toLocaleString()}`,
            `Tax rate: ${(bestMethod.rate * 100).toFixed(3)}%`,
            `Estimated margin tax: $${Math.round(bestMethod.tax).toLocaleString()}`,
        ],

        allMethods: Object.entries(methodCalculations).map(([name, calc]) => ({
            name,
            description: calc.description,
            margin: Math.round(calc.margin),
            tax: Math.round(calc.margin * (calc.rate || rate)),
            eligible: calc.eligible,
            isBest: name === bestMethod.name,
        })),

        deadlines: TX_MARGIN_TAX.deadlines,

        exemptions: [
            'Sole proprietorships (not legal entities)',
            'General partnerships owned entirely by natural persons',
            `Revenue under $${thresholds.exemption.toLocaleString()}`,
            'Passive entities meeting certain conditions',
        ],

        tips: [
            'Compare all methods annually - best method can change',
            'Keep detailed records for COGS method',
            'Compensation method has caps and limitations',
            'File No Tax Due Report even if under threshold',
        ],

        authority: TX_MARGIN_TAX.authority,
        isInformational: true,
        timeline: 'May 15 annually',
    };
}


/**
 * Analyze California Mental Health Services Tax
 * 
 * California imposes an additional 1% tax on taxable income over $1 million.
 * This function calculates the tax and suggests mitigation strategies.
 * 
 * @param {Object} form - Tax form data
 * @returns {Object|null} - Optimization object or null
 */
function analyzeCaliforniaMentalHealthTax(form) {
    const currentTax = calculateTotalTax(form);
    const taxableIncome = currentTax.taxableIncome || 0;

    // Determine threshold based on filing status
    const filingStatus = form.filingStatus || 'single';
    const threshold = CA_MENTAL_HEALTH_TAX.thresholds[filingStatus] || 1000000;

    // Only applies if over threshold
    if (taxableIncome <= threshold) return null;

    const excessIncome = taxableIncome - threshold;
    const additionalTax = excessIncome * CA_MENTAL_HEALTH_TAX.rate;

    // Calculate potential savings from reduction strategies
    const potentialReduction = Math.min(excessIncome, 100000);  // Hypothetical $100k reduction
    const potentialSavings = potentialReduction * CA_MENTAL_HEALTH_TAX.rate;

    return {
        id: 'ca-mental-health-tax',
        name: 'California Mental Health Services Tax (Prop 63)',
        category: CATEGORY.STATE,
        potentialSavings: Math.round(potentialSavings),
        difficulty: DIFFICULTY.HARD,
        description: 'Additional 1% tax on California taxable income over $1 million.',

        details: [
            `CA taxable income: $${taxableIncome.toLocaleString()}`,
            `Threshold (${filingStatus}): $${threshold.toLocaleString()}`,
            `Excess income: $${excessIncome.toLocaleString()}`,
            `Additional tax (1%): $${Math.round(additionalTax).toLocaleString()}`,
        ],

        context: [
            'Proposition 63 passed by CA voters in 2004',
            'Funds county mental health programs',
            'Applies on TOP of regular CA income tax',
            'CA top rate is 13.3% (12.3% + 1% Mental Health)',
        ],

        mitigation: [
            {
                strategy: 'Income Timing',
                description: 'Defer income into years where you stay below $1M',
                effectiveness: 'High if income fluctuates',
            },
            {
                strategy: 'Charitable Giving',
                description: 'Increase donations to reduce taxable income below $1M',
                effectiveness: 'Moderate - requires significant giving',
            },
            {
                strategy: 'Municipal Bonds',
                description: 'CA muni bond interest is excluded from CA income',
                effectiveness: 'Good for investment income',
            },
            {
                strategy: 'Qualified Opportunity Zones',
                description: 'QOZ investments can defer and reduce capital gains',
                effectiveness: 'High for capital gains situations',
            },
            {
                strategy: 'Installment Sales',
                description: 'Spread gain recognition over multiple years',
                effectiveness: 'High for large one-time gains',
            },
            {
                strategy: 'Retirement Contributions',
                description: 'Max out 401(k), IRA, SEP to reduce current income',
                effectiveness: 'Moderate - limited by contribution caps',
            },
        ],

        calculations: {
            currentTax: Math.round(additionalTax),
            incomeOverThreshold: excessIncome,
            reductionNeeded: Math.min(excessIncome, 50000),
            savingsIfReduced: Math.round(Math.min(excessIncome, 50000) * 0.01),
        },

        authority: CA_MENTAL_HEALTH_TAX.authority,
        isWarning: true,
        isInformational: true,
        timeline: 'This Return',
    };
}


/**
 * General PTET opportunity for states without specific implementation
 * 
 * Many states have PTET programs not fully modeled here.
 * This provides a general recommendation to investigate.
 * 
 * @param {Object} form - Tax form data
 * @param {string} state - State abbreviation
 * @param {number} passThroughIncome - Total pass-through income
 * @returns {Object|null} - Optimization object or null
 */
function analyzeGeneralPTETOpportunity(form, state, passThroughIncome) {
    const stateLocalTaxPaid = parseFloat(form.stateLocalTaxes) || 0;
    const saltCap = 40000;

    // Only beneficial if SALT is capped
    if (stateLocalTaxPaid <= saltCap) return null;

    const excessSalt = stateLocalTaxPaid - saltCap;
    const federalRate = getMarginalRate(passThroughIncome);
    const estimatedBenefit = excessSalt * federalRate;  // Rough estimate

    return {
        id: 'ptet-general-opportunity',
        name: 'PTET May Be Available in Your State',
        category: CATEGORY.STATE,
        potentialSavings: Math.round(estimatedBenefit),
        difficulty: DIFFICULTY.HARD,
        description: 'Most states now offer PTET elections to work around the federal SALT cap.',

        details: [
            `Your state: ${state || 'Not specified'}`,
            `Pass-through income: $${passThroughIncome.toLocaleString()}`,
            `SALT paid: $${stateLocalTaxPaid.toLocaleString()}`,
            `Excess SALT (over $40k cap): $${excessSalt.toLocaleString()}`,
            `Estimated federal benefit: $${Math.round(estimatedBenefit).toLocaleString()}`,
        ],

        recommendation: [
            '1. Check if your state offers a PTET program',
            '2. Most states enacted programs after IRS Notice 2020-75',
            '3. Consult with a state-specific tax professional',
            '4. Election deadlines vary significantly by state',
            '5. Some programs are mandatory, others are elective',
        ],

        statesWithPTET: [
            { states: 'High PTET rate', list: 'NY, NJ, CA, MN, OR' },
            { states: 'Medium PTET rate', list: 'MA, CT, WI, VA, MD' },
            { states: 'Low PTET rate', list: 'AZ, GA, NC, OH' },
        ],

        howPTETWorks: [
            'Entity elects to pay state tax at entity level',
            'Entity-level tax is federal business deduction',
            'Owners receive state credit for tax paid',
            'Net result: SALT cap bypass for pass-through income',
        ],

        authority: {
            citation: 'IRS Notice 2020-75',
            details: [
                'IRS confirmed PTET payments are deductible by entities',
                'Payments not subject to individual SALT cap',
            ],
            url: 'https://www.irs.gov/pub/irs-drop/n-20-75.pdf',
        },

        isInformational: true,
        timeline: 'Research',
    };
}


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get federal marginal tax rate for given taxable income
 * 
 * Uses 2025 tax brackets (single filer - simplified)
 * 
 * @param {number} taxableIncome - Taxable income
 * @returns {number} - Marginal rate as decimal
 */
function getMarginalRate(taxableIncome) {
    // 2025 brackets for single filers (used as estimate)
    if (taxableIncome > 626350) return 0.37;
    if (taxableIncome > 250525) return 0.35;
    if (taxableIncome > 197300) return 0.32;
    if (taxableIncome > 103350) return 0.24;
    if (taxableIncome > 48475) return 0.22;
    if (taxableIncome > 11925) return 0.12;
    return 0.10;
}


/**
 * Calculate PTET rate for graduated-rate states
 * 
 * @param {Array} rates - Array of rate brackets
 * @param {number} income - Pass-through income
 * @returns {number} - Applicable rate
 */
export function getPTETGraduatedRate(rates, income) {
    for (const bracket of rates) {
        if (income <= bracket.max) {
            return bracket.rate;
        }
    }
    return rates[rates.length - 1].rate;
}


/**
 * Get list of states with PTET programs
 * 
 * @returns {Array} - Array of state abbreviations
 */
export function getStatesWithPTET() {
    return Object.keys(STATE_PTET_PROGRAMS);
}


/**
 * Get PTET program details for a specific state
 * 
 * @param {string} state - State abbreviation
 * @returns {Object|null} - Program details or null
 */
export function getPTETProgram(state) {
    return STATE_PTET_PROGRAMS[state.toUpperCase()] || null;
}
