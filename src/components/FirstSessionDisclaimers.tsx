import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/Button";
import { clearChatLaunch, getPendingChatSearch, useChatLaunchActive } from "@/lib/chat-launch";
import { setSeenDisclaimers } from "@/lib/yuna-session";

// The three things every user acknowledges before their first conversation.
// Copy only — styling comes from our standard dark drawer + DS Button.
// `title` carries the green accent spans inline.
const STEPS = [
  {
    title: (
      <>
        Yuna is <span className="text-yuna-green">not</span>
        <br />
        <span className="text-yuna-green">a real person</span>
      </>
    ),
    body: [
      "Yuna is an AI companion created to support you on your mental wellness journey.",
      "While Yuna offers guidance and encouragement, it should not replace professional mental health care.",
    ],
  },
  {
    title: (
      <>
        Yuna is <span className="text-yuna-green">not</span>
        <br />
        <span className="text-yuna-green">a crisis service</span>
      </>
    ),
    body: [
      "Yuna is a self-help tool that is not intended to be a medical intervention.",
      "For professional support, please contact a licensed professional.",
    ],
  },
  {
    title: (
      <>
        This chat is <span className="text-yuna-green">100% private</span>
      </>
    ),
    body: [
      "Your live chats with Yuna are not monitored by anyone.",
      "Your data is broken down, encrypted, and fully anonymized to protect your privacy.",
    ],
  },
];

export function FirstSessionDisclaimers({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <Drawer open={open} dismissible={false} modal={false}>
      <DrawerContent mode="dark" className="rounded-t-[1.5rem]">
        <div className="px-8 pt-12 pb-12 text-center">
          <DrawerTitle className="font-display font-normal text-[34px] leading-[1.12] tracking-tight text-white">
            {current.title}
          </DrawerTitle>

          <div className="mt-7 flex flex-col gap-5 text-[15px] leading-relaxed text-white/85">
            {current.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <Button surface="light" variant="primary" fullWidth className="mt-12" onClick={next}>
            Next
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Mounted inside the photo-bg shells (HomeScreen / ScreenChrome) so the
// disclaimers portal into the current PhoneFrame and play over the screen the
// user started from. A first-session chat launch flips the chat-launch store
// active; on completion we record the flag and continue to /chat with the
// originally intended search params.
export function FirstSessionDisclaimerGate() {
  const active = useChatLaunchActive();
  const navigate = useNavigate();
  return (
    <FirstSessionDisclaimers
      open={active}
      onComplete={() => {
        setSeenDisclaimers();
        const search = getPendingChatSearch();
        clearChatLaunch();
        navigate({ to: "/chat", search });
      }}
    />
  );
}
