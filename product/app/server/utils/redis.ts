import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'

let _connection: IORedis.Redis | null = null
let _queue: Queue | null = null

export function getRedisConnection(): IORedis.Redis {
  if (!_connection) {
    const runtimeConfig = useRuntimeConfig()
    _connection = new IORedis(runtimeConfig.redisUrl, {
      maxRetriesPerRequest: null,
    })
  }
  return _connection
}

export function getTranscriptionQueue(): Queue {
  if (!_queue) {
    _queue = new Queue('transcription', {
      connection: getRedisConnection(),
    })
  }
  return _queue
}

export async function closeRedis(): Promise<void> {
  if (_queue) {
    await _queue.close()
    _queue = null
  }
  if (_connection) {
    await _connection.quit()
    _connection = null
  }
}
