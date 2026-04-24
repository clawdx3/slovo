<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold text-gray-900">Transcript</h2>
      <div class="flex gap-3">
        <button
          @click="$emit('back')"
          class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Back
        </button>
        <button
          @click="goToTranslate"
          class="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Translate
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div class="max-h-[60vh] overflow-y-auto">
        <div
          v-for="(seg, i) in edited"
          :key="i"
          class="group flex items-start gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
        >
          <div class="flex-shrink-0 w-14 text-xs text-gray-400 font-mono pt-1">
            {{ formatTime(seg.start) }}
          </div>
          <div class="flex-1 min-w-0">
            <input
              v-model="edited[i].text"
              type="text"
              class="w-full text-sm text-gray-800 bg-transparent border-none outline-none focus:ring-0 p-0"
              spellcheck="false"
            >
          </div>
          <div class="flex-shrink-0 w-14 text-xs text-gray-300 font-mono pt-1 text-right">
            {{ formatTime(seg.end) }}
          </div>
        </div>
      </div>
    </div>

    <p class="mt-3 text-xs text-gray-300">
      {{ edited.length }} segments — click any line to edit
    </p>
  </div>
</template>

<script setup lang="ts">
import type { TranscriptSegment } from '~/types'

const props = defineProps<{
  transcript: TranscriptSegment[]
}>()

const emit = defineEmits<{
  (e: 'translate', segments: TranscriptSegment[]): void
  (e: 'back'): void
}>()

const edited = ref<TranscriptSegment[]>([...props.transcript.map(s => ({ ...s }))])

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

function goToTranslate() {
  emit('translate', edited.value)
}
</script>
