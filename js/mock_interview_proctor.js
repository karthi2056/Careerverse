/* Local webcam proctoring for the AI mock interview. Frames are never uploaded or recorded. */
window.MockInterviewProctor = (() => {
  const FACE_TASKS_VERSION = '1.1.1';
  const FACE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
  const UNAUTHORIZED_OBJECTS = ['cell phone'];
  const DEFAULT_THRESHOLDS = Object.freeze({
    phoneConfidenceThreshold: 0.62,
    phoneHighConfidenceThreshold: 0.92,
    detectionIntervalMs: 1100,
    phoneDetectionIntervalMs: 1900,
    faceMissingWarningMs: 3500,
    prolongedGazeWarningMs: 7000,
    gazeRepeatMinimumAwayMs: 1800,
    gazeRepeatWindowMs: 90000,
    gazeRepeatCount: 3,
    eventCooldownMs: 30000
  });

  let faceLandmarkerPromise = null;
  let phoneModelPromise = null;
  let scriptPromises = new Map();
  let activeSession = null;
  let defaultThresholds = { ...DEFAULT_THRESHOLDS };

  function resolveThresholds(overrides = {}) {
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
      throw new TypeError('Proctoring thresholds must be provided as an object.');
    }
    const unknownKeys = Object.keys(overrides).filter(key => !(key in DEFAULT_THRESHOLDS));
    if (unknownKeys.length) throw new RangeError(`Unknown proctoring threshold: ${unknownKeys.join(', ')}.`);

    const thresholds = { ...defaultThresholds, ...overrides };
    Object.entries(thresholds).forEach(([key, value]) => {
      if (!Number.isFinite(value)) throw new TypeError(`${key} must be a finite number.`);
    });
    if (
      thresholds.phoneConfidenceThreshold < 0 || thresholds.phoneConfidenceThreshold > 1 ||
      thresholds.phoneHighConfidenceThreshold < thresholds.phoneConfidenceThreshold ||
      thresholds.phoneHighConfidenceThreshold > 1
    ) {
      throw new RangeError('Phone confidence thresholds must be between 0 and 1, with the high threshold no lower than the standard threshold.');
    }
    if (Object.entries(thresholds).some(([key, value]) => key.includes('Threshold') ? false : value <= 0)) {
      throw new RangeError('Proctoring duration and count thresholds must be greater than zero.');
    }
    if (!Number.isInteger(thresholds.gazeRepeatCount) || thresholds.gazeRepeatCount < 2) {
      throw new RangeError('gazeRepeatCount must be an integer of at least 2.');
    }
    return thresholds;
  }

  function configureThresholds(overrides) {
    defaultThresholds = resolveThresholds(overrides);
    return { ...defaultThresholds };
  }

  function loadScript(source, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    if (scriptPromises.has(source)) return scriptPromises.get(source);

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = source;
      script.async = true;
      script.onload = () => window[globalName]
        ? resolve(window[globalName])
        : reject(new Error(`${globalName} did not initialize.`));
      script.onerror = () => reject(new Error(`Could not load ${globalName}. Check your network connection and retry.`));
      document.head.appendChild(script);
    });
    scriptPromises.set(source, promise);
    promise.catch(() => scriptPromises.delete(source));
    return promise;
  }

  function loadFaceLandmarker() {
    if (!faceLandmarkerPromise) {
      const packageUrl = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${FACE_TASKS_VERSION}`;
      faceLandmarkerPromise = import(`${packageUrl}/vision_bundle.mjs`)
        .then(async visionModule => {
          const visionFiles = await visionModule.FilesetResolver.forVisionTasks(`${packageUrl}/wasm`);
          const options = {
            baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numFaces: 3,
            minFaceDetectionConfidence: 0.55,
            minFacePresenceConfidence: 0.55,
            minTrackingConfidence: 0.55,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false
          };
          try {
            return await visionModule.FaceLandmarker.createFromOptions(visionFiles, options);
          } catch (error) {
            options.baseOptions.delegate = 'CPU';
            return visionModule.FaceLandmarker.createFromOptions(visionFiles, options);
          }
        })
        .catch(error => {
          faceLandmarkerPromise = null;
          throw error;
        });
    }
    return faceLandmarkerPromise;
  }

  function loadPhoneModel() {
    if (!phoneModelPromise) {
      phoneModelPromise = loadScript(
        'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',
        'tf'
      ).then(() => loadScript(
        'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js',
        'cocoSsd'
      )).then(cocoSsd => cocoSsd.load({ base: 'lite_mobilenet_v2' }))
        .catch(error => {
          phoneModelPromise = null;
          throw error;
        });
    }
    return phoneModelPromise;
  }

  async function loadModels() {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Secure camera access and a compatible browser are required for webcam monitoring.');
    }
    const [faceLandmarker, phoneModel] = await Promise.all([loadFaceLandmarker(), loadPhoneModel()]);
    return { faceLandmarker, phoneModel };
  }

  function createSession(sessionId, questionId, thresholds) {
    return {
      sessionId,
      thresholds,
      enabled: true,
      startedAt: new Date().toISOString(),
      status: {
        camera: 'Active',
        face: 'Checking',
        gaze: 'Checking',
        phone: 'No phone detected',
        integrity: 'Monitoring active'
      },
      events: [],
      warningCount: 0,
      lastEventAt: {},
      faceMissingSince: null,
      faceMissingLogged: false,
      multipleFaceActive: false,
      gazeAwaySince: null,
      gazeAwayPeriods: [],
      prolongedGazeLogged: false,
      phoneWindow: [],
      phoneFlagged: false,
      phoneClearChecks: 0,
      lastPhoneCheckAt: 0,
      lastQuestionId: questionId?.() || null,
      onUpdate: null,
      video: null,
      faceLandmarker: null,
      phoneModel: null,
      timer: null,
      inspecting: false
    };
  }

  function publish(session) {
    if (typeof session.onUpdate === 'function') session.onUpdate(session);
  }

  function recordEvent(session, type, level, message, confidence = null) {
    const now = Date.now();
    if (now - (session.lastEventAt[type] || 0) < session.thresholds.eventCooldownMs) return null;
    session.lastEventAt[type] = now;
    const event = {
      id: `${session.sessionId}-${session.events.length + 1}`,
      sessionId: session.sessionId,
      timestamp: new Date(now).toISOString(),
      type,
      level,
      message,
      confidence: Number.isFinite(confidence) ? Number(confidence.toFixed(3)) : null,
      questionId: session.lastQuestionId || null
    };
    session.events.push(event);
    session.warningCount++;
    session.status.integrity = 'Warnings for review';
    publish(session);
    return event;
  }

  function getPoint(landmarks, index) {
    return landmarks?.[index];
  }

  function estimateGaze(landmarks) {
    const leftEyeCorners = [getPoint(landmarks, 33), getPoint(landmarks, 133)];
    const rightEyeCorners = [getPoint(landmarks, 362), getPoint(landmarks, 263)];
    const leftIris = [468, 469, 470, 471, 472].map(index => getPoint(landmarks, index)).filter(Boolean);
    const rightIris = [473, 474, 475, 476, 477].map(index => getPoint(landmarks, index)).filter(Boolean);
    const irisRatios = [];

    [[leftEyeCorners, leftIris], [rightEyeCorners, rightIris]].forEach(([corners, iris]) => {
      if (corners.every(Boolean) && iris.length) {
        const low = Math.min(corners[0].x, corners[1].x);
        const width = Math.abs(corners[0].x - corners[1].x);
        const irisCenter = iris.reduce((total, point) => total + point.x, 0) / iris.length;
        if (width > 0) irisRatios.push((irisCenter - low) / width);
      }
    });

    const eyeLeft = getPoint(landmarks, 33);
    const eyeRight = getPoint(landmarks, 263);
    const nose = getPoint(landmarks, 1);
    const chin = getPoint(landmarks, 152);
    const eyeWidth = eyeLeft && eyeRight ? Math.abs(eyeLeft.x - eyeRight.x) : 0;
    const headYaw = eyeWidth && nose ? Math.abs(nose.x - ((eyeLeft.x + eyeRight.x) / 2)) / eyeWidth : 0;
    const eyeMidY = eyeLeft && eyeRight ? (eyeLeft.y + eyeRight.y) / 2 : 0;
    const faceHeight = chin && eyeMidY ? Math.abs(chin.y - eyeMidY) : 0;
    const headPitch = faceHeight && nose ? Math.abs((nose.y - eyeMidY) / faceHeight - 0.45) : 0;
    const irisOffset = irisRatios.length
      ? Math.abs(irisRatios.reduce((total, ratio) => total + ratio, 0) / irisRatios.length - 0.5)
      : 0;

    return {
      lookingAtScreen: headYaw < 0.23 && headPitch < 0.28 && (irisRatios.length === 0 || irisOffset < 0.2),
      confidence: irisRatios.length ? 0.8 : 0.65
    };
  }

  function inspectFaces(session, now) {
    const result = session.faceLandmarker.detectForVideo(session.video, now);
    const faces = result.faceLandmarks || [];
    if (faces.length > 1) {
      session.status.face = `${faces.length} faces detected`;
      session.status.gaze = 'Unavailable with multiple faces';
      session.multipleFaceActive = true;
      recordEvent(session, 'multiple_faces', 'High', 'More than one face was visible in the webcam frame. Review this signal in context.');
      session.faceMissingSince = null;
      session.faceMissingLogged = false;
      return;
    }

    session.multipleFaceActive = false;
    if (faces.length === 0) {
      session.status.face = 'Face not visible';
      session.status.gaze = 'Unavailable';
      session.faceMissingSince ??= now;
      if (!session.faceMissingLogged && now - session.faceMissingSince >= session.thresholds.faceMissingWarningMs) {
        session.faceMissingLogged = true;
        recordEvent(session, 'face_missing', 'Medium', 'No face was detected for several seconds. Check camera framing and lighting.');
      }
      return;
    }

    session.faceMissingSince = null;
    session.faceMissingLogged = false;
    session.status.face = 'Face visible';
    const gaze = estimateGaze(faces[0]);
    session.status.gaze = gaze.lookingAtScreen ? 'Generally toward screen' : 'Looking away briefly';
    if (gaze.lookingAtScreen) {
      if (session.gazeAwaySince) {
        const awayDuration = now - session.gazeAwaySince;
        if (awayDuration >= session.thresholds.gazeRepeatMinimumAwayMs && awayDuration < session.thresholds.prolongedGazeWarningMs) {
          session.gazeAwayPeriods.push(now);
          session.gazeAwayPeriods = session.gazeAwayPeriods.filter(time => now - time <= session.thresholds.gazeRepeatWindowMs);
          if (session.gazeAwayPeriods.length >= session.thresholds.gazeRepeatCount) {
            recordEvent(session, 'repeated_gaze_away', 'Medium', 'Several extended glances away from the screen were observed. Natural brief glances are not flagged.', gaze.confidence);
            session.gazeAwayPeriods = [];
          }
        }
      }
      session.gazeAwaySince = null;
      session.prolongedGazeLogged = false;
    } else {
      session.gazeAwaySince ??= now;
      if (!session.prolongedGazeLogged && now - session.gazeAwaySince >= session.thresholds.prolongedGazeWarningMs) {
        session.prolongedGazeLogged = true;
        recordEvent(session, 'prolonged_gaze_away', 'Medium', 'The face landmarks suggest a sustained look away from the screen. This is an approximate signal, not proof of misconduct.', gaze.confidence);
      }
    }
  }

  async function inspectPhone(session, now) {
    if (now - session.lastPhoneCheckAt < session.thresholds.phoneDetectionIntervalMs || !session.phoneModel) return;
    session.lastPhoneCheckAt = now;
    const predictions = await session.phoneModel.detect(session.video);
    const phone = predictions
      .filter(prediction => UNAUTHORIZED_OBJECTS.includes(prediction.class) && prediction.score >= session.thresholds.phoneConfidenceThreshold)
      .sort((left, right) => right.score - left.score)[0];
    session.phoneWindow.push({ detected: Boolean(phone), confidence: phone?.score || 0, timestamp: now });
    session.phoneWindow = session.phoneWindow.slice(-3);

    if (phone) {
      session.status.phone = `Possible phone in frame (${Math.round(phone.score * 100)}%)`;
      session.phoneClearChecks = 0;
      const repeated = session.phoneWindow.filter(sample => sample.detected).length >= 2;
      if (!session.phoneFlagged && (phone.score >= session.thresholds.phoneHighConfidenceThreshold || repeated)) {
        session.phoneFlagged = true;
        recordEvent(session, 'mobile_phone_detected', 'Medium', 'A mobile phone was detected in the camera frame. The system cannot detect objects outside the camera view.', phone.score);
      }
    } else {
      session.phoneClearChecks++;
      session.status.phone = 'No phone detected in frame';
      if (session.phoneClearChecks >= 3) session.phoneFlagged = false;
    }
  }

  async function inspectSession(session) {
    if (activeSession !== session || session.inspecting) return;
    if (!session.video || session.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      session.timer = setTimeout(() => inspectSession(session), session.thresholds.detectionIntervalMs);
      return;
    }

    session.inspecting = true;
    const now = performance.now();
    try {
      inspectFaces(session, now);
      await inspectPhone(session, Date.now());
      if (!session.warningCount) session.status.integrity = 'Monitoring active';
    } catch (error) {
      session.status.face = 'Detection temporarily unavailable';
      session.status.phone = 'Detection temporarily unavailable';
      session.status.integrity = 'Monitoring unavailable';
      recordEvent(session, 'model_inference_error', 'Low', 'A local detection model could not analyze a frame. Monitoring will retry; no image was saved.');
    } finally {
      session.inspecting = false;
      if (activeSession === session) {
        publish(session);
        session.timer = setTimeout(() => inspectSession(session), session.thresholds.detectionIntervalMs);
      }
    }
  }

  function start(options) {
    if (!options?.video || !options.faceLandmarker || !options.phoneModel) {
      throw new Error('Both local detection models and the live camera are required for monitored interviews.');
    }
    stop();
    const thresholds = resolveThresholds(options.thresholds || defaultThresholds);
    const session = options.previousSession || createSession(options.sessionId, options.getQuestionId, thresholds);
    session.thresholds = thresholds;
    session.enabled = true;
    session.status.camera = 'Active';
    session.status.integrity = session.warningCount ? 'Warnings for review' : 'Monitoring active';
    session.timer = null;
    session.inspecting = false;
    session.video = options.video;
    session.faceLandmarker = options.faceLandmarker;
    session.phoneModel = options.phoneModel;
    session.onUpdate = options.onUpdate;
    activeSession = session;
    inspectSession(session);
    return session;
  }

  function updateQuestion(questionId) {
    if (activeSession) activeSession.lastQuestionId = questionId || null;
  }

  function setVideo(video) {
    if (activeSession && video) activeSession.video = video;
  }

  function cameraUnavailable(message) {
    if (!activeSession) return null;
    activeSession.status.camera = 'Unavailable';
    activeSession.status.integrity = 'Interview paused';
    return recordEvent(activeSession, 'camera_unavailable', 'High', message || 'Camera feed stopped. Interview paused until camera access is restored.');
  }

  function stop() {
    if (activeSession?.timer) clearTimeout(activeSession.timer);
    activeSession = null;
  }

  return {
    loadModels,
    start,
    stop,
    updateQuestion,
    setVideo,
    cameraUnavailable,
    configureThresholds,
    getThresholds: () => ({ ...defaultThresholds }),
    defaultThresholds: { ...DEFAULT_THRESHOLDS },
    unauthorizedObjects: [...UNAUTHORIZED_OBJECTS]
  };
})();
