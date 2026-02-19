<!-- 
  SVG Advisor Avatar Component
  Renders different advisor characters using pure SVG graphics.
  Characters: mentor (Chef Auguste), banker, inspector, realtor, chef
-->
<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  character: 'mentor' | 'banker' | 'inspector' | 'realtor' | 'chef';
  size?: number;
  mood?: 'happy' | 'neutral' | 'concerned' | 'excited';
}>(), {
  size: 80,
  mood: 'neutral',
});

const mouthPath = computed(() => {
  switch (props.mood) {
    case 'happy': return 'M 30 52 Q 40 62 50 52';
    case 'excited': return 'M 28 50 Q 40 65 52 50';
    case 'concerned': return 'M 30 56 Q 40 50 50 56';
    default: return 'M 32 54 L 48 54';
  }
});

const eyeSize = computed(() => props.mood === 'excited' ? 4 : 3);
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <!-- Background circle -->
    <circle cx="40" cy="40" r="38" 
      :fill="character === 'mentor' ? '#FEF3C7' : character === 'banker' ? '#DBEAFE' : character === 'inspector' ? '#FEE2E2' : character === 'realtor' ? '#D1FAE5' : '#F3E8FF'" 
      stroke="#8B6F5C" stroke-width="2" />
    
    <!-- MENTOR: Chef Auguste - chef hat, mustache -->
    <g v-if="character === 'mentor'">
      <!-- Chef hat -->
      <ellipse cx="40" cy="12" rx="18" ry="10" fill="white" stroke="#D2BAB0" stroke-width="1.5" />
      <rect x="24" y="12" width="32" height="12" fill="white" stroke="#D2BAB0" stroke-width="1.5" />
      <rect x="22" y="22" width="36" height="4" rx="2" fill="white" stroke="#D2BAB0" stroke-width="1.5" />
      <!-- Face -->
      <circle cx="40" cy="40" r="16" fill="#FDDCB5" />
      <!-- Eyes -->
      <circle cx="34" cy="37" :r="eyeSize" fill="#5A4A3A" />
      <circle cx="46" cy="37" :r="eyeSize" fill="#5A4A3A" />
      <!-- Eyebrows -->
      <path d="M 30 33 Q 34 30 38 33" stroke="#5A4A3A" stroke-width="1.5" fill="none" />
      <path d="M 42 33 Q 46 30 50 33" stroke="#5A4A3A" stroke-width="1.5" fill="none" />
      <!-- Mustache -->
      <path d="M 32 46 Q 36 50 40 46 Q 44 50 48 46" stroke="#8B6F5C" stroke-width="2" fill="none" />
      <!-- Mouth -->
      <path :d="mouthPath" stroke="#C0392B" stroke-width="1.5" fill="none" />
      <!-- Neckerchief -->
      <path d="M 28 56 L 40 64 L 52 56" fill="#E74C3C" stroke="#C0392B" stroke-width="1" />
    </g>

    <!-- BANKER: Patricia Wells - glasses, bun -->
    <g v-if="character === 'banker'">
      <!-- Hair (bun) -->
      <ellipse cx="40" cy="18" rx="12" ry="8" fill="#4A3728" />
      <circle cx="40" cy="14" r="6" fill="#4A3728" />
      <!-- Face -->
      <circle cx="40" cy="38" r="16" fill="#F5D5B8" />
      <!-- Glasses -->
      <circle cx="34" cy="36" r="6" fill="none" stroke="#2C3E50" stroke-width="1.5" />
      <circle cx="46" cy="36" r="6" fill="none" stroke="#2C3E50" stroke-width="1.5" />
      <line x1="40" y1="36" x2="40" y2="36" stroke="#2C3E50" stroke-width="1.5" />
      <line x1="28" y1="36" x2="24" y2="34" stroke="#2C3E50" stroke-width="1.5" />
      <line x1="52" y1="36" x2="56" y2="34" stroke="#2C3E50" stroke-width="1.5" />
      <!-- Eyes behind glasses -->
      <circle cx="34" cy="36" :r="eyeSize - 1" fill="#2C3E50" />
      <circle cx="46" cy="36" :r="eyeSize - 1" fill="#2C3E50" />
      <!-- Mouth -->
      <path :d="mouthPath" stroke="#8B4513" stroke-width="1.5" fill="none" />
      <!-- Collar -->
      <path d="M 26 54 L 32 58 L 40 55 L 48 58 L 54 54" fill="#2C3E50" stroke="#1A252F" stroke-width="1" />
      <!-- Pearl necklace -->
      <circle v-for="i in 5" :key="i" :cx="30 + i * 4" cy="54" r="1.5" fill="#F5F5DC" stroke="#D4AF37" stroke-width="0.5" />
    </g>

    <!-- INSPECTOR: Inspector Davis - clipboard, serious -->
    <g v-if="character === 'inspector'">
      <!-- Hard hat -->
      <ellipse cx="40" cy="22" rx="20" ry="6" fill="#F1C40F" stroke="#D4AC0D" stroke-width="1.5" />
      <path d="M 22 22 Q 22 14 40 12 Q 58 14 58 22" fill="#F1C40F" stroke="#D4AC0D" stroke-width="1.5" />
      <!-- Face -->
      <circle cx="40" cy="40" r="15" fill="#D4A574" />
      <!-- Eyes (stern) -->
      <line x1="31" y1="35" x2="37" y2="37" stroke="#2C3E50" stroke-width="2" />
      <line x1="43" y1="37" x2="49" y2="35" stroke="#2C3E50" stroke-width="2" />
      <circle cx="34" cy="37" :r="eyeSize - 0.5" fill="#2C3E50" />
      <circle cx="46" cy="37" :r="eyeSize - 0.5" fill="#2C3E50" />
      <!-- Mouth -->
      <path :d="mouthPath" stroke="#5A4A3A" stroke-width="1.5" fill="none" />
      <!-- Clipboard -->
      <rect x="56" y="44" width="12" height="16" rx="1" fill="#DEB887" stroke="#8B7355" stroke-width="1" />
      <rect x="58" y="42" width="8" height="3" rx="1" fill="#8B7355" />
      <line x1="58" y1="48" x2="66" y2="48" stroke="#555" stroke-width="0.5" />
      <line x1="58" y1="51" x2="66" y2="51" stroke="#555" stroke-width="0.5" />
      <line x1="58" y1="54" x2="63" y2="54" stroke="#555" stroke-width="0.5" />
    </g>

    <!-- REALTOR: Marco - suit, bright smile -->
    <g v-if="character === 'realtor'">
      <!-- Hair -->
      <path d="M 24 32 Q 24 16 40 14 Q 56 16 56 32" fill="#2C1810" />
      <!-- Face -->
      <circle cx="40" cy="38" r="15" fill="#E8C39E" />
      <!-- Eyes -->
      <circle cx="34" cy="36" :r="eyeSize" fill="#2C3E50" />
      <circle cx="46" cy="36" :r="eyeSize" fill="#2C3E50" />
      <!-- Eye sparkle -->
      <circle cx="35" cy="35" r="1" fill="white" />
      <circle cx="47" cy="35" r="1" fill="white" />
      <!-- Mouth (toothy smile) -->
      <path d="M 32 48 Q 40 58 48 48" stroke="#8B4513" stroke-width="1.5" fill="white" />
      <!-- Suit -->
      <path d="M 24 56 L 30 60 L 36 56 L 40 62 L 44 56 L 50 60 L 56 56" fill="#1A365D" stroke="#0F2440" stroke-width="1" />
      <!-- Tie -->
      <polygon points="38,56 42,56 41,66 39,66" fill="#E74C3C" />
    </g>

    <!-- CHEF: Chef Lila - toque, artistic -->
    <g v-if="character === 'chef'">
      <!-- Bandana -->
      <path d="M 22 28 Q 40 20 58 28 L 58 32 Q 40 24 22 32 Z" fill="#9B59B6" />
      <path d="M 58 28 L 64 24 L 62 30" fill="#9B59B6" />
      <!-- Hair -->
      <path d="M 24 32 Q 22 40 26 46" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M 56 32 Q 58 40 54 46" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round" />
      <!-- Face -->
      <circle cx="40" cy="40" r="15" fill="#F5D5B8" />
      <!-- Eyes (expressive) -->
      <ellipse cx="34" cy="37" rx="3" :ry="eyeSize" fill="#2C3E50" />
      <ellipse cx="46" cy="37" rx="3" :ry="eyeSize" fill="#2C3E50" />
      <!-- Lashes -->
      <line x1="31" y1="34" x2="30" y2="32" stroke="#2C3E50" stroke-width="1" />
      <line x1="37" y1="34" x2="38" y2="32" stroke="#2C3E50" stroke-width="1" />
      <line x1="43" y1="34" x2="42" y2="32" stroke="#2C3E50" stroke-width="1" />
      <line x1="49" y1="34" x2="50" y2="32" stroke="#2C3E50" stroke-width="1" />
      <!-- Blush -->
      <circle cx="28" cy="42" r="4" fill="#FFB6C1" opacity="0.4" />
      <circle cx="52" cy="42" r="4" fill="#FFB6C1" opacity="0.4" />
      <!-- Mouth -->
      <path :d="mouthPath" stroke="#C0392B" stroke-width="1.5" fill="none" />
      <!-- Apron -->
      <path d="M 28 56 L 28 66 L 52 66 L 52 56" fill="white" stroke="#D2BAB0" stroke-width="1" />
      <path d="M 36 56 L 36 58 Q 40 60 44 58 L 44 56" fill="white" stroke="#D2BAB0" stroke-width="1" />
    </g>
  </svg>
</template>
