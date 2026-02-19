/**
 * Bakery Startup Store — Rewritten for phase component compatibility
 * 
 * Uses numeric phases (1-8) for component navigation while keeping
 * rich typed data internally. Financial modeling inspired by Market Terminal.
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  BusinessEntityType,
  BakeryConceptStyle,
  OwnerBackground,
  FundingApplication,
  FinancialProjection,
} from '@/types/startup-types';
import {
  PERMITS,
  FUNDING_SOURCES,
  LOCATION_OPTIONS,
  RENOVATION_OPTIONS,
  MARKETING_OPTIONS,
  CONCEPT_STYLE_INFO,
} from '@/data/startup-data';

// ID types re-exported from types file
export type { FundingSourceId, LocationId, PermitId, EquipmentItemId, EquipmentTierId, SupplierId, RecipeId, StaffCandidateId, MarketingOptionId, GrandOpeningActivityId, SpecialOfferId } from '@/types/startup-types';
export type RenovationArea = string;

interface PermitState {
  permitId: string;
  status: 'pending' | 'approved' | 'denied' | 'inspection_needed';
  filedWeek: number;
  processingWeeksLeft: number;
}

interface SimpleGrandOpening {
  activities: string[];
  specialOffers: string[];
  budget: number;
}

interface SimpleBusinessHours {
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  closedDays: string[];
}

interface SimpleSalesChannels {
  walkIn: boolean;
  delivery: boolean;
  online: boolean;
  catering: boolean;
}

export const useBakeryStartupStore = defineStore('bakeryStartup', () => {
  // ============ Phase Navigation (1-8) ============
  const currentPhase = ref<number>(1);
  const completedPhases = ref<number[]>([]);
  const weekNumber = ref<number>(1);

  // ============ Phase 1: Business Identity ============
  const businessName = ref('');
  const entityType = ref<BusinessEntityType | null>(null);
  const conceptStyle = ref<BakeryConceptStyle | null>(null);
  const tagline = ref('');
  const ownerName = ref('');
  const ownerBackground = ref<OwnerBackground>({
    culinaryExperience: 0,
    businessExperience: 0,
    creditScore: 650,
    personalSavings: 25000,
    hasBusinessDegree: false,
    hasCulinaryDegree: false,
  });

  // ============ Phase 2: Financing ============
  const fundingApplications = ref<FundingApplication[]>([]);
  const personalSavingsCommitted = ref(0);

  // ============ Phase 3: Location ============
  const selectedLocation = ref<string | null>(null);
  const leaseNegotiated = ref(false);
  const leaseDiscount = ref(0);

  // ============ Phase 4: Permits ============
  const permits = ref<PermitState[]>([]);

  // ============ Phase 5: Renovation & Equipment ============
  const renovationChoices = ref<Record<string, number>>({}); // area -> tier number
  const equipmentPurchases = ref<Array<{ itemId: string; tierId: string; cost: number; isLease: boolean }>>([]);

  // ============ Phase 6: Suppliers & Menu ============
  const supplierContracts = ref<Array<{ supplierId: string; minimumOrder: number }>>([]);
  const menuSelections = ref<Array<{ recipeId: string; price: number }>>([]);

  // ============ Phase 7: Staffing ============
  const staffHires = ref<Array<{ candidateId: string; agreedWage: number; hoursPerWeek: number }>>([]);

  // ============ Phase 8: Marketing & Grand Opening ============
  const selectedMarketing = ref<string[]>([]);
  const grandOpening = ref<SimpleGrandOpening | null>(null);
  const businessHours = ref<SimpleBusinessHours | null>(null);
  const salesChannels = ref<SimpleSalesChannels | null>(null);

  // ============ Advisor Messages ============
  const advisorMessages = ref<Array<{ id: string; message: string; character: string; timestamp: number }>>([]);

  // ============ Helper: Get location data ============
  const locationData = computed(() => {
    if (!selectedLocation.value) return null;
    return LOCATION_OPTIONS.find(l => l.id === selectedLocation.value) || null;
  });

  // ============ Computed: Financial Summary ============
  const totalCapital = computed(() => {
    let total = personalSavingsCommitted.value;
    for (const app of fundingApplications.value) {
      if (app.approved === true) {
        total += app.approvedAmount;
      }
    }
    return total;
  });

  const totalDebt = computed(() => {
    let debt = 0;
    for (const app of fundingApplications.value) {
      if (app.approved === true && app.interestRate > 0) {
        debt += app.approvedAmount;
      }
    }
    return debt;
  });

  const monthlyDebtService = computed(() => {
    let monthly = 0;
    for (const app of fundingApplications.value) {
      if (app.approved === true && app.monthlyPayment > 0) {
        monthly += app.monthlyPayment;
      }
    }
    return monthly;
  });

  const totalSpent = computed(() => {
    let spent = 0;

    // Entity filing cost  
    if (entityType.value) {
      const costs: Record<string, number> = {
        sole_proprietorship: 50, llc: 500, partnership: 300, corporation: 1500,
      };
      spent += costs[entityType.value] || 0;
    }

    // Location: security deposit
    if (locationData.value) {
      const loc = locationData.value;
      const effectiveRent = loc.monthlyRent * (1 - leaseDiscount.value);
      spent += effectiveRent * loc.securityDeposit;
    }

    // Permit filing costs
    for (const permit of permits.value) {
      const permitData = PERMITS.find(p => p.id === permit.permitId);
      if (permitData) spent += permitData.cost;
    }

    // Renovation costs
    for (const [area, tierNum] of Object.entries(renovationChoices.value)) {
      const opt = RENOVATION_OPTIONS.find(r => r.area === area);
      if (opt && tierNum >= 1 && tierNum <= opt.tiers.length) {
        spent += opt.tiers[tierNum - 1].cost;
      }
    }

    // Equipment costs
    for (const eq of equipmentPurchases.value) {
      if (!eq.isLease) spent += eq.cost;
    }

    // Marketing setup costs (one-time cost for setup)
    for (const id of selectedMarketing.value) {
      const opt = MARKETING_OPTIONS.find(m => m.id === id);
      if (opt && opt.duration === 'one_time') spent += opt.cost;
    }

    return spent;
  });

  const cashRemaining = computed(() => totalCapital.value - totalSpent.value);

  const monthlyFixedCosts = computed(() => {
    let monthly = 0;
    if (locationData.value) {
      monthly += locationData.value.monthlyRent * (1 - leaseDiscount.value);
    }
    monthly += monthlyDebtService.value;
    for (const eq of equipmentPurchases.value) {
      if (eq.isLease) monthly += eq.cost / 24;
    }
    for (const hire of staffHires.value) {
      monthly += hire.agreedWage * hire.hoursPerWeek * 4.33;
    }
    for (const id of selectedMarketing.value) {
      const opt = MARKETING_OPTIONS.find(m => m.id === id);
      if (opt) {
        if (opt.duration === 'monthly') monthly += opt.cost;
        else if (opt.duration === 'weekly') monthly += opt.cost * 4.33;
      }
    }
    if (salesChannels.value) {
      if (salesChannels.value.delivery) monthly += 500;
      if (salesChannels.value.online) monthly += 300;
      if (salesChannels.value.catering) monthly += 100;
    }
    return Math.round(monthly);
  });

  const estimatedMonthlyRevenue = computed(() => {
    if (!locationData.value || menuSelections.value.length === 0) return 0;
    const loc = locationData.value;
    const baseTraffic = loc.demographics.dailyPedestrianCount * 0.03;
    const avgTicket = menuSelections.value.reduce((s, m) => s + m.price, 0) / menuSelections.value.length;
    const concept = conceptStyle.value ? CONCEPT_STYLE_INFO[conceptStyle.value] : null;
    const priceMultiplier = concept?.priceMultiplier || 1.0;
    return Math.round(baseTraffic * avgTicket * priceMultiplier * 26);
  });

  const financialProjection = computed((): FinancialProjection => {
    const monthlyRev = estimatedMonthlyRevenue.value;
    const monthlyCosts = monthlyFixedCosts.value;
    const burnRate = monthlyCosts;
    const runwayMonths = cashRemaining.value > 0 && burnRate > 0
      ? Math.round(cashRemaining.value / burnRate) : 0;
    const breakEvenMonths = monthlyRev > monthlyCosts && monthlyRev > 0
      ? Math.ceil(totalSpent.value / (monthlyRev - monthlyCosts)) : 999;
    return {
      totalCapital: totalCapital.value,
      totalDebt: totalDebt.value,
      monthlyDebtService: monthlyDebtService.value,
      estimatedMonthlyRevenue: monthlyRev,
      estimatedMonthlyCosts: monthlyCosts,
      breakEvenMonths,
      debtToEquityRatio: totalCapital.value > totalDebt.value
        ? totalDebt.value / (totalCapital.value - totalDebt.value) : 999,
      burnRate,
      runwayMonths,
    };
  });

  // ============ Readiness ============
  const phaseProgress = computed(() => {
    return Math.round((completedPhases.value.length / 8) * 100);
  });

  const startupReadiness = computed(() => {
    const checks = [
      { label: 'Business plan completed', met: !!(businessName.value && entityType.value && conceptStyle.value) },
      { label: 'Funding secured ($10K+)', met: totalCapital.value >= 10000 },
      { label: 'Location selected', met: !!selectedLocation.value },
      { label: 'Required permits approved', met: _allRequiredPermitsApproved() },
      { label: 'Kitchen renovated', met: !!renovationChoices.value.kitchen },
      { label: 'Essential equipment (oven)', met: equipmentPurchases.value.some(p => p.itemId === 'oven') },
      { label: 'Supplier contracted (1+)', met: supplierContracts.value.length >= 1 },
      { label: 'Menu items (3+)', met: menuSelections.value.length >= 3 },
      { label: 'Staff hired (1+)', met: staffHires.value.length >= 1 },
      { label: 'Positive cash reserves', met: cashRemaining.value > 0 },
    ];
    const passed = checks.filter(c => c.met).length;
    return { checks, percentage: Math.round((passed / checks.length) * 100), isReady: passed >= checks.length - 1 };
  });

  function _allRequiredPermitsApproved(): boolean {
    const requiredIds = PERMITS.filter(p => p.requiredForOpening).map(p => p.id);
    return requiredIds.every(id => {
      const state = permits.value.find(ps => ps.permitId === id);
      return state && state.status === 'approved';
    });
  }

  // ============ Phase Navigation ============
  function goToPhase(phase: number) {
    if (phase >= 1 && phase <= 8) {
      if (phase <= currentPhase.value || completedPhases.value.includes(currentPhase.value)) {
        currentPhase.value = phase;
      }
    }
  }

  function completeCurrentPhase() {
    if (!completedPhases.value.includes(currentPhase.value)) {
      completedPhases.value.push(currentPhase.value);
    }
    if (currentPhase.value < 8) {
      currentPhase.value++;
    }
  }

  function advanceWeek() {
    weekNumber.value++;
    // Process funding
    for (const app of fundingApplications.value) {
      if (app.approved === null && app.processingDaysLeft > 0) {
        app.processingDaysLeft -= 7;
        if (app.processingDaysLeft <= 0) {
          const source = FUNDING_SOURCES.find(s => s.id === app.sourceId);
          if (source) {
            let chance = source.approvalChance;
            chance += (ownerBackground.value.creditScore - source.requiresCreditScore) / 200;
            if (source.requiresBusinessPlan && businessName.value) chance += 0.1;
            app.approved = Math.random() < Math.min(0.95, Math.max(0.1, chance));
            if (app.approved) {
              app.approvedAmount = app.requestedAmount * (0.8 + Math.random() * 0.2);
              app.monthlyPayment = (app.approvedAmount / 1000) * source.monthlyPayment;
            }
          }
        }
      }
    }
    // Process permits
    for (const permit of permits.value) {
      if (permit.status === 'pending' && permit.processingWeeksLeft > 0) {
        permit.processingWeeksLeft--;
        if (permit.processingWeeksLeft <= 0) {
          const pd = PERMITS.find(p => p.id === permit.permitId);
          permit.status = pd?.inspectionRequired ? 'inspection_needed' : 'approved';
        }
      }
    }
  }

  // ============ Phase 1 Actions ============
  function setBusinessIdentity(name: string, entity: BusinessEntityType, concept: BakeryConceptStyle, tag: string, owner: string) {
    businessName.value = name;
    entityType.value = entity;
    conceptStyle.value = concept;
    tagline.value = tag;
    ownerName.value = owner;
  }

  function setOwnerBackground(bg: Partial<OwnerBackground>) {
    ownerBackground.value = { ...ownerBackground.value, ...bg };
  }

  // ============ Phase 2 Actions ============
  function applyForFunding(sourceId: string): 'approved' | 'pending' | 'denied' {
    const source = FUNDING_SOURCES.find(s => s.id === sourceId);
    if (!source) return 'denied';
    if (ownerBackground.value.creditScore < source.requiresCreditScore) return 'denied';
    const isInstant = source.processingDays === 0;
    const amount = source.maxAmount;
    const app: FundingApplication = {
      sourceId,
      requestedAmount: amount,
      approved: isInstant ? true : null,
      approvedAmount: isInstant ? amount : 0,
      interestRate: source.interestRate,
      monthlyPayment: isInstant ? (amount / 1000) * source.monthlyPayment : 0,
      processingDaysLeft: source.processingDays,
    };
    fundingApplications.value.push(app);
    return isInstant ? 'approved' : 'pending';
  }

  function commitPersonalSavings(amount: number) {
    personalSavingsCommitted.value = Math.min(amount, ownerBackground.value.personalSavings);
  }

  // ============ Phase 3 Actions ============
  function selectLocation(id: string) {
    selectedLocation.value = id;
    leaseNegotiated.value = false;
    leaseDiscount.value = 0;
  }

  function negotiateLease(): boolean {
    if (!selectedLocation.value) return false;
    const skillBonus = ownerBackground.value.businessExperience * 0.02;
    const creditBonus = (ownerBackground.value.creditScore - 600) * 0.001;
    const roll = Math.random();
    if (roll < 0.45 + skillBonus + creditBonus) {
      leaseDiscount.value = 0.05 + Math.random() * 0.1;
      leaseNegotiated.value = true;
      return true;
    }
    leaseNegotiated.value = true;
    return false;
  }

  // ============ Phase 4 Actions ============
  function filePermit(permitId: string) {
    if (permits.value.some(p => p.permitId === permitId)) return;
    const pd = PERMITS.find(p => p.id === permitId);
    if (!pd) return;
    for (const prereqType of pd.prerequisitePermits) {
      const prereqPermit = PERMITS.find(p => p.type === prereqType);
      if (prereqPermit) {
        const prereqState = permits.value.find(ps => ps.permitId === prereqPermit.id);
        if (!prereqState || prereqState.status !== 'approved') return;
      }
    }
    permits.value.push({ permitId, status: 'pending', filedWeek: weekNumber.value, processingWeeksLeft: pd.processingWeeks });
  }

  function attemptInspection(permitId: string): boolean {
    const ps = permits.value.find(p => p.permitId === permitId);
    if (!ps || ps.status !== 'inspection_needed') return false;
    const pd = PERMITS.find(p => p.id === permitId);
    if (!pd) return false;
    let passChance = pd.passChance;
    const hasGoodEquip = equipmentPurchases.value.some(eq => eq.tierId.includes('standard') || eq.tierId.includes('premium'));
    if (hasGoodEquip) passChance += 0.1;
    const kTier = renovationChoices.value['kitchen'] || 0;
    if (kTier >= 3) passChance += 0.2;
    else if (kTier >= 2) passChance += 0.1;
    const passed = Math.random() < Math.min(0.95, passChance);
    ps.status = passed ? 'approved' : 'denied';
    return passed;
  }

  // ============ Phase 5 Actions ============
  function setRenovation(area: string, tier: number) {
    renovationChoices.value = { ...renovationChoices.value, [area]: tier };
  }

  function addEquipment(itemId: string, tierId: string, cost: number, isLease: boolean) {
    equipmentPurchases.value.push({ itemId, tierId, cost, isLease });
  }

  function removeEquipment(itemId: string) {
    const idx = equipmentPurchases.value.findIndex(e => e.itemId === itemId);
    if (idx >= 0) equipmentPurchases.value.splice(idx, 1);
  }

  // ============ Phase 6 Actions ============
  function addSupplierContract(supplierId: string, minimumOrder: number) {
    supplierContracts.value.push({ supplierId, minimumOrder });
  }

  function removeSupplierContract(supplierId: string) {
    const idx = supplierContracts.value.findIndex(c => c.supplierId === supplierId);
    if (idx >= 0) supplierContracts.value.splice(idx, 1);
  }

  function addMenuItem(recipeId: string, price: number) {
    const existing = menuSelections.value.findIndex(m => m.recipeId === recipeId);
    if (existing >= 0) menuSelections.value[existing] = { recipeId, price };
    else menuSelections.value.push({ recipeId, price });
  }

  function removeMenuItem(recipeId: string) {
    const idx = menuSelections.value.findIndex(m => m.recipeId === recipeId);
    if (idx >= 0) menuSelections.value.splice(idx, 1);
  }

  // ============ Phase 7 Actions ============
  function hireStaff(candidateId: string, agreedWage: number, hoursPerWeek: number) {
    staffHires.value.push({ candidateId, agreedWage, hoursPerWeek });
  }

  function fireStaff(candidateId: string) {
    const idx = staffHires.value.findIndex(h => h.candidateId === candidateId);
    if (idx >= 0) staffHires.value.splice(idx, 1);
  }

  // ============ Phase 8 Actions ============
  function toggleMarketing(optionId: string) {
    const idx = selectedMarketing.value.indexOf(optionId);
    if (idx >= 0) selectedMarketing.value.splice(idx, 1);
    else selectedMarketing.value.push(optionId);
  }

  function setGrandOpening(plan: SimpleGrandOpening) {
    grandOpening.value = { ...plan };
  }

  function setBusinessHours(hours: SimpleBusinessHours) {
    businessHours.value = { ...hours };
  }

  function setSalesChannels(channels: SimpleSalesChannels) {
    salesChannels.value = { ...channels };
  }

  function addAdvisorMessage(msg: { message: string; character: string }) {
    advisorMessages.value.push({
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      timestamp: Date.now(),
    });
  }

  function resetStartup() {
    currentPhase.value = 1;
    completedPhases.value = [];
    weekNumber.value = 1;
    businessName.value = '';
    entityType.value = null;
    conceptStyle.value = null;
    tagline.value = '';
    ownerName.value = '';
    ownerBackground.value = { culinaryExperience: 0, businessExperience: 0, creditScore: 650, personalSavings: 25000, hasBusinessDegree: false, hasCulinaryDegree: false };
    fundingApplications.value = [];
    personalSavingsCommitted.value = 0;
    selectedLocation.value = null;
    leaseNegotiated.value = false;
    leaseDiscount.value = 0;
    permits.value = [];
    renovationChoices.value = {};
    equipmentPurchases.value = [];
    supplierContracts.value = [];
    menuSelections.value = [];
    staffHires.value = [];
    selectedMarketing.value = [];
    grandOpening.value = null;
    businessHours.value = null;
    salesChannels.value = null;
    advisorMessages.value = [];
  }

  return {
    currentPhase, completedPhases, weekNumber,
    businessName, entityType, conceptStyle, tagline, ownerName, ownerBackground,
    fundingApplications, personalSavingsCommitted,
    selectedLocation, leaseNegotiated, leaseDiscount,
    permits, renovationChoices, equipmentPurchases,
    supplierContracts, menuSelections, staffHires,
    selectedMarketing, grandOpening, businessHours, salesChannels, advisorMessages,
    locationData, totalCapital, totalDebt, monthlyDebtService, phaseProgress,
    totalSpent, cashRemaining, monthlyFixedCosts, estimatedMonthlyRevenue,
    financialProjection, startupReadiness,
    goToPhase, completeCurrentPhase, advanceWeek,
    setBusinessIdentity, setOwnerBackground,
    applyForFunding, commitPersonalSavings,
    selectLocation, negotiateLease,
    filePermit, attemptInspection,
    setRenovation, addEquipment, removeEquipment,
    addSupplierContract, removeSupplierContract,
    addMenuItem, removeMenuItem,
    hireStaff, fireStaff,
    toggleMarketing, setGrandOpening, setBusinessHours, setSalesChannels,
    addAdvisorMessage, resetStartup,
  };
}, {
  persist: {
    key: 'bakery_startup_state',
  },
});
