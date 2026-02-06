<template>
  <BakeryCard title="Customer Database" variant="elevated" padding="lg">
    <div class="text-center py-12">
      <div class="text-6xl mb-4">👥</div>
      <h3 class="text-2xl font-bold text-bakery-brown-900 mb-2">Customer CRM Coming Soon</h3>
      <p class="text-bakery-brown-600 max-w-md mx-auto">
        Advanced customer relationship management, loyalty tracking, and analytics features
        are being implemented. Check back soon!
      </p>
    </div>
  </BakeryCard>
</template>

<script setup lang="ts">
import { BakeryCard } from '@/components/base';

defineProps<{
  title?: string;
}>();
</script>
