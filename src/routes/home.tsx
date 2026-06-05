import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/HomeScreen";
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

  // The card feed is identical for both user types (see HomeScreen); only the
  // greeting and the welcome audio differ for new users.
  return (
    <HomeScreen
      variant={userType}
      showWelcome={userType === "new"}
    />
  );
}
