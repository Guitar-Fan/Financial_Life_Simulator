/**
 * Customer Store - CRM, personality-driven behavior, and relationship management
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Customer, CustomerMetrics, CustomerSegment } from '../types/bakery-game-types';
import { useBakeryGameStore } from './bakery-game-store';

export const useBakeryCustomerStore = defineStore('bakeryCustomer', () => {
  // ============ State ============
  const customers = ref<Map<string, Customer>>(new Map());
  const activeCustomers = ref<string[]>([]); // Currently in store

  const metrics = ref<CustomerMetrics>({
    totalCustomers: 0,
    returningCustomers: 0,
    newCustomersToday: 0,
    averageSatisfaction: 0,
    averageSpend: 0,
    customerLifetimeValue: 0,
    churnRate: 0,
    npsScore: 0,
  });

  const gameStore = useBakeryGameStore();

  // Helper function for random segment
  function randomSegment(): CustomerSegment {
    const rand = Math.random();
    const { budget, mainstream, premium } = gameStore.demographics;

    if (rand < budget) return 'budget';
    if (rand < budget + mainstream) return 'mainstream';
    if (rand < budget + mainstream + premium) return 'premium';
    return 'foodie';
  }

  // ============ Getters ============
  const loyalCustomers = computed(() => {
    return Array.from(customers.value.values()).filter(c =>
      c.loyaltyTier === 'loyal' || c.loyaltyTier === 'vip'
    );
  });

  const atRiskCustomers = computed(() => {
    return Array.from(customers.value.values()).filter(c =>
      c.churnRisk > 0.6 && c.visits > 3
    );
  });

  const customersBySegment = computed(() => {
    const segments: { [key in CustomerSegment]?: Customer[] } = {};
    customers.value.forEach(customer => {
      if (!segments[customer.segment]) segments[customer.segment] = [];
      segments[customer.segment]!.push(customer);
    });
    return segments;
  });

  const lifetimeValue = computed(() => {
    if (customers.value.size === 0) return 0;
    const total = Array.from(customers.value.values())
      .reduce((sum, c) => sum + c.totalSpent, 0);
    return total / customers.value.size;
  });

  function getCustomerById(id: string): Customer | undefined {
    return customers.value.get(id);
  }

  // ============ Actions ============
  function createCustomer(segment: CustomerSegment = 'mainstream'): Customer {
    const customer: Customer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: generateName(),
      email: '',
      phone: '',
      ageGroup: randomAgeGroup(),
      gender: randomGender(),
      segment,
      priceElasticity: Math.random() * 0.5 + 0.5, // 0.5-1.0
      qualityWeight: Math.random() * 0.6 + 0.4, // 0.4-1.0
      trendSeeking: Math.random(),
      personality: {
        patience: Math.random(),
        chattiness: Math.random(),
        impulsiveness: Math.random(),
        flexibility: Math.random(),
        moodiness: Math.random(),
      },
      preferences: {
        sweetness: Math.random() * 2 - 1, // -1 to 1
        heartiness: Math.random(),
        indulgence: Math.random(),
        healthConsciousness: Math.random(),
        adventurousness: Math.random(),
      },
      willingnessToPay: {
        base: getSegmentWillingness(segment),
        modifiers: [],
      },
      currentMood: 70 + Math.random() * 20, // 70-90 initial mood
      visits: 0,
      firstVisit: 0,
      lastVisit: 0,
      totalSpent: 0,
      purchaseHistory: [],
      satisfactionHistory: [],
      satisfaction: 75,
      trustScore: 50,
      loyaltyTier: 'new',
      acquisitionChannel: 'organic',
      returnProbability: 0.5,
      churnRisk: 0.2,
    };

    customers.value.set(customer.id, customer);
    metrics.value.totalCustomers++;

    return customer;
  }

  function updateSatisfaction(customerId: string, satisfactionDelta: number, reason: string = '') {
    const customer = customers.value.get(customerId);
    if (!customer) return;

    customer.satisfaction = Math.max(0, Math.min(100, customer.satisfaction + satisfactionDelta));
    customer.satisfactionHistory.push(customer.satisfaction);

    // Update trust score
    if (satisfactionDelta > 0) {
      customer.trustScore = Math.min(100, customer.trustScore + satisfactionDelta * 0.5);
    } else {
      customer.trustScore = Math.max(0, customer.trustScore + satisfactionDelta * 0.8);
    }

    // Update loyalty tier
    updateLoyaltyTier(customerId);

    // Update return probability
    customer.returnProbability = 0.3 + (customer.satisfaction / 100) * 0.6;
    customer.churnRisk = 1 - customer.returnProbability;

    console.log(`${customer.name} satisfaction: ${satisfactionDelta > 0 ? '+' : ''}${satisfactionDelta} - ${reason}`);
  }

  function recordPurchase(customerId: string, items: string[], total: number, day: number) {
    const customer = customers.value.get(customerId);
    if (!customer) return;

    customer.visits++;
    customer.lastVisit = day;
    if (customer.firstVisit === 0) {
      customer.firstVisit = day;
    }

    customer.totalSpent += total;
    customer.purchaseHistory.push({
      day,
      items,
      total,
      satisfaction: customer.satisfaction,
    });

    updateLoyaltyTier(customerId);
    recalculateMetrics();
  }

  function updateMood(customerId: string, moodDelta: number) {
    const customer = customers.value.get(customerId);
    if (!customer) return;

    customer.currentMood = Math.max(0, Math.min(100, customer.currentMood + moodDelta));

    // Mood affects satisfaction
    if (customer.personality.moodiness > 0.7 && moodDelta < 0) {
      updateSatisfaction(customerId, moodDelta * 0.5, 'Mood affected');
    }
  }

  function spawnCustomers(count: number, segment?: CustomerSegment): string[] {
    const spawned: string[] = [];

    for (let i = 0; i < count; i++) {
      const customerSegment = segment || randomSegment();
      const customer = createCustomer(customerSegment);
      activeCustomers.value.push(customer.id);
      spawned.push(customer.id);
    }

    return spawned;
  }

  function removeActiveCustomer(customerId: string) {
    const index = activeCustomers.value.indexOf(customerId);
    if (index !== -1) {
      activeCustomers.value.splice(index, 1);
    }
  }

  function updateLoyaltyTier(customerId: string) {
    const customer = customers.value.get(customerId);
    if (!customer) return;

    if (customer.visits >= 20 && customer.satisfaction >= 85) {
      customer.loyaltyTier = 'vip';
    } else if (customer.visits >= 10 && customer.satisfaction >= 75) {
      customer.loyaltyTier = 'loyal';
    } else if (customer.visits >= 3 && customer.satisfaction >= 65) {
      customer.loyaltyTier = 'regular';
    } else {
      customer.loyaltyTier = 'new';
    }
  }

  function recalculateMetrics() {
    const allCustomers = Array.from(customers.value.values());

    metrics.value.totalCustomers = allCustomers.length;
    metrics.value.returningCustomers = allCustomers.filter(c => c.visits > 1).length;

    if (allCustomers.length > 0) {
      metrics.value.averageSatisfaction =
        allCustomers.reduce((sum, c) => sum + c.satisfaction, 0) / allCustomers.length;

      metrics.value.averageSpend =
        allCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / allCustomers.length;

      metrics.value.customerLifetimeValue = lifetimeValue.value;

      const churned = allCustomers.filter(c => c.churnRisk > 0.7).length;
      metrics.value.churnRate = churned / allCustomers.length;

      // NPS Score (% promoters - % detractors)
      const promoters = allCustomers.filter(c => c.satisfaction >= 80).length;
      const detractors = allCustomers.filter(c => c.satisfaction < 60).length;
      metrics.value.npsScore = ((promoters - detractors) / allCustomers.length) * 100;
    }
  }

  // Helper functions
  function getSegmentWillingness(segment: CustomerSegment): number {
    const willingness = {
      budget: 0.7,
      mainstream: 1.0,
      premium: 1.5,
      foodie: 1.8,
    };
    return willingness[segment];
  }


  function randomAgeGroup() {
    const groups = ['teen', 'young_adult', 'adult', 'senior'] as const;
    return groups[Math.floor(Math.random() * groups.length)];
  }

  function randomGender() {
    const genders = ['male', 'female', 'non_binary'] as const;
    return genders[Math.floor(Math.random() * genders.length)];
  }

  function generateName(): string {
    const first = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Jamie', 'Sam'];
    const last = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
  }

  function resetCustomers() {
    customers.value.clear();
    activeCustomers.value = [];
    metrics.value = {
      totalCustomers: 0,
      returningCustomers: 0,
      newCustomersToday: 0,
      averageSatisfaction: 0,
      averageSpend: 0,
      customerLifetimeValue: 0,
      churnRate: 0,
      npsScore: 0,
    };
  }

  return {
    // State
    customers,
    activeCustomers,
    metrics,

    // Getters
    loyalCustomers,
    atRiskCustomers,
    customersBySegment,
    lifetimeValue,
    getCustomerById,

    // Actions
    createCustomer,
    updateSatisfaction,
    recordPurchase,
    updateMood,
    spawnCustomers,
    removeActiveCustomer,
    updateLoyaltyTier,
    recalculateMetrics,
    resetCustomers,
  };
}, {
  persist: {
    key: 'bakery_customer_state',
    storage: localStorage,
    serializer: {
      serialize: (state) => {
        return JSON.stringify({
          customers: Array.from(state.customers.entries()),
          activeCustomers: state.activeCustomers,
          metrics: state.metrics,
        });
      },
      deserialize: (value) => {
        const data = JSON.parse(value);
        return {
          customers: new Map(data.customers),
          activeCustomers: data.activeCustomers,
          metrics: data.metrics,
        };
      },
    },
  },
});
