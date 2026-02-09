/**
 * Setup Phase Options
 * Impact business starting state, traffic, costs, and quality multipliers.
 */

export interface FinancingOption {
    id: string;
    name: string;
    description: string;
    amount: number;
    interestRate: number;
    monthlyPayment: number;
    term: number; // months
    icon: string;
    difficulty: 'Relaxed' | 'Standard' | 'Hardcore';
}

export interface LocationOption {
    id: string;
    name: string;
    description: string;
    rent: number; // daily
    trafficMultiplier: number; // 0.5 - 2.0
    demographics: {
        budget: number;
        mainstream: number;
        premium: number;
    };
    icon: string;
}

export interface EquipmentTier {
    id: string;
    name: string;
    description: string;
    price: number;
    qualityMultiplier: number;
    efficiencyMultiplier: number;
    maintenanceCost: number;
    icon: string;
}

export const FINANCING_OPTIONS: FinancingOption[] = [
    {
        id: 'bootstrap',
        name: 'The Bootstrap',
        description: 'Start with your life savings. No debt, no interest, but very tight cash flow.',
        amount: 0,
        interestRate: 0,
        monthlyPayment: 0,
        term: 0,
        icon: '💰',
        difficulty: 'Hardcore'
    },
    {
        id: 'sba_loan',
        name: 'SBA Micro-Loan',
        description: 'A moderate government-backed loan for small businesses. Balanced risk.',
        amount: 15000,
        interestRate: 0.08,
        monthlyPayment: 350,
        term: 48,
        icon: '🏢',
        difficulty: 'Standard'
    },
    {
        id: 'angel_investor',
        name: 'Artisan Angel',
        description: 'Generous funding from a pastry-loving investor. Plenty of cash, but expect growth pressure.',
        amount: 35000,
        interestRate: 0.12,
        monthlyPayment: 850,
        term: 60,
        icon: '😇',
        difficulty: 'Relaxed'
    }
];

export const LOCATION_OPTIONS: LocationOption[] = [
    {
        id: 'suburb',
        name: 'Quiet Oak Suburb',
        description: 'Quiet neighborhood with loyal families. Low rent, low but steady traffic.',
        rent: 80,
        trafficMultiplier: 0.7,
        demographics: {
            budget: 0.4,
            mainstream: 0.5,
            premium: 0.1
        },
        icon: '🏡'
    },
    {
        id: 'artisan_row',
        name: 'Artisan Row',
        description: 'A trendy district for foodies. Moderate rent, good traffic, quality-conscious customers.',
        rent: 220,
        trafficMultiplier: 1.1,
        demographics: {
            budget: 0.1,
            mainstream: 0.4,
            premium: 0.5
        },
        icon: '🎨'
    },
    {
        id: 'market_street',
        name: 'High Street Market',
        description: 'The heart of the city. Extremely high traffic, very high rent, very diverse crowd.',
        rent: 550,
        trafficMultiplier: 2.2,
        demographics: {
            budget: 0.3,
            mainstream: 0.5,
            premium: 0.2
        },
        icon: '🏙️'
    }
];

export const EQUIPMENT_TIERS: EquipmentTier[] = [
    {
        id: 'basic',
        name: 'Second-Hand Basics',
        description: 'Reliable enough but prone to uneven baking. Great for saving cash.',
        price: 3500,
        qualityMultiplier: 0.85,
        efficiencyMultiplier: 0.9,
        maintenanceCost: 15,
        icon: '🛠️'
    },
    {
        id: 'professional',
        name: 'Standard Pro Line',
        description: 'Modern professional grade equipment. Reliable and efficient.',
        price: 8500,
        qualityMultiplier: 1.1,
        efficiencyMultiplier: 1.0,
        maintenanceCost: 25,
        icon: '🥯'
    },
    {
        id: 'artisan',
        name: 'Stone-Hearth Artisan Kit',
        description: 'Top-of-the-line imported equipment. Incredible quality and automated systems.',
        price: 18000,
        qualityMultiplier: 1.4,
        efficiencyMultiplier: 1.3,
        maintenanceCost: 60,
        icon: '💎'
    }
];
