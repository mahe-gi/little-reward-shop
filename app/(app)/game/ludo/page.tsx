import { redirect } from "next/navigation";
import { getLudoGame } from "@/actions/game";
import { LudoGameClient } from "@/components/game/LudoGameClient";

export const dynamic = "force-dynamic";

export default async function LudoPage() {
  const res = await getLudoGame();

  if (!res.success || !res.data) {
    redirect("/home");
  }

  return (
    <LudoGameClient
      gameId={res.data.gameId}
      initialState={res.data.state}
      currentUserId={res.data.currentUserId}
      partnerId={res.data.partnerId}
      userBalance={res.data.userBalance}
    />
  );
}
