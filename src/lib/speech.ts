// Tiny wrapper around the browser's Web Speech API. Used by the chat
// voice-note button and the call screen's voice-agent loop.
//
// Browser support: Chrome and Safari ship `webkitSpeechRecognition`; Firefox
// does not ship SpeechRecognition at all. Caller must handle `null` from
// `createRecognition()` and surface a friendly fallback.

type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechErrorEvent = { error: string; message?: string };

export type Recognition = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  set onresult(cb: (e: SpeechResultEvent) => void);
  set onerror(cb: (e: SpeechErrorEvent) => void);
  set onend(cb: () => void);
  continuous: boolean;
  interimResults: boolean;
  lang: string;
};

type SRConstructor = new () => Recognition;

function getSRConstructor(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SRConstructor;
    webkitSpeechRecognition?: SRConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSRConstructor() !== null;
}

export type RecognitionHandle = {
  /** Stop listening and fire `onfinal` with the accumulated transcript. */
  stop: () => void;
  /** Stop listening without firing `onfinal`. */
  abort: () => void;
};

export type StartRecognitionOpts = {
  /** Live transcript (committed final results plus the current interim chunk). */
  onTranscript?: (text: string) => void;
  /** Fired exactly once after `stop()` — the committed transcript only. */
  onFinal?: (text: string) => void;
  /** Surface API errors so the caller can flip back to idle UI. */
  onError?: (err: SpeechErrorEvent) => void;
  /** When true, recognition keeps running across natural pauses. Defaults to true. */
  continuous?: boolean;
  /** BCP-47 tag. Defaults to the browser's locale. */
  lang?: string;
};

/**
 * Start a recognition session. Returns a handle the caller uses to stop it,
 * or `null` if the browser doesn't support the API.
 *
 * The returned `stop()` flushes whatever's been recognized so far through
 * `onFinal` — the call site doesn't need to dedupe interim vs final results.
 */
export function startRecognition(
  opts: StartRecognitionOpts,
): RecognitionHandle | null {
  const SR = getSRConstructor();
  if (!SR) return null;

  const recognition = new SR();
  recognition.continuous = opts.continuous ?? true;
  recognition.interimResults = true;
  recognition.lang = opts.lang ?? (typeof navigator !== "undefined" ? navigator.language : "en-US");

  let committed = "";
  let stopped = false;
  let finalFired = false;

  recognition.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) committed += r[0].transcript;
      else interim += r[0].transcript;
    }
    opts.onTranscript?.((committed + interim).trim());
  };

  recognition.onerror = (e) => {
    opts.onError?.(e);
  };

  recognition.onend = () => {
    if (stopped && !finalFired) {
      finalFired = true;
      opts.onFinal?.(committed.trim());
    }
  };

  try {
    recognition.start();
  } catch (err) {
    // Calling start() twice in quick succession (e.g. React StrictMode
    // double-mount) throws InvalidStateError. Treat as fatal and bail.
    opts.onError?.({ error: "start-failed", message: String(err) });
    return null;
  }

  return {
    stop: () => {
      stopped = true;
      try {
        recognition.stop();
      } catch {
        // Already stopped — onend will fire and our flag handles the rest.
      }
    },
    abort: () => {
      stopped = true;
      finalFired = true;
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    },
  };
}
