<!--
  GamePanel - Styled container for all game UI sections.
  Variants: default, gold, success, danger, interactive
  Includes optional header with icon.
-->
<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'default' | 'gold' | 'success' | 'danger' | 'info';
  interactive?: boolean;
  selected?: boolean;
  header?: string;
  icon?: string;
  compact?: boolean;
}>(), {
  variant: 'default',
  interactive: false,
  selected: false,
  compact: false,
});
</script>

<template>
  <div
    :class="[
      'game-panel',
      variant !== 'default' && `game-panel--${variant}`,
      interactive && 'game-panel--interactive',
      selected && 'selected',
      compact ? 'p-3' : 'p-5',
    ]"
  >
    <!-- Optional header -->
    <div v-if="header" class="flex items-center gap-2 mb-3 pb-3" style="border-bottom: 1px solid var(--game-border-dark)">
      <span v-if="icon" class="text-lg">{{ icon }}</span>
      <h3 class="font-game-title text-sm font-semibold tracking-wide uppercase" style="color: var(--game-text-secondary)">
        {{ header }}
      </h3>
    </div>
    <slot />
  </div>
</template>
