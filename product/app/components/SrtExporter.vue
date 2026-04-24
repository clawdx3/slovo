<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold text-gray-900">Export</h2>
      <div class="flex gap-3">
        <button
          @click="$emit('back')"
          class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Back
        </button>
        <button
          @click="$emit('reset')"
          class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          New video
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-gray-100 p-6">
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Subtitle language</label>
        <div class="flex gap-3">
          <button
            @click="language = 'sl'"
            :class="[
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              language === 'sl'
                ? 'bg-teal-500 text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100',
            ]"
          >
            Slovenian (original)
          </button>
          <button
            @click="language = 'en'"
            :class="[
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              language === 'en'
                ? 'bg-teal-500 text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100',
            ]"
          >
            English (translated)
          </button>
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Preview</label>
        <div class="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto font-mono text-xs text-gray-600">
          <pre class="whitespace-pre-wrap">{{ preview }}</pre>
        </div>
      </div>

      <button
        @click="downloadSrt"
        class="w-full px-5 py-3 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75V3m0 0l-3.75 3.75M12 3l3.75 3.75" />
        </svg>
        Download .srt
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TranscriptSegment } from '~/types'

const props = defineProps<{
  transcript: TranscriptSegment[]
  translation: TranscriptSegment[] | null
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'reset'): void
}>()

const language = ref<'sl' | 'en'>('en')

const segments = computed(() =>
  language.value === 'en' && props.translation ? props.translation : props.transcript
)

function toSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
}

const preview = computed(() => {
  return segments.value
    .map((seg, i) => `${i + 1}\n${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n${seg.text}`)
    .join('\n\n')
})

function downloadSrt() {
  const blob = new Blob([preview.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `slovo_subtitles_${language.value}.srt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
