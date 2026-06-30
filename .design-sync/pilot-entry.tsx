// Entry for /design-sync — re-exports the full 31-component DS roster so esbuild
// pulls these + their deps. Widen by adding to this list + componentSrcMap together.
// Most roster names match their file + export. Exceptions noted inline.
export { Accordion } from "@/components/Accordion";
export { AppBar } from "@/components/AppBar";
export { Badge } from "@/components/Badge";
export { Button } from "@/components/Button";
export { CalendarPicker } from "@/components/CalendarPicker";
export { Card } from "@/components/Card";
export { CardSuggestion } from "@/components/CardSuggestion";
export { ChatBubble } from "@/components/ChatBubble";
export { Checkbox } from "@/components/Checkbox";
export { DictationField } from "@/components/DictationField";
export { DictationTextArea } from "@/components/DictationTextArea";
export { Divider } from "@/components/Divider";
// Roster "HomeCards" is documented (ds.cards) as the HomeCardRow primitive.
export { HomeCardRow as HomeCards } from "@/components/HomeCards";
export { IconMedallion } from "@/components/IconMedallion";
export { MultipleChoice } from "@/components/MultipleChoice";
export { PageHeader } from "@/components/PageHeader";
export { ProgressBar } from "@/components/ProgressBar";
export { RadialProgress } from "@/components/RadialProgress";
export { RatingScale } from "@/components/RatingScale";
export { SegmentedToggle } from "@/components/SegmentedToggle";
export { Slider } from "@/components/Slider";
export { StepDots } from "@/components/StepDots";
export { Surface } from "@/components/Surface";
export { Switch } from "@/components/Switch";
export { Tag } from "@/components/Tag";
export { TextArea } from "@/components/TextArea";
export { TextField } from "@/components/TextField";
export { Toast } from "@/components/Toast";
export { Waveform } from "@/components/Waveform";
export { YunaAvatar } from "@/components/YunaAvatar";
export { YunaExplains } from "@/components/YunaExplains";
