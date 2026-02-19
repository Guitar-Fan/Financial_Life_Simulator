<!--
  SVG Building Illustration Component
  Renders a simple storefront/building to represent the bakery being built up.
  Shows different visual states based on renovation progress.
-->
<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  width?: number;
  height?: number;
  hasExterior?: boolean;
  hasStorefront?: boolean;
  hasKitchen?: boolean;
  hasSign?: boolean;
  signText?: string;
  lightOn?: boolean;
  style?: 'shell' | 'basic' | 'charming' | 'premium';
}>(), {
  width: 320,
  height: 220,
  hasExterior: false,
  hasStorefront: false,
  hasKitchen: false,
  hasSign: false,
  signText: 'BAKERY',
  lightOn: false,
  style: 'shell',
});

const wallColor = computed(() => {
  switch (props.style) {
    case 'premium': return '#FDF8F6';
    case 'charming': return '#FEF3C7';
    case 'basic': return '#F2E8E5';
    default: return '#D4D4D4';
  }
});

const roofColor = computed(() => {
  switch (props.style) {
    case 'premium': return '#92400E';
    case 'charming': return '#B45309';
    default: return '#6B7280';
  }
});
</script>

<template>
  <svg :width="width" :height="height" viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
    <!-- Sky gradient -->
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#87CEEB" />
        <stop offset="100%" style="stop-color:#E0F2FE" />
      </linearGradient>
      <linearGradient id="windowGlow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#FEF3C7" />
        <stop offset="100%" style="stop-color:#FDE68A" />
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="320" height="220" fill="url(#skyGrad)" rx="8" />

    <!-- Ground / Sidewalk -->
    <rect x="0" y="170" width="320" height="50" fill="#9CA3AF" />
    <rect x="0" y="170" width="320" height="4" fill="#6B7280" />
    <!-- Sidewalk lines -->
    <line x1="0" y1="190" x2="320" y2="190" stroke="#A3A3A3" stroke-width="1" stroke-dasharray="20,10" />

    <!-- Building Structure -->
    <rect x="40" y="50" width="240" height="120" :fill="wallColor" stroke="#8B7355" stroke-width="2" />

    <!-- Roof -->
    <polygon :points="'30,50 160,15 290,50'" :fill="roofColor" stroke="#5A3E28" stroke-width="2" />

    <!-- Chimney (if kitchen) -->
    <g v-if="hasKitchen">
      <rect x="220" y="10" width="20" height="35" fill="#A0522D" stroke="#5A3E28" stroke-width="1.5" />
      <!-- Smoke -->
      <g opacity="0.4">
        <circle cx="230" cy="5" r="5" fill="#D1D5DB">
          <animate attributeName="cy" values="5;-5;5" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="225" cy="-2" r="4" fill="#D1D5DB">
          <animate attributeName="cy" values="-2;-12;-2" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>

    <!-- Door -->
    <rect x="140" y="110" width="40" height="60" fill="#8B6F5C" stroke="#5A4A3A" stroke-width="2" rx="2" />
    <circle cx="172" cy="142" r="3" fill="#D4AF37" /> <!-- Door handle -->

    <!-- Windows -->
    <g v-if="!hasStorefront">
      <!-- Basic windows -->
      <rect x="60" y="75" width="50" height="45" fill="#B4C6D9" stroke="#5A4A3A" stroke-width="1.5" rx="2" />
      <line x1="85" y1="75" x2="85" y2="120" stroke="#5A4A3A" stroke-width="1" />
      <line x1="60" y1="97" x2="110" y2="97" stroke="#5A4A3A" stroke-width="1" />

      <rect x="210" y="75" width="50" height="45" fill="#B4C6D9" stroke="#5A4A3A" stroke-width="1.5" rx="2" />
      <line x1="235" y1="75" x2="235" y2="120" stroke="#5A4A3A" stroke-width="1" />
      <line x1="210" y1="97" x2="260" y2="97" stroke="#5A4A3A" stroke-width="1" />
    </g>

    <!-- Storefront windows (upgraded) -->
    <g v-else>
      <!-- Large display windows -->
      <rect x="52" y="70" width="75" height="55" :fill="lightOn ? 'url(#windowGlow)' : '#B4C6D9'" stroke="#5A4A3A" stroke-width="2" rx="3" />
      <rect x="193" y="70" width="75" height="55" :fill="lightOn ? 'url(#windowGlow)' : '#B4C6D9'" stroke="#5A4A3A" stroke-width="2" rx="3" />

      <!-- Display items inside (silhouettes) -->
      <g v-if="lightOn" opacity="0.6">
        <circle cx="70" cy="110" r="6" fill="#D97706" /> <!-- Bread -->
        <circle cx="85" cy="108" r="5" fill="#92400E" /> <!-- Pastry -->
        <rect x="95" y="105" width="12" height="8" rx="2" fill="#F59E0B" /> <!-- Cake -->
        <circle cx="215" cy="110" r="6" fill="#D97706" />
        <circle cx="230" cy="108" r="5" fill="#92400E" />
        <rect x="240" y="105" width="10" height="8" rx="2" fill="#F59E0B" />
      </g>
    </g>

    <!-- Awning -->
    <g v-if="hasExterior">
      <path d="M 40 65 L 40 72 Q 70 80 100 72 Q 130 80 160 72 Q 190 80 220 72 Q 250 80 280 72 L 280 65 Z" 
        :fill="style === 'premium' ? '#DC2626' : style === 'charming' ? '#D97706' : '#6B7280'" opacity="0.9" />
      <path d="M 40 65 Q 70 73 100 65 Q 130 73 160 65 Q 190 73 220 65 Q 250 73 280 65" 
        fill="none" :stroke="style === 'premium' ? '#B91C1C' : '#5A3E28'" stroke-width="1.5" />
    </g>

    <!-- Sign -->
    <g v-if="hasSign">
      <rect x="90" y="52" width="140" height="22" rx="4" 
        :fill="style === 'premium' ? '#1C1917' : '#FDF8F6'" 
        :stroke="style === 'premium' ? '#D4AF37' : '#8B7355'" stroke-width="2" />
      <text x="160" y="68" text-anchor="middle" 
        :fill="style === 'premium' ? '#D4AF37' : '#5A4A3A'" 
        font-size="13" font-family="Georgia, serif" font-weight="bold" letter-spacing="2">
        {{ signText.toUpperCase().substring(0, 16) }}
      </text>

      <!-- Light above sign if premium -->
      <g v-if="style === 'premium'">
        <rect x="105" y="47" width="4" height="5" fill="#D4AF37" />
        <rect x="211" y="47" width="4" height="5" fill="#D4AF37" />
        <circle cx="107" cy="47" r="3" fill="#FDE68A" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="213" cy="47" r="3" fill="#FDE68A" opacity="0.6">
          <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>

    <!-- Flower boxes (charming/premium only) -->
    <g v-if="style === 'charming' || style === 'premium'">
      <rect x="55" y="125" width="45" height="8" rx="2" fill="#8B6F5C" />
      <circle cx="65" cy="122" r="4" fill="#F472B6" />
      <circle cx="75" cy="120" r="5" fill="#FB923C" />
      <circle cx="85" cy="122" r="4" fill="#F472B6" />
      <!-- Stems -->
      <line x1="65" y1="125" x2="65" y2="118" stroke="#22C55E" stroke-width="1" />
      <line x1="75" y1="125" x2="75" y2="116" stroke="#22C55E" stroke-width="1" />
      <line x1="85" y1="125" x2="85" y2="118" stroke="#22C55E" stroke-width="1" />

      <rect x="220" y="125" width="45" height="8" rx="2" fill="#8B6F5C" />
      <circle cx="230" cy="122" r="4" fill="#A78BFA" />
      <circle cx="240" cy="120" r="5" fill="#F472B6" />
      <circle cx="250" cy="122" r="4" fill="#FBBF24" />
    </g>

    <!-- Construction elements (shell state) -->
    <g v-if="style === 'shell'" opacity="0.7">
      <!-- Scaffolding -->
      <line x1="35" y1="45" x2="35" y2="170" stroke="#D97706" stroke-width="2" />
      <line x1="285" y1="45" x2="285" y2="170" stroke="#D97706" stroke-width="2" />
      <line x1="35" y1="80" x2="285" y2="80" stroke="#D97706" stroke-width="1.5" />
      <line x1="35" y1="130" x2="285" y2="130" stroke="#D97706" stroke-width="1.5" />
      <!-- Caution tape -->
      <rect x="20" y="165" width="280" height="10" fill="#FDE047" opacity="0.8" />
      <text x="160" y="173" text-anchor="middle" fill="#DC2626" font-size="8" font-weight="bold">⚠ UNDER CONSTRUCTION ⚠</text>
    </g>

    <!-- Tree -->
    <g transform="translate(295, 110)">
      <rect x="-3" y="20" width="6" height="30" fill="#8B6F5C" />
      <circle cx="0" cy="10" r="18" fill="#22C55E" opacity="0.7" />
      <circle cx="-8" cy="16" r="12" fill="#16A34A" opacity="0.6" />
      <circle cx="8" cy="14" r="14" fill="#15803D" opacity="0.5" />
    </g>
  </svg>
</template>
