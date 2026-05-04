// Fetches TTS audio for a given voice and text, returns a Blob URL.
// Callers are responsible for revoking the URL when done — but for the
// short-lived prototype scope, leaking on unload is fine.
export async function fetchTtsBlobUrl(
  voiceId: string,
  text: string,
): Promise<string> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voiceId, text }),
  });
  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      // ignore
    }
    throw new Error(`TTS ${response.status}: ${detail}`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
