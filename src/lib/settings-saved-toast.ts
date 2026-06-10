import { createOneShot } from "./one-shot";

// One-shot "your changes have been saved" handoff. A Settings sub-page
// (Account, Subscription, Language, Voice) flags a save, then the Settings
// route consumes it on return and flashes a success toast — confirming the
// change "upon return" without threading state through the router.
const settingsSaved = createOneShot("Your changes have been saved.");
export const flagSettingsSaved = settingsSaved.request;
export const consumeSettingsSaved = settingsSaved.consume;
