// Pilot entry for /design-sync — scopes the bundle to the 5 components we're
// piloting so esbuild only pulls these + their deps (not all ~60 in src/).
// Re-export everything later by widening this list (or switch to synth-entry).
export { Button } from "@/components/Button";
export { Badge } from "@/components/Badge";
export { Divider } from "@/components/Divider";
export { YunaAvatar } from "@/components/YunaAvatar";
export { ChatBubble } from "@/components/ChatBubble";
