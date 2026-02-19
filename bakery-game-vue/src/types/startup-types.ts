/**
 * Pre-Operational Phase Type Definitions
 * Comprehensive types for the bakery startup simulation
 * 
 * Design Philosophy: Mirror real-world business startup complexity.
 * Borrowed financial modeling concepts from Market Terminal.
 */

// ============ Business Identity ============
export type BusinessEntityType = 'sole_proprietorship' | 'llc' | 'partnership' | 'corporation';
export type BakeryConceptStyle = 'artisan_european' | 'classic_american' | 'health_organic' | 'luxury_patisserie' | 'neighborhood_comfort';

export interface BusinessIdentity {
  name: string;
  entityType: BusinessEntityType;
  conceptStyle: BakeryConceptStyle;
  tagline: string;
  ownerName: string;
  ownerBackground: OwnerBackground;
}

export interface OwnerBackground {
  culinaryExperience: number; // 0-10 years
  businessExperience: number; // 0-10 years
  creditScore: number; // 300-850
  personalSavings: number; // $0-$200,000
  hasBusinessDegree: boolean;
  hasCulinaryDegree: boolean;
}

// ============ Financing ============
export type FundingSourceType = 'personal_savings' | 'bank_loan' | 'sba_loan' | 'investor' | 'credit_line' | 'crowdfunding' | 'family_loan';

export interface FundingSource {
  id: string;
  type: FundingSourceType;
  name: string;
  description: string;
  icon: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number; // Annual
  termMonths: number;
  monthlyPayment: number; // Per $1000 borrowed
  requiresCreditScore: number;
  requiresBusinessPlan: boolean;
  requiresCollateral: boolean;
  approvalChance: number; // 0-1 base chance (modified by credit score, etc.)
  processingDays: number;
  penaltyInfo: string;
}

export interface FundingApplication {
  sourceId: string;
  requestedAmount: number;
  approved: boolean | null; // null = pending
  approvedAmount: number;
  interestRate: number;
  monthlyPayment: number;
  processingDaysLeft: number;
}

export interface FinancialProjection {
  totalCapital: number;
  totalDebt: number;
  monthlyDebtService: number;
  estimatedMonthlyRevenue: number;
  estimatedMonthlyCosts: number;
  breakEvenMonths: number;
  debtToEquityRatio: number;
  burnRate: number; // Monthly cash burn before revenue
  runwayMonths: number;
}

// ============ Location ============
export type NeighborhoodType = 'downtown_core' | 'arts_district' | 'suburban_strip' | 'college_town' | 'residential_quiet' | 'industrial_revitalized';

export interface LocationOption {
  id: string;
  name: string;
  neighborhood: NeighborhoodType;
  address: string;
  description: string;
  icon: string;
  sqft: number;
  monthlyRent: number;
  securityDeposit: number; // months of rent
  leaseTermYears: number;
  rentEscalation: number; // annual % increase
  buildoutAllowance: number; // landlord contribution
  footTraffic: number; // 1-100 daily pedestrians score
  parkingSpaces: number;
  nearbyCompetitors: number;
  demographics: LocationDemographics;
  zoning: ZoningStatus;
  condition: 'shell' | 'previous_restaurant' | 'renovated' | 'turnkey';
  buildoutCostMultiplier: number; // 1.0 = standard
  // Random variables revealed after selection
  hiddenTrafficVariance: number; // -0.3 to +0.3
  hiddenCompetitorThreat: number; // 0-1
}

export interface LocationDemographics {
  averageIncome: number;
  populationDensity: number; // per sq mile
  ageDistribution: {
    under25: number;
    age25to44: number;
    age45to64: number;
    over65: number;
  };
  budgetCustomers: number; // 0-1
  mainstreamCustomers: number; // 0-1
  premiumCustomers: number; // 0-1
  healthConscious: number; // 0-1
  dailyPedestrianCount: number;
}

export interface ZoningStatus {
  approved: boolean;
  requiresVariance: boolean;
  varianceCost: number;
  varianceProcessingWeeks: number;
  signageRestrictions: 'none' | 'moderate' | 'strict';
  outdoorSeatingAllowed: boolean;
  alcoholLicenseEligible: boolean;
  maxOccupancy: number;
}

// ============ Permits & Licensing ============
export type PermitType = 'business_license' | 'food_handler' | 'health_department' | 'fire_safety' | 'building_permit' | 'signage_permit' | 'food_establishment' | 'sales_tax';

export type PermitStatus = 'not_started' | 'application_filed' | 'inspection_scheduled' | 'inspection_passed' | 'inspection_failed' | 'approved' | 'denied';

export interface Permit {
  id: string;
  type: PermitType;
  name: string;
  description: string;
  icon: string;
  cost: number;
  processingWeeks: number;
  status: PermitStatus;
  prerequisitePermits: PermitType[];
  inspectionRequired: boolean;
  passChance: number; // Base pass rate
  failureFixCost: number;
  failureDelayWeeks: number;
  requiredForOpening: boolean;
  tips: string[];
}

// ============ Building & Renovation ============
export type RenovationArea = 'kitchen' | 'storefront' | 'seating_area' | 'storage' | 'restroom' | 'office' | 'exterior';

export interface RenovationOption {
  id: string;
  area: RenovationArea;
  name: string;
  description: string;
  icon: string;
  tiers: RenovationTier[];
}

export interface RenovationTier {
  id: string;
  name: string;
  description: string;
  cost: number;
  installationWeeks: number;
  qualityImpact: number; // -0.2 to +0.5
  efficiencyImpact: number;
  customerAppealImpact: number; // How much it attracts customers
  maintenanceCostMonthly: number;
}

// ============ Equipment ============
export type EquipmentCategory = 'ovens' | 'mixers' | 'refrigeration' | 'display_cases' | 'pos_system' | 'prep_tables' | 'smallwares' | 'packaging';

export interface EquipmentItem {
  id: string;
  category: EquipmentCategory;
  name: string;
  description: string;
  icon: string;
  tiers: EquipmentTierOption[];
  required: boolean; // Must have at least one
  maxQuantity: number;
}

export interface EquipmentTierOption {
  id: string;
  name: string;
  quality: 'budget' | 'standard' | 'premium' | 'commercial';
  price: number;
  leasePriceMonthly: number; // Lease alternative
  capacity: number; // Units or rating
  efficiencyRating: number; // 0.5 - 1.5
  reliabilityRating: number; // 0.5 - 1.0  (chance of breakdown)
  warrantyMonths: number;
  energyCostMonthly: number;
  maintenanceCostMonthly: number;
  usedAvailable: boolean;
  usedDiscount: number; // 0.3-0.6
  usedReliabilityPenalty: number;
}

export interface EquipmentPurchase {
  itemId: string;
  tierId: string;
  quantity: number;
  buyOrLease: 'buy' | 'lease';
  isUsed: boolean;
  totalCost: number;
  monthlyPayment: number;
}

// ============ Suppliers ============
export interface Supplier {
  id: string;
  name: string;
  description: string;
  icon: string;
  specialty: string;
  type: 'wholesale' | 'local_farm' | 'specialty_import' | 'bulk_distributor';
  ingredientCategories: string[];
  priceLevel: number; // 0.7 (cheap) to 1.4 (expensive)
  qualityLevel: number; // 0.6 to 1.5
  reliabilityScore: number; // 0.5 to 1.0  (delivery reliability)
  minimumOrder: number; // $ amount
  deliveryDays: string[]; // e.g. ['monday', 'thursday']
  deliveryFee: number;
  freeDeliveryMinimum: number;
  creditTerms: 'cod' | 'net15' | 'net30';
  introDiscount: number; // First order discount
  bulkDiscount: number; // 5%+ orders
  // Random variables
  hiddenQualityVariance: number; // Actual quality may vary
  hiddenReliabilityVariance: number;
  seasonalPriceSwings: number; // How much prices fluctuate
}

export interface SupplierContract {
  supplierId: string;
  ingredientCategories: string[];
  monthlyBudget: number;
  deliverySchedule: string[];
  paymentTerms: string;
}

// ============ Recipe & Menu ============
export interface MenuRecipe {
  id: string;
  name: string;
  category: 'bread' | 'pastry' | 'cake' | 'cookie' | 'sandwich' | 'beverage' | 'specialty';
  description: string;
  icon: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  prepTimeMinutes: number;
  bakeTimeMinutes: number;
  shelfLifeHours: number;
  ingredients: RecipeIngredient[];
  baseCost: number; // Cost of ingredients
  suggestedPrice: number;
  marginPercent: number;
  requiredEquipment: string[];
  requiredSkillLevel: number; // 1-10
  customerAppeal: number; // Base appeal rating 1-100
  seasonalDemand: { [season: string]: number }; // Demand multiplier by season
  isSignature: boolean;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  costPer: number;
  category: string;
}

export interface MenuPricing {
  recipeId: string;
  price: number;
  costBasis: number;
  marginPercent: number;
  priceStrategy: 'value' | 'competitive' | 'premium' | 'loss_leader';
}

// ============ Staffing ============
export type StaffRole = 'head_baker' | 'baker' | 'pastry_chef' | 'counter_staff' | 'cashier' | 'barista' | 'manager' | 'delivery_driver';

export interface StaffCandidate {
  id: string;
  name: string;
  avatar: string; // SVG reference
  role: StaffRole;
  experience: number; // Years
  skillLevel: number; // 1-10
  requestedSalary: number; // Annual or hourly
  salaryType: 'hourly' | 'salary';
  availability: string[]; // Days available
  personality: StaffPersonality;
  references: number; // 0-3 quality score
  background: string;
  strengths: string[];
  weaknesses: string[];
  negotiable: boolean; // Will accept lower salary?
  // Hidden traits revealed over time
  hiddenReliability: number; // 0-1
  hiddenGrowthPotential: number; // 0-1
}

export interface StaffPersonality {
  teamwork: number; // 0-1
  initiative: number;
  customerService: number;
  stressHandling: number;
  creativity: number;
}

export interface StaffHire {
  candidateId: string;
  role: StaffRole;
  offeredSalary: number;
  salaryType: 'hourly' | 'salary';
  startDate: string; // Relative to opening
  schedule: WorkSchedule;
  trainingWeeks: number;
  trainingCost: number;
}

export interface WorkSchedule {
  monday: ShiftTime | null;
  tuesday: ShiftTime | null;
  wednesday: ShiftTime | null;
  thursday: ShiftTime | null;
  friday: ShiftTime | null;
  saturday: ShiftTime | null;
  sunday: ShiftTime | null;
}

export interface ShiftTime {
  start: string; // "06:00"
  end: string; // "14:00"
}

// ============ Marketing & Grand Opening ============
export type MarketingChannel = 'social_media' | 'local_newspaper' | 'radio' | 'flyers' | 'grand_opening_event' | 'influencer' | 'google_ads' | 'community_board';

export interface MarketingOption {
  id: string;
  channel: MarketingChannel;
  name: string;
  description: string;
  icon: string;
  cost: number;
  reachEstimate: number; // People reached
  conversionRate: number; // % who become customers
  duration: 'one_time' | 'weekly' | 'monthly';
  setupTimeWeeks: number;
  effectiveness: number; // 0-1 base
  // Varies based on location demographics
  audienceMatch: { [key in NeighborhoodType]?: number };
}

export interface GrandOpeningPlan {
  date: string; // Weeks from now
  budget: number;
  activities: GrandOpeningActivity[];
  expectedAttendance: number;
  mediaInvited: boolean;
  specialOffers: SpecialOffer[];
}

export interface GrandOpeningActivity {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  attendanceBoost: number; // Multiplier
  mediaAppeal: number; // 0-1
}

export interface SpecialOffer {
  id: string;
  name: string;
  description: string;
  discountPercent: number;
  duration: string; // "opening day" | "first week"
  customerAcquisitionBoost: number;
}

// ============ Delivery Channel ============
export type SalesChannel = 'in_store' | 'delivery' | 'wholesale' | 'catering' | 'online_order';

export interface SalesChannelConfig {
  channel: SalesChannel;
  enabled: boolean;
  setupCost: number;
  monthlyCost: number;
  revenueMultiplier: number;
  requirements: string[];
}

// ============ Business Hours ============
export interface BusinessHours {
  monday: DayHours | null;
  tuesday: DayHours | null;
  wednesday: DayHours | null;
  thursday: DayHours | null;
  friday: DayHours | null;
  saturday: DayHours | null;
  sunday: DayHours | null;
}

export interface DayHours {
  open: string; // "06:00"
  close: string; // "19:00"
  bakeStart: string; // "04:00" - when bakers start
}

// ============ Overall Startup State ============
export type StartupPhase = 'business_planning' | 'financing' | 'location' | 'permits' | 'renovation' | 'suppliers_recipes' | 'staffing' | 'marketing_launch';

export interface StartupState {
  currentPhase: StartupPhase;
  completedPhases: StartupPhase[];
  businessIdentity: BusinessIdentity;
  fundingApplications: FundingApplication[];
  totalCapital: number;
  totalDebt: number;
  cashOnHand: number;
  selectedLocation: LocationOption | null;
  permits: Permit[];
  renovationChoices: { [area: string]: string }; // area -> tierId
  equipmentPurchases: EquipmentPurchase[];
  supplierContracts: SupplierContract[];
  menuSelections: MenuPricing[];
  staffHires: StaffHire[];
  marketingPlan: MarketingOption[];
  grandOpening: GrandOpeningPlan | null;
  businessHours: BusinessHours;
  salesChannels: SalesChannelConfig[];
  financialProjection: FinancialProjection;
  weekNumber: number; // Weeks into startup process
  totalSpent: number;
  // Advisor system
  advisorMessages: AdvisorMessage[];
}

export interface AdvisorMessage {
  id: string;
  phase: StartupPhase;
  type: 'tip' | 'warning' | 'congratulation' | 'question';
  character: 'mentor' | 'banker' | 'inspector' | 'realtor' | 'chef';
  message: string;
  timestamp: number;
}

// ============ ID Type Aliases (for component use) ============
export type FundingSourceId = string;
export type LocationId = string;
export type PermitId = string;
export type EquipmentItemId = string;
export type EquipmentTierId = string;
export type SupplierId = string;
export type RecipeId = string;
export type StaffCandidateId = string;
export type MarketingOptionId = string;
export type GrandOpeningActivityId = string;
export type SpecialOfferId = string;

// ============ Random Event During Setup ============
export interface StartupEvent {
  id: string;
  name: string;
  description: string;
  phase: StartupPhase;
  icon: string;
  effects: {
    costChange?: number;
    delayWeeks?: number;
    qualityChange?: number;
    reputationChange?: number;
  };
  choices?: StartupEventChoice[];
}

export interface StartupEventChoice {
  id: string;
  text: string;
  cost: number;
  effects: {
    costChange?: number;
    delayWeeks?: number;
    qualityChange?: number;
    reputationChange?: number;
  };
}
