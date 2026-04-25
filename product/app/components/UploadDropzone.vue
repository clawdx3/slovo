<template>
  <div class="flex flex-col items-center">
    <!-- Upload zone -->
    <label
      for="video-upload"
      class="w-full max-w-xl border-2 border-dashed border-gray-200 rounded-2xl bg-white p-12 text-center cursor-pointer transition-colors hover:border-teal-300 hover:bg-teal-50/30"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <input
        id="video-upload"
        ref="inputRef"
        type="file"
        accept="video/*"
        class="hidden"
        @change="handleFileSelect"
      >

      <div class="flex flex-col items-center gap-4">
        <div class="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center">
          <svg class="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <div>
          <p class="text-base font-medium text-gray-700">
            Drop your video here or click to browse
          </p>
          <p class="text-sm text-gray-400 mt-1">MP4, MOV — up to 500 MB</p>
        </div>
      </div>
    </label>

    <!-- Progress -->
    <div v-if="uploading" class="w-full max-w-xl mt-8">
      <div class="flex items-center justify-between text-sm mb-2">
        <span class="text-gray-600">Uploading... {{ Math.round(progress) }}%</span>
      </div>
      <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-teal-500 rounded-full transition-all duration-300"
          :style="{ width: progress + '%' }"
        />
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="mt-6 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl max-w-xl w-full">
      {{ error }}
    </div>

    <!-- Info note for iPhone users -->
    <div class="mt-8 text-center max-w-md">
      <p class="text-xs text-gray-300 leading-relaxed">
        Works great with iPhone 15 Pro videos. For 4K ProRes files, consider compressing first for faster upload.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TranscriptSegment } from '~/types'

const emit = defineEmits<{ (e: 'uploaded', data: { id: string; segments: TranscriptSegment[] }): void }>()

const inputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const progress = ref(0)
const error = ref('')

function handleDrop(e: DragEvent) {
  const files = e.dataTransfer?.files
  if (files?.length) processFile(files[0])
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.length) processFile(target.files[0])
}

async function processFile(file: File) {
  error.value = ''
  uploading.value = true
  progress.value = 0

  if (file.size > 500 * 1024 * 1024) {
    error.value = 'File too large. Maximum 500 MB.'
    uploading.value = false
    return
  }

  const formData = new FormData()
  formData.append('video', file)

  try {
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', (evt) => {
      if (evt.lengthComputable) {
        progress.value = (evt.loaded / evt.total) * 100
      }
    })

    const response = await new Promise<{ id: string; segments: TranscriptSegment[] }>((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText))
          } catch {
            reject(new Error('Invalid response'))
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText || xhr.status}`))
        }
      })
      xhr.addEventListener('error', () => reject(new Error('Network error')))
      xhr.open('POST', 'api/transcribe')
      xhr.send(formData)
    })

    emit('uploaded', response)
  } catch (err: any) {
    error.value = err?.message || 'Upload failed. Please try again.'
  } finally {
    uploading.value = false
    progress.value = 0
    if (inputRef.value) inputRef.value.value = ''
  }
}
</script>
