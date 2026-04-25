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

      <div class="flex flex-col gap-3">
        <button
          @click="downloadSrt"
          class="w-full px-5 py-3 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75V3m0 0l-3.75 3.75M12 3l3.75 3.75" />
          </svg>
          Download .srt
        </button>

        <button
          v-if="uploadId"
          :disabled="burning"
          @click="burnVideo"
          class="w-full px-5 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <svg v-if="!burning" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {{ burning ? 'Burning subtitles...' : 'Download video with subtitles' }}
        </button>
      </div>
    </div>

    <!-- Deletion confirmation modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="showDeleteModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cancelDelete" />
          <div class="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-base font-semibold text-gray-900 mb-1">
                  One last check
                </h3>
                <p class="text-sm text-gray-500 leading-relaxed mb-5">
                  Your SRT file has been downloaded. This is your last chance to review or edit anything before the uploaded video is permanently deleted.
                </p>
                <div class="flex gap-3">
                  <button
                    @click="cancelDelete"
                    class="flex-1 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-xl transition-colors"
                  >
                    Keep video — go back
                  </button>
                  <button
                    @click="confirmDelete"
                    class="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    Delete video
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { TranscriptSegment } from '~/types'

const props = defineProps<{
  transcript: TranscriptSegment[]
  translation: TranscriptSegment[] | null
  uploadId?: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'reset'): void
}>()

const language = ref<'sl' | 'en'>('en')
const showDeleteModal = ref(false)
const burning = ref(false)

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

async function burnVideo() {
  if (!props.uploadId || burning.value) return

  burning.value = true
  try {
    const response = await fetch('/api/burn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId: props.uploadId,
        segments: segments.value,
        language: language.value,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.statusMessage || `HTTP ${response.status}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `slovo_${language.value}_subtitled.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Show deletion confirmation after burn
    showDeleteModal.value = true
  } catch (err: any) {
    console.error('Burn failed:', err)
    alert('Failed to burn subtitles: ' + (err?.message || 'Unknown error'))
  } finally {
    burning.value = false
  }
}

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

  // Show deletion confirmation after download
  showDeleteModal.value = true
}

function cancelDelete() {
  showDeleteModal.value = false
}

async function confirmDelete() {
  showDeleteModal.value = false

  if (props.uploadId) {
    try {
      await $fetch(`/api/upload/${props.uploadId}`, { method: 'DELETE' })
    } catch {
      // Ignore cleanup errors — video may already be gone
    }
  }

  // Reset to upload step after deletion
  emit('reset')
}
</script>
