<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <h1 class="text-xl font-semibold tracking-tight text-gray-900">Slovo</h1>
        </div>
        <p class="text-sm text-gray-400 hidden sm:block">Slovenian video transcription</p>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <!-- Upload Step -->
      <UploadDropzone
        v-if="step === 'upload'"
        @uploaded="onUploaded"
      />

      <!-- Processing Step -->
      <div v-else-if="step === 'processing'" class="flex flex-col items-center justify-center py-24">
        <div class="w-12 h-12 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mb-6"></div>
        <h2 class="text-lg font-medium text-gray-900 mb-2">Transcribing your video...</h2>
        <p class="text-sm text-gray-400">This may take a minute. Large videos take longer.</p>
      </div>

      <!-- Editor Step -->
      <TranscriptEditor
        v-else-if="step === 'editor' && transcript"
        :transcript="transcript"
        @translate="goToTranslate"
        @back="step = 'upload'"
      />

      <!-- Translation Step -->
      <TranslationPanel
        v-else-if="step === 'translate' && transcript"
        :transcript="transcript"
        @back="step = 'editor'"
        @export="goToExport"
      />

      <!-- Export Step -->
      <SrtExporter
        v-else-if="step === 'export' && transcript"
        :transcript="transcript"
        :translation="translation"
        :upload-id="uploadId"
        @back="step = 'translate'"
        @reset="resetUpload"
      />
    </main>

    <footer class="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-gray-300">
      Slovo — built for Slovenian creators
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { TranscriptSegment } from '~/types'

type Step = 'upload' | 'processing' | 'editor' | 'translate' | 'export'

const step = ref<Step>('upload')
const transcript = ref<TranscriptSegment[] | null>(null)
const translation = ref<TranscriptSegment[] | null>(null)
const uploadId = ref<string>('')

function onUploaded(data: { id: string; segments: TranscriptSegment[] }) {
  uploadId.value = data.id
  transcript.value = data.segments
  step.value = 'editor'
}

function goToTranslate(segments: TranscriptSegment[]) {
  transcript.value = segments
  step.value = 'translate'
}

function goToExport(data: { transcript: TranscriptSegment[], translation: TranscriptSegment[] }) {
  transcript.value = data.transcript
  translation.value = data.translation
  step.value = 'export'
}

function resetUpload() {
  uploadId.value = ''
  transcript.value = null
  translation.value = null
  step.value = 'upload'
}
</script>
