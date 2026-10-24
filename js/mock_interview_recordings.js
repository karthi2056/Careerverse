window.MockInterviewRecordings = (() => {
  const DATABASE_NAME = 'careerverse_mock_interview_recordings';
  const DATABASE_VERSION = 1;
  const RECORDINGS_STORE = 'recordings';
  const CHUNKS_STORE = 'chunks';
  const CHUNK_INTERVAL_MS = 1000;

  let databasePromise = null;
  const activeRecordings = new Map();

  function openDatabase() {
    if (!window.indexedDB) {
      return Promise.reject(new Error('This browser does not support local recording storage.'));
    }
    if (databasePromise) return databasePromise;

    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(RECORDINGS_STORE)) {
          database.createObjectStore(RECORDINGS_STORE, { keyPath: 'sessionId' });
        }
        if (!database.objectStoreNames.contains(CHUNKS_STORE)) {
          const chunks = database.createObjectStore(CHUNKS_STORE, { keyPath: 'id', autoIncrement: true });
          chunks.createIndex('sessionId', 'sessionId', { unique: false });
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          databasePromise = null;
        };
        resolve(database);
      };
      request.onerror = () => reject(request.error || new Error('Could not open local recording storage.'));
      request.onblocked = () => reject(new Error('Local recording storage is blocked by another open Careerverse tab. Close duplicate tabs and try again.'));
    }).catch(error => {
      databasePromise = null;
      throw error;
    });
    return databasePromise;
  }

  async function runTransaction(storeNames, mode, operation) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeNames, mode);
      let result;
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = () => reject(transaction.error || new Error('Local recording storage transaction was aborted.'));
      transaction.onerror = () => reject(transaction.error || new Error('Local recording storage failed.'));
      try {
        result = operation(transaction);
      } catch (error) {
        transaction.abort();
        reject(error);
      }
    });
  }

  function selectMimeType() {
    if (!window.MediaRecorder) throw new Error('This browser does not support video recording.');
    if (typeof window.MediaRecorder.isTypeSupported !== 'function') return '';
    return [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ].find(mimeType => window.MediaRecorder.isTypeSupported(mimeType)) || '';
  }

  function publish(recording, status, message) {
    if (typeof recording.onStatus === 'function') recording.onStatus({ status, message });
  }

  function persistChunk(recording, chunk) {
    recording.writeQueue = recording.writeQueue.then(() => {
      if (recording.failure) throw recording.failure;
      return runTransaction([RECORDINGS_STORE, CHUNKS_STORE], 'readwrite', transaction => {
        const recordings = transaction.objectStore(RECORDINGS_STORE);
        const chunks = transaction.objectStore(CHUNKS_STORE);
        chunks.add({ sessionId: recording.sessionId, blob: chunk });
        const metadataRequest = recordings.get(recording.sessionId);
        metadataRequest.onsuccess = () => {
          const metadata = metadataRequest.result;
          if (!metadata) {
            transaction.abort();
            return;
          }
          metadata.sizeBytes += chunk.size;
          metadata.chunkCount++;
          recordings.put(metadata);
        };
      });
    }).catch(error => {
      recording.failure = error;
      publish(recording, 'error', `The recording could not be saved in this browser: ${error.message || 'storage error'}`);
      if (recording.recorder.state !== 'inactive') recording.recorder.stop();
    });
    return recording.writeQueue;
  }

  async function start(sessionId, stream, onStatus, accountEmail) {
    if (!sessionId || !stream?.getVideoTracks?.().length) {
      throw new Error('A live webcam stream and interview session are required to start recording.');
    }
    if (!accountEmail) throw new Error('A signed-in account is required to save the interview video.');
    if (activeRecordings.has(sessionId)) throw new Error('A recording is already active for this interview.');

    const mimeType = selectMimeType();
    const recorder = mimeType
      ? new window.MediaRecorder(stream, { mimeType })
      : new window.MediaRecorder(stream);
    const recording = {
      sessionId,
      accountEmail,
      recorder,
      onStatus,
      mimeType: recorder.mimeType || mimeType || 'video/webm',
      startedAt: new Date().toISOString(),
      writeQueue: Promise.resolve(),
      failure: null,
      stopPromise: null,
      stoppingPromise: null
    };
    const metadata = {
      sessionId,
      accountEmail,
      startedAt: recording.startedAt,
      endedAt: null,
      mimeType: recording.mimeType,
      sizeBytes: 0,
      chunkCount: 0,
      status: 'recording'
    };

    await runTransaction([RECORDINGS_STORE], 'readwrite', transaction => {
      transaction.objectStore(RECORDINGS_STORE).put(metadata);
    });
    activeRecordings.set(sessionId, recording);

    recorder.ondataavailable = event => {
      if (event.data?.size) persistChunk(recording, event.data);
    };
    recorder.onerror = event => {
      recording.failure = event.error || new Error('The browser stopped recording unexpectedly.');
      publish(recording, 'error', `The recording stopped unexpectedly: ${recording.failure.message}`);
      if (recorder.state !== 'inactive') recorder.stop();
    };
    recorder.onstop = () => {
      recording.stopPromise = finalize(recording);
    };

    try {
      recorder.start(CHUNK_INTERVAL_MS);
    } catch (error) {
      activeRecordings.delete(sessionId);
      await removeRecording(sessionId);
      throw new Error(`The browser could not start video recording: ${error.message || 'unknown error'}`);
    }
    publish(recording, 'recording', 'Recording locally in this browser.');
    return { sessionId, mimeType: recording.mimeType };
  }

  async function finalize(recording) {
    await recording.writeQueue;
    const endedAt = new Date().toISOString();
    await runTransaction([RECORDINGS_STORE], 'readwrite', transaction => {
      const store = transaction.objectStore(RECORDINGS_STORE);
      const request = store.get(recording.sessionId);
      request.onsuccess = () => {
        const metadata = request.result;
        if (!metadata) return;
        metadata.endedAt = endedAt;
        metadata.status = recording.failure ? 'error' : 'saved';
        store.put(metadata);
      };
    });
    activeRecordings.delete(recording.sessionId);
    publish(recording, recording.failure ? 'error' : 'saved', recording.failure
      ? 'Recording stopped with a storage error. Check browser storage settings before starting another interview.'
      : 'Recording saved in this browser. Download it below or clear it when you no longer need it.');
  }

  async function stop(sessionId) {
    const recording = activeRecordings.get(sessionId);
    if (!recording) return get(sessionId);
    if (!recording.stoppingPromise) {
      recording.stoppingPromise = (async () => {
        if (!recording.stopPromise) {
          const stopped = new Promise(resolve => recording.recorder.addEventListener('stop', resolve, { once: true }));
          if (recording.recorder.state !== 'inactive') recording.recorder.stop();
          if (!recording.stopPromise) await stopped;
        }
        await recording.stopPromise;
      })();
    }
    await recording.stoppingPromise;
    return get(sessionId);
  }

  async function get(sessionId) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([RECORDINGS_STORE], 'readonly');
      const request = transaction.objectStore(RECORDINGS_STORE).get(sessionId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Could not read recording details.'));
    });
  }

  async function list(accountEmail) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([RECORDINGS_STORE], 'readonly');
      const request = transaction.objectStore(RECORDINGS_STORE).getAll();
      request.onsuccess = () => resolve(request.result
        .filter(recording => recording.accountEmail === accountEmail)
        .sort((left, right) => right.startedAt.localeCompare(left.startedAt)));
      request.onerror = () => reject(request.error || new Error('Could not list saved recordings.'));
    });
  }

  async function download(sessionId, accountEmail) {
    const database = await openDatabase();
    const recording = await new Promise((resolve, reject) => {
      const transaction = database.transaction([RECORDINGS_STORE, CHUNKS_STORE], 'readonly');
      const metadataRequest = transaction.objectStore(RECORDINGS_STORE).get(sessionId);
      const chunksRequest = transaction.objectStore(CHUNKS_STORE).index('sessionId').getAll(sessionId);
      transaction.oncomplete = () => resolve({
        metadata: metadataRequest.result || null,
        chunks: chunksRequest.result || []
      });
      transaction.onabort = () => reject(transaction.error || new Error('Could not read the saved video.'));
      transaction.onerror = () => reject(transaction.error || new Error('Could not read the saved video.'));
    });
    if (!recording.metadata || recording.metadata.accountEmail !== accountEmail) {
      throw new Error('This recording does not belong to the signed-in account.');
    }
    if (!recording.chunks.length) {
      throw new Error('No saved video is available for this interview yet.');
    }
    const video = new Blob(recording.chunks.map(chunk => chunk.blob), { type: recording.metadata.mimeType });
    const url = URL.createObjectURL(video);
    const link = document.createElement('a');
    link.href = url;
    link.download = `careerverse-interview-${recording.metadata.startedAt.slice(0, 10)}-${sessionId.slice(0, 8)}.${recording.metadata.mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async function deleteRecording(sessionId, accountEmail) {
    const recordingInfo = await get(sessionId);
    if (!recordingInfo || recordingInfo.accountEmail !== accountEmail) {
      throw new Error('This recording does not belong to the signed-in account.');
    }
    const active = activeRecordings.get(sessionId);
    if (active) await stop(sessionId);
    return removeRecording(sessionId);
  }

  async function removeRecording(sessionId) {
    await runTransaction([RECORDINGS_STORE, CHUNKS_STORE], 'readwrite', transaction => {
      transaction.objectStore(RECORDINGS_STORE).delete(sessionId);
      const cursorRequest = transaction.objectStore(CHUNKS_STORE).index('sessionId').openCursor(sessionId);
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!cursor) return;
        cursor.delete();
        cursor.continue();
      };
    });
  }

  async function clearAll(accountEmail) {
    for (const [sessionId, recording] of activeRecordings) {
      if (recording.accountEmail === accountEmail) await stop(sessionId);
    }
    const database = await openDatabase();
    const sessionIds = (await list(accountEmail)).map(recording => recording.sessionId);
    if (!sessionIds.length) return;
    await new Promise((resolve, reject) => {
      const transaction = database.transaction([RECORDINGS_STORE, CHUNKS_STORE], 'readwrite');
      const recordings = transaction.objectStore(RECORDINGS_STORE);
      const chunks = transaction.objectStore(CHUNKS_STORE);
      sessionIds.forEach(sessionId => {
        recordings.delete(sessionId);
        const cursorRequest = chunks.index('sessionId').openCursor(sessionId);
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          cursor.delete();
          cursor.continue();
        };
      });
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(transaction.error || new Error('Could not clear saved interview videos.'));
      transaction.onerror = () => reject(transaction.error || new Error('Could not clear saved interview videos.'));
    });
  }

  return { start, stop, get, list, download, delete: deleteRecording, clearAll };
})();
