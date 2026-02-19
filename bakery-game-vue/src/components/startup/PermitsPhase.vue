<!--
  Phase 4: Permits & Licensing
  Player must file and obtain required permits. Some have prerequisites.
  Inspections can fail based on building condition and equipment quality.
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBakeryStartupStore } from '@/stores/bakery-startup-store';
import { PERMITS } from '@/data/startup-data';
import type { PermitId } from '@/types/startup-types';
import AdvisorAvatar from './graphics/AdvisorAvatar.vue';
import SpeechBubble from './graphics/SpeechBubble.vue';

const store = useBakeryStartupStore();

const expandedPermit = ref<PermitId | null>(null);
const inspectionResult = ref<{ permitId: PermitId; passed: boolean; message: string } | null>(null);

function getPermitStatus(permitId: PermitId) {
  return store.permits.find(p => p.permitId === permitId);
}

function canFile(permit: typeof PERMITS[0]) {
  const prereqsMet = permit.prerequisitePermits.every(prereqType => {
    const prereqPermit = PERMITS.find(p => p.type === prereqType);
    if (!prereqPermit) return true;
    const status = getPermitStatus(prereqPermit.id);
    return status && status.status === 'approved';
  });
  const alreadyFiled = store.permits.some(p => p.permitId === permit.id);
  const canAfford = store.cashRemaining >= permit.cost;
  return prereqsMet && !alreadyFiled && canAfford;
}

function filePermit(permitId: PermitId) {
  store.filePermit(permitId);
}

function attemptInspection(permitId: PermitId) {
  const passed = store.attemptInspection(permitId);
  const permit = PERMITS.find(p => p.id === permitId);
  inspectionResult.value = {
    permitId,
    passed,
    message: passed
      ? `✅ ${permit?.name} inspection passed! Your permit has been approved.`
      : `❌ ${permit?.name} inspection failed. You'll need to address the issues and try again next week.`,
  };
}

const requiredPermits = computed(() => PERMITS.filter(p => p.requiredForOpening));
const optionalPermits = computed(() => PERMITS.filter(p => !p.requiredForOpening));

const allRequiredApproved = computed(() => {
  return requiredPermits.value.every(p => {
    const status = getPermitStatus(p.id);
    return status && status.status === 'approved';
  });
});

const permitsProgress = computed(() => {
  const required = requiredPermits.value.length;
  const approved = requiredPermits.value.filter(p => {
    const status = getPermitStatus(p.id);
    return status && status.status === 'approved';
  }).length;
  return { approved, total: required, pct: required > 0 ? (approved / required) * 100 : 0 };
});

const advisorMessage = computed(() => {
  if (permitsProgress.value.approved === 0) {
    return 'Permits are the boring but essential part. Without them, you\'ll be shut down on day one. Start with the Business License — everything else depends on it.';
  }
  if (!allRequiredApproved.value) {
    return `You've secured ${permitsProgress.value.approved} of ${permitsProgress.value.total} required permits. Keep pushing through the paperwork. Remember, some permits require inspections.`;
  }
  return 'All required permits are approved! You\'re legally cleared to operate. Consider the optional permits too — they can open up additional revenue streams.';
});

function statusBadgeClass(status: string) {
  switch (status) {
    case 'approved': return 'game-badge--success';
    case 'pending': return 'game-badge--warning';
    case 'denied': return 'game-badge--danger';
    case 'inspection_needed': return 'game-badge--info';
    default: return '';
  }
}
</script>

<template>
  <div class="space-y-5 animate-game-fade-in">
    <!-- Advisor -->
    <div class="flex items-start gap-4">
      <AdvisorAvatar character="inspector" :size="64" :mood="allRequiredApproved ? 'happy' : 'neutral'" />
      <SpeechBubble :type="allRequiredApproved ? 'congratulation' : 'tip'" position="left">
        <p><strong class="text-[var(--game-gold)]">Bob Martinez, Building Inspector:</strong> {{ advisorMessage }}</p>
      </SpeechBubble>
    </div>

    <!-- Progress Bar -->
    <div class="game-panel p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-[var(--game-text-secondary)]">Permits Progress</span>
        <span class="text-sm font-bold text-[var(--game-gold)] font-game-mono">{{ permitsProgress.approved }}/{{ permitsProgress.total }} required</span>
      </div>
      <div class="game-resource-bar">
        <div
          class="game-resource-bar__fill game-resource-bar__fill--gold"
          :style="{ width: `${permitsProgress.pct}%` }"
        />
      </div>
      <div class="flex items-center justify-between mt-2">
        <span class="text-xs text-[var(--game-text-muted)]">Week {{ store.weekNumber }}</span>
        <button @click="store.advanceWeek()" class="game-btn game-btn--secondary text-[10px] px-3 py-1.5">
          ⏩ Advance Week
        </button>
      </div>
    </div>

    <!-- Inspection Result Banner -->
    <Transition name="fade">
      <div v-if="inspectionResult" class="game-panel p-4 text-sm font-medium"
        :class="inspectionResult.passed ? 'game-panel--success' : 'game-panel--danger'"
      >
        <p :style="{ color: inspectionResult.passed ? 'var(--game-success)' : 'var(--game-danger)' }">
          {{ inspectionResult.message }}
        </p>
        <button @click="inspectionResult = null" class="text-xs mt-2 underline opacity-60 hover:opacity-100" style="color: var(--game-text-muted)">Dismiss</button>
      </div>
    </Transition>

    <!-- Required Permits -->
    <div class="space-y-3">
      <h3 class="text-base font-game-title font-bold text-[var(--game-gold)] uppercase tracking-wider">
        <span class="mr-2">📋</span>Required Permits
      </h3>

      <div class="space-y-2">
        <div
          v-for="permit in requiredPermits"
          :key="permit.id"
          class="game-panel overflow-hidden"
        >
          <!-- Permit Header -->
          <div
            class="p-4 flex items-center justify-between cursor-pointer transition-colors"
            style="transition: background var(--game-transition-fast)"
            @click="expandedPermit = expandedPermit === permit.id ? null : permit.id"
            @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--game-bg-panel-hover)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold"
                :style="{
                  background: getPermitStatus(permit.id)?.status === 'approved' ? 'var(--game-success-dim)' : 'var(--game-bg-dark)',
                  color: getPermitStatus(permit.id)?.status === 'approved' ? 'var(--game-success)' : 'var(--game-text-muted)',
                  border: `1px solid ${getPermitStatus(permit.id)?.status === 'approved' ? 'var(--game-success-dim)' : 'var(--game-border-dark)'}`,
                }"
              >
                {{ getPermitStatus(permit.id)?.status === 'approved' ? '✅' : '📄' }}
              </div>
              <div>
                <h4 class="font-bold text-sm text-[var(--game-text-primary)]">{{ permit.name }}</h4>
                <p class="text-[10px] text-[var(--game-text-muted)] font-game-mono">${{ permit.cost.toLocaleString() }} · {{ permit.processingWeeks }}wk</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="getPermitStatus(permit.id)" class="game-badge" :class="statusBadgeClass(getPermitStatus(permit.id)!.status)">
                {{ getPermitStatus(permit.id)!.status.replace('_', ' ').toUpperCase() }}
              </span>
              <span class="text-[var(--game-text-dim)] text-xs">{{ expandedPermit === permit.id ? '▲' : '▼' }}</span>
            </div>
          </div>

          <!-- Expanded Details -->
          <Transition name="expand">
            <div v-if="expandedPermit === permit.id" class="px-4 pb-4 space-y-3 pt-3" style="border-top: 1px solid var(--game-border-dark)">
              <p class="text-sm text-[var(--game-text-secondary)]">{{ permit.description }}</p>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div class="p-2 rounded-md text-center" style="background: var(--game-bg-dark)">
                  <p class="text-[var(--game-text-muted)]">Cost</p>
                  <p class="font-bold text-[var(--game-text-primary)] font-game-mono">${{ permit.cost.toLocaleString() }}</p>
                </div>
                <div class="p-2 rounded-md text-center" style="background: var(--game-bg-dark)">
                  <p class="text-[var(--game-text-muted)]">Processing</p>
                  <p class="font-bold text-[var(--game-text-primary)]">{{ permit.processingWeeks }} weeks</p>
                </div>
                <div class="p-2 rounded-md text-center" style="background: var(--game-bg-dark)">
                  <p class="text-[var(--game-text-muted)]">Inspection</p>
                  <p class="font-bold" :style="{ color: permit.inspectionRequired ? 'var(--game-warning)' : 'var(--game-success)' }">
                    {{ permit.inspectionRequired ? 'Required' : 'Not needed' }}
                  </p>
                </div>
                <div class="p-2 rounded-md text-center" style="background: var(--game-bg-dark)">
                  <p class="text-[var(--game-text-muted)]">Prerequisites</p>
                  <p class="font-bold text-[var(--game-text-primary)]">{{ permit.prerequisitePermits.length > 0 ? permit.prerequisitePermits.join(', ') : 'None' }}</p>
                </div>
              </div>

              <!-- Prerequisites Status -->
              <div v-if="permit.prerequisitePermits.length > 0" class="rounded-md p-3" style="background: rgba(96, 165, 250, 0.08); border: 1px solid var(--game-info-dim)">
                <h5 class="text-[10px] font-bold text-[var(--game-info)] uppercase tracking-wider mb-1">Prerequisites</h5>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="prereqType in permit.prerequisitePermits"
                    :key="prereqType"
                    class="game-badge"
                    :class="(() => { const pp = PERMITS.find(p => p.type === prereqType); return pp && getPermitStatus(pp.id)?.status === 'approved'; })()
                      ? 'game-badge--success' : ''"
                  >
                    {{ PERMITS.find(p => p.type === prereqType)?.name || prereqType }}
                    {{ (() => { const pp = PERMITS.find(p => p.type === prereqType); return pp && getPermitStatus(pp.id)?.status === 'approved'; })() ? '✅' : '⏳' }}
                  </span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-2">
                <button
                  v-if="!getPermitStatus(permit.id)"
                  @click="filePermit(permit.id)"
                  :disabled="!canFile(permit)"
                  :class="['game-btn flex-1 py-2.5', canFile(permit) ? 'game-btn--primary' : '']"
                >
                  {{ canFile(permit) ? `File Application ($${permit.cost.toLocaleString()})` : 'Prerequisites not met' }}
                </button>
                <button
                  v-if="getPermitStatus(permit.id)?.status === 'inspection_needed'"
                  @click="attemptInspection(permit.id)"
                  class="game-btn game-btn--secondary flex-1 py-2.5"
                  style="border-color: var(--game-info); color: var(--game-info)"
                >
                  🔍 Request Inspection
                </button>
                <span v-if="getPermitStatus(permit.id)?.status === 'pending'" class="flex-1 py-2.5 text-center text-sm italic text-[var(--game-warning)]">
                  Processing... (advance weeks to proceed)
                </span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Optional Permits -->
    <div class="space-y-3">
      <h3 class="text-sm font-game-title font-bold text-[var(--game-text-secondary)] uppercase tracking-wider">
        <span class="mr-2">📋</span>Optional Permits
      </h3>
      <p class="text-xs text-[var(--game-text-muted)]">Not required to open, but unlock additional revenue or operational capabilities.</p>

      <div class="space-y-2">
        <div
          v-for="permit in optionalPermits"
          :key="permit.id"
          class="game-panel overflow-hidden"
        >
          <div
            class="p-4 flex items-center justify-between cursor-pointer"
            @click="expandedPermit = expandedPermit === permit.id ? null : permit.id"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-md flex items-center justify-center text-sm"
                :style="{
                  background: getPermitStatus(permit.id)?.status === 'approved' ? 'var(--game-success-dim)' : 'var(--game-bg-dark)',
                  color: getPermitStatus(permit.id)?.status === 'approved' ? 'var(--game-success)' : 'var(--game-text-dim)',
                }"
              >
                {{ getPermitStatus(permit.id)?.status === 'approved' ? '✅' : '📄' }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-bold text-sm text-[var(--game-text-primary)]">{{ permit.name }}</h4>
                  <span class="game-badge">Optional</span>
                </div>
                <p class="text-[10px] text-[var(--game-text-muted)] font-game-mono">${{ permit.cost.toLocaleString() }} · {{ permit.processingWeeks }}wk</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="getPermitStatus(permit.id)" class="game-badge" :class="statusBadgeClass(getPermitStatus(permit.id)!.status)">
                {{ getPermitStatus(permit.id)!.status.replace('_', ' ').toUpperCase() }}
              </span>
            </div>
          </div>

          <Transition name="expand">
            <div v-if="expandedPermit === permit.id" class="px-4 pb-4 space-y-3 pt-3" style="border-top: 1px solid var(--game-border-dark)">
              <p class="text-sm text-[var(--game-text-secondary)]">{{ permit.description }}</p>
              <button
                v-if="!getPermitStatus(permit.id)"
                @click="filePermit(permit.id)"
                :disabled="!canFile(permit)"
                :class="['game-btn w-full py-2.5', canFile(permit) ? 'game-btn--primary' : '']"
              >
                {{ canFile(permit) ? `File Application ($${permit.cost.toLocaleString()})` : 'Prerequisites not met' }}
              </button>
              <button
                v-if="getPermitStatus(permit.id)?.status === 'inspection_needed'"
                @click="attemptInspection(permit.id)"
                class="game-btn game-btn--secondary w-full py-2.5"
              >
                🔍 Request Inspection
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex justify-between items-center pt-4">
      <button @click="store.goToPhase(3)" class="game-btn game-btn--ghost">← Location</button>
      <button
        @click="store.completeCurrentPhase()"
        :disabled="!allRequiredApproved"
        :class="['game-btn py-3 px-6', allRequiredApproved ? 'game-btn--primary' : '']"
      >
        {{ allRequiredApproved ? 'Start Renovation →' : 'Complete required permits first' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
