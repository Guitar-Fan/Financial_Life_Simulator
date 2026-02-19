<!--
  Phase 1: Business Planning — GAME THEMED
  Dark panels, gold accents, game-styled inputs and selections.
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBakeryStartupStore } from '@/stores/bakery-startup-store';
import type { BusinessEntityType, BakeryConceptStyle } from '@/types/startup-types';
import { ENTITY_TYPE_INFO, CONCEPT_STYLE_INFO } from '@/data/startup-data';
import AdvisorAvatar from './graphics/AdvisorAvatar.vue';
import SpeechBubble from './graphics/SpeechBubble.vue';
import GamePanel from './ui/GamePanel.vue';

const store = useBakeryStartupStore();

const subStep = ref<'identity' | 'concept' | 'background' | 'review'>(
  store.businessName ? 'review' : 'identity'
);

const localName = ref(store.businessName || '');
const localTagline = ref(store.tagline || '');
const localOwnerName = ref(store.ownerName || '');
const localEntity = ref<BusinessEntityType | null>(store.entityType);
const localConcept = ref<BakeryConceptStyle | null>(store.conceptStyle);

const localCulinaryExp = ref(store.ownerBackground.culinaryExperience);
const localBusinessExp = ref(store.ownerBackground.businessExperience);
const localCreditScore = ref(store.ownerBackground.creditScore);
const localSavings = ref(store.ownerBackground.personalSavings);
const localHasBusinessDegree = ref(store.ownerBackground.hasBusinessDegree);
const localHasCulinaryDegree = ref(store.ownerBackground.hasCulinaryDegree);

const entityEntries = computed(() => Object.entries(ENTITY_TYPE_INFO) as [BusinessEntityType, typeof ENTITY_TYPE_INFO[BusinessEntityType]][]);
const conceptEntries = computed(() => Object.entries(CONCEPT_STYLE_INFO) as [BakeryConceptStyle, typeof CONCEPT_STYLE_INFO[BakeryConceptStyle]][]);

const canProceedFromIdentity = computed(() => localName.value.trim().length >= 2 && localOwnerName.value.trim().length >= 2 && localEntity.value !== null);
const canProceedFromConcept = computed(() => localConcept.value !== null);
const canProceedFromBackground = computed(() => localCreditScore.value >= 300 && localSavings.value >= 0);

const creditScoreLabel = computed(() => {
  const s = localCreditScore.value;
  if (s >= 750) return { text: 'Excellent', color: 'var(--game-success)' };
  if (s >= 700) return { text: 'Good', color: 'var(--game-info)' };
  if (s >= 650) return { text: 'Fair', color: 'var(--game-warning)' };
  if (s >= 580) return { text: 'Poor', color: 'var(--game-danger)' };
  return { text: 'Very Poor', color: 'var(--game-danger)' };
});

const advisorMessage = computed(() => {
  if (subStep.value === 'identity') return 'Every great bakery starts with a name that tells a story. Choose wisely — it\'s the first thing customers will remember.';
  if (subStep.value === 'concept') return 'Your concept determines everything: who walks through that door, what they expect, and how much they\'ll pay. Match your strengths to the market.';
  if (subStep.value === 'background') return 'Be honest about your experience and finances. Banks and investors will verify everything. A higher credit score opens more doors.';
  return 'Looking good! Review your business plan below. This will guide every decision going forward.';
});

function goToSubStep(step: typeof subStep.value) { subStep.value = step; }

function saveAndAdvance() {
  if (subStep.value === 'identity' && canProceedFromIdentity.value) { subStep.value = 'concept'; }
  else if (subStep.value === 'concept' && canProceedFromConcept.value) { subStep.value = 'background'; }
  else if (subStep.value === 'background' && canProceedFromBackground.value) {
    store.setBusinessIdentity(localName.value.trim(), localEntity.value!, localConcept.value!, localTagline.value.trim(), localOwnerName.value.trim());
    store.setOwnerBackground({ culinaryExperience: localCulinaryExp.value, businessExperience: localBusinessExp.value, creditScore: localCreditScore.value, personalSavings: localSavings.value, hasBusinessDegree: localHasBusinessDegree.value, hasCulinaryDegree: localHasCulinaryDegree.value });
    subStep.value = 'review';
  } else if (subStep.value === 'review') { store.completeCurrentPhase(); }
}

function goBack() {
  if (subStep.value === 'concept') subStep.value = 'identity';
  else if (subStep.value === 'background') subStep.value = 'concept';
  else if (subStep.value === 'review') subStep.value = 'background';
}
</script>

<template>
  <div class="space-y-5 animate-game-fade-in">
    <!-- Advisor -->
    <div class="flex items-start gap-4">
      <AdvisorAvatar character="mentor" :size="64" mood="happy" />
      <SpeechBubble type="tip" position="left">
        <p><strong style="color: var(--game-gold-bright)">Chef Auguste:</strong> {{ advisorMessage }}</p>
      </SpeechBubble>
    </div>

    <!-- Sub-step Tabs -->
    <div class="game-tabs">
      <button
        v-for="tab in [
          { id: 'identity', label: '1. Identity', icon: '🏷️' },
          { id: 'concept', label: '2. Concept', icon: '💡' },
          { id: 'background', label: '3. Background', icon: '📊' },
          { id: 'review', label: '4. Review', icon: '✅' },
        ]"
        :key="tab.id"
        @click="goToSubStep(tab.id as any)"
        :class="['game-tab', subStep === tab.id && 'game-tab--active']"
      >
        <span>{{ tab.icon }}</span> {{ tab.label }}
      </button>
    </div>

    <!-- ─── IDENTITY ─── -->
    <Transition name="fade" mode="out-in">
      <div v-if="subStep === 'identity'" class="space-y-5">
        <GamePanel header="Name Your Bakery" icon="🏷️">
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--game-text-muted)">Your Name</label>
              <input v-model="localOwnerName" type="text" placeholder="e.g., Jordan Mitchell" class="game-input w-full" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--game-text-muted)">Bakery Name</label>
              <input v-model="localName" type="text" placeholder="e.g., Golden Crust Bakery" class="game-input game-input--lg w-full font-game-title" maxlength="40" />
              <p class="text-[10px] mt-1" style="color: var(--game-text-dim)">{{ localName.length }}/40 characters</p>
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--game-text-muted)">Tagline <span style="color: var(--game-text-dim)">(optional)</span></label>
              <input v-model="localTagline" type="text" placeholder='"Baked with love since Day One"' class="game-input w-full italic" maxlength="60" />
            </div>
          </div>
        </GamePanel>

        <GamePanel header="Business Entity Type" icon="📋">
          <p class="text-xs mb-4" style="color: var(--game-text-muted)">Affects personal liability, taxes, filing costs, and credibility with lenders.</p>
          <div class="grid sm:grid-cols-2 gap-3">
            <div
              v-for="[key, info] in entityEntries"
              :key="key"
              @click="localEntity = key"
              class="game-panel game-panel--interactive p-4"
              :class="localEntity === key && 'selected'"
            >
              <div class="flex justify-between items-start">
                <h4 class="font-semibold text-sm" style="color: var(--game-text-primary)">{{ info.name }}</h4>
                <span class="font-game-mono text-xs" style="color: var(--game-gold)">${{ info.filingCost }}</span>
              </div>
              <p class="text-xs mt-1.5 leading-relaxed" style="color: var(--game-text-muted)">{{ info.description }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <span class="game-badge game-badge--neutral">{{ info.complexity }}</span>
                <span :class="['game-badge', info.liability === 'Limited' ? 'game-badge--success' : 'game-badge--danger']">
                  {{ info.liability }} liability
                </span>
              </div>
              <p class="text-[10px] mt-2 italic" style="color: var(--game-text-dim)">{{ info.taxNote }}</p>
            </div>
          </div>
        </GamePanel>
      </div>

      <!-- ─── CONCEPT ─── -->
      <div v-else-if="subStep === 'concept'" class="space-y-5">
        <GamePanel header="Choose Your Bakery Concept" icon="💡">
          <p class="text-xs mb-4" style="color: var(--game-text-muted)">Your concept defines your brand, target market, ingredient costs, and pricing power.</p>
          <div class="space-y-3">
            <div
              v-for="[key, info] in conceptEntries"
              :key="key"
              @click="localConcept = key"
              class="game-panel game-panel--interactive p-4"
              :class="localConcept === key && 'selected'"
            >
              <div class="flex items-start gap-4">
                <span class="text-3xl">{{ info.icon }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start">
                    <h4 class="font-bold text-sm" style="color: var(--game-text-primary)">{{ info.name }}</h4>
                    <span class="font-game-mono text-xs font-bold" :style="{ color: info.priceMultiplier >= 1.5 ? 'var(--game-info)' : info.priceMultiplier >= 1.0 ? 'var(--game-gold)' : 'var(--game-success)' }">
                      {{ info.priceMultiplier >= 1.5 ? '$$$' : info.priceMultiplier >= 1.0 ? '$$' : '$' }}
                    </span>
                  </div>
                  <p class="text-xs mt-1" style="color: var(--game-text-muted)">{{ info.description }}</p>
                  <div class="mt-3 flex flex-wrap gap-4 text-[11px]">
                    <span style="color: var(--game-text-dim)">Price: <strong style="color: var(--game-text-secondary)">{{ (info.priceMultiplier * 100).toFixed(0) }}%</strong></span>
                    <span style="color: var(--game-text-dim)">Quality: <strong style="color: var(--game-text-secondary)">{{ (info.qualityExpectation * 100).toFixed(0) }}%</strong></span>
                    <span style="color: var(--game-text-dim)">Target: <strong style="color: var(--game-text-secondary)">{{ info.targetDemo }}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GamePanel>
      </div>

      <!-- ─── BACKGROUND ─── -->
      <div v-else-if="subStep === 'background'" class="space-y-5">
        <GamePanel header="Your Background & Finances" icon="📊">
          <p class="text-xs mb-5" style="color: var(--game-text-muted)">Determines what loans you qualify for, baking effectiveness, and initial capital.</p>

          <div class="grid sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--game-text-muted)">
                Culinary Experience: <span style="color: var(--game-gold-bright)">{{ localCulinaryExp }} years</span>
              </label>
              <input type="range" v-model.number="localCulinaryExp" min="0" max="15" step="1" class="game-slider" />
              <div class="flex justify-between text-[9px] mt-1" style="color: var(--game-text-dim)"><span>None</span><span>Expert</span></div>
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--game-text-muted)">
                Business Experience: <span style="color: var(--game-info)">{{ localBusinessExp }} years</span>
              </label>
              <input type="range" v-model.number="localBusinessExp" min="0" max="15" step="1" class="game-slider" />
              <div class="flex justify-between text-[9px] mt-1" style="color: var(--game-text-dim)"><span>None</span><span>Veteran</span></div>
            </div>
          </div>

          <div class="flex gap-4 mt-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="localHasCulinaryDegree" class="game-checkbox" />
              <span class="text-xs" style="color: var(--game-text-secondary)">Culinary Degree</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="localHasBusinessDegree" class="game-checkbox" />
              <span class="text-xs" style="color: var(--game-text-secondary)">Business/MBA Degree</span>
            </label>
          </div>

          <hr class="game-divider" />

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--game-text-muted)">
              Credit Score: <span :style="{ color: creditScoreLabel.color }">{{ localCreditScore }} ({{ creditScoreLabel.text }})</span>
            </label>
            <input type="range" v-model.number="localCreditScore" min="300" max="850" step="10" class="game-slider" />
            <div class="flex justify-between text-[9px] mt-1" style="color: var(--game-text-dim)">
              <span>300</span><span>580</span><span>650</span><span>700</span><span>750</span><span>850</span>
            </div>

            <!-- Credit score bar visualization -->
            <div class="mt-3 game-resource-bar">
              <div
                class="game-resource-bar__fill"
                :class="localCreditScore >= 700 ? 'game-resource-bar__fill--success' : localCreditScore >= 580 ? 'game-resource-bar__fill--gold' : 'game-resource-bar__fill--danger'"
                :style="{ width: `${((localCreditScore - 300) / 550) * 100}%` }"
              />
            </div>
            <p class="text-[10px] mt-2 italic" style="color: var(--game-text-dim)">Your credit score affects loan approval rates, interest rates, and lease negotiations.</p>
          </div>

          <hr class="game-divider" />

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--game-text-muted)">
              Personal Savings: <span style="color: var(--game-success)">${{ localSavings.toLocaleString() }}</span>
            </label>
            <input type="range" v-model.number="localSavings" min="0" max="200000" step="5000" class="game-slider" />
            <div class="flex justify-between text-[9px] mt-1" style="color: var(--game-text-dim)">
              <span>$0</span><span>$50K</span><span>$100K</span><span>$150K</span><span>$200K</span>
            </div>
          </div>
        </GamePanel>
      </div>

      <!-- ─── REVIEW ─── -->
      <div v-else-if="subStep === 'review'" class="space-y-5">
        <GamePanel header="Business Plan Summary" icon="📋">
          <!-- Business Card Preview -->
          <div class="rounded-lg p-6 text-center space-y-2 mb-5" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05)); border: 1px solid var(--game-gold-dim)">
            <p class="font-game-title text-2xl font-bold" style="color: var(--game-gold-bright)">{{ store.businessName || 'Your Bakery' }}</p>
            <p v-if="store.tagline" class="text-sm italic" style="color: var(--game-text-muted)">"{{ store.tagline }}"</p>
            <div class="flex justify-center gap-4 mt-3 text-xs" style="color: var(--game-text-dim)">
              <span v-if="store.conceptStyle">{{ CONCEPT_STYLE_INFO[store.conceptStyle]?.icon }} {{ CONCEPT_STYLE_INFO[store.conceptStyle]?.name }}</span>
              <span v-if="store.entityType">{{ ENTITY_TYPE_INFO[store.entityType]?.name }}</span>
            </div>
            <p class="text-xs mt-2" style="color: var(--game-text-dim)">Owner: {{ store.ownerName }}</p>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div v-for="stat in [
              { val: `${store.ownerBackground.culinaryExperience}yr`, label: 'Culinary Exp.', color: 'var(--game-gold-bright)' },
              { val: `${store.ownerBackground.businessExperience}yr`, label: 'Business Exp.', color: 'var(--game-info)' },
              { val: String(store.ownerBackground.creditScore), label: 'Credit Score', color: creditScoreLabel.color },
              { val: `$${(store.ownerBackground.personalSavings / 1000).toFixed(0)}K`, label: 'Savings', color: 'var(--game-success)' },
              { val: store.ownerBackground.hasCulinaryDegree ? '✅' : '—', label: 'Culinary Deg.', color: 'var(--game-text-primary)' },
              { val: store.ownerBackground.hasBusinessDegree ? '✅' : '—', label: 'Business Deg.', color: 'var(--game-text-primary)' },
            ]" :key="stat.label"
              class="text-center p-3 rounded-lg" style="background: var(--game-bg-darkest); border: 1px solid var(--game-border-dark)"
            >
              <p class="text-xl font-bold font-game-mono" :style="{ color: stat.color }">{{ stat.val }}</p>
              <p class="text-[9px] uppercase tracking-wider mt-1" style="color: var(--game-text-dim)">{{ stat.label }}</p>
            </div>
          </div>

          <!-- Concept Impact -->
          <div v-if="store.conceptStyle" class="mt-4 p-4 rounded-lg" style="background: rgba(96, 165, 250, 0.08); border: 1px solid rgba(96, 165, 250, 0.2)">
            <h4 class="text-xs font-bold mb-2" style="color: var(--game-info)">Concept Impact Analysis</h4>
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div><span style="color: var(--game-text-dim)">Pricing Power:</span> <strong style="color: var(--game-text-secondary)">{{ (CONCEPT_STYLE_INFO[store.conceptStyle].priceMultiplier * 100).toFixed(0) }}%</strong></div>
              <div><span style="color: var(--game-text-dim)">Quality Bar:</span> <strong style="color: var(--game-text-secondary)">{{ (CONCEPT_STYLE_INFO[store.conceptStyle].qualityExpectation * 100).toFixed(0) }}%</strong></div>
              <div class="col-span-2"><span style="color: var(--game-text-dim)">Target:</span> <strong style="color: var(--game-text-secondary)">{{ CONCEPT_STYLE_INFO[store.conceptStyle].targetDemo }}</strong></div>
            </div>
          </div>
        </GamePanel>
      </div>
    </Transition>

    <!-- Navigation -->
    <div class="flex justify-between items-center pt-4">
      <button v-if="subStep !== 'identity'" @click="goBack" class="game-btn game-btn--ghost">
        ← Back
      </button>
      <div v-else />
      <button
        @click="saveAndAdvance"
        :disabled="
          (subStep === 'identity' && !canProceedFromIdentity) ||
          (subStep === 'concept' && !canProceedFromConcept) ||
          (subStep === 'background' && !canProceedFromBackground)
        "
        class="game-btn game-btn--primary"
      >
        {{ subStep === 'review' ? 'Begin Securing Financing →' : 'Continue →' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.fade-enter-from { opacity: 0; transform: translateX(20px); }
.fade-leave-to { opacity: 0; transform: translateX(-20px); }
</style>
