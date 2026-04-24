<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold text-gray-900">Translation</h2>
      <div class="flex gap-3">
        <button
          @click="$emit('back')"
          class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Back
        </button>
        <button
          @click="translate"
          :disabled="translating"
          class="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
        >
          {{ translating ? 'Translating...' : 'Translate to English' }}
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div class="max-h-[60vh] overflow-y-auto">
        <div
          v-for="(seg, i) in translated"
          :key="i"
          class="px-5 py-4 border-b border-gray-50 last:border-0"
        >
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-14 text-xs text-gray-400 font-mono pt-1">
              {{ formatTime(seg.start) }}
            </div>
            <div class="flex-1 min-w-0">
              <input
                v-model="translated[i].text"
                type="text"
                class="w-full text-sm text-gray-800 bg-transparent border-none outline-none focus:ring-0 p-0"
                spellcheck="false"
              >
            </div>
          </div>
          <div class="mt-1 pl-[72px]">
            <p class="text-xs text-gray-300 italic">{{ original[i]?.text }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="mt-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl">
      {{ error }}
    </div>

    <div class="mt-6 flex justify-end">
      <button
        @click="goToExport"
        class="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors"
      >
        Export SRT
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TranscriptSegment } from '~/types'

const props = defineProps<{
  transcript: TranscriptSegment[]
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'export', data: { transcript: TranscriptSegment[]; translation: TranscriptSegment[] }): void
}>()

const original = ref<TranscriptSegment[]>([...props.transcript.map(s => ({ ...s }))])
const translated = ref<TranscriptSegment[]>([...props.transcript.map(s => ({ ...s }))])
const translating = ref(false)
const error = ref('')

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

async function translate() {
  translating.value = true
  error.value = ''

  try {
    const texts = original.value.map(s => s.text)
    const { translations } = await $fetch('/api/translate', {
      method: 'POST',
      body: { texts },
    })

    translated.value = original.value.map((seg, i) => ({
      ...seg,
      text: translations[i] || seg.text,
    }))
  } catch (err: any) {
    error.value = err?.message || 'Translation failed. Please try again.'
  } finally {
    translating.value = false
  }
}

function goToExport() {
  emit('export', {
    transcript: original.value,
    translation: translated.value,
  })
}
</script>
