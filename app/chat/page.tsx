import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { ChatPanel } from "@/components/chat/ChatPanel";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <PublicShell>
      <PageTitle title="Chat" subtitle="Conversacion de texto para participantes de la porra." />
      <ChatPanel />
    </PublicShell>
  );
}

