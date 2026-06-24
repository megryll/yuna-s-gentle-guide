import { createFileRoute } from "@tanstack/react-router";
import { WebHomeScreen } from "@/components/WebHomeScreen";
import { useUserType } from "@/lib/user-type";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — Yuna" },
      { name: "description", content: "Begin a conversation with Yuna." },
    ],
  }),
  component: HomeRoute,
});

function HomeRoute() {
  const userType = useUserType();

  // First screen of the responsive web conversion (feature/web). Phone Home
  // (HomeScreen) is preserved in the component tree for reference until the
  // rest of the screens follow.
  return <WebHomeScreen variant={userType} />;
}
