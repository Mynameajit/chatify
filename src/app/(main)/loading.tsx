import { ChatifyLoader } from "@/components/shared/ChatifyLoader";

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <ChatifyLoader size="xl" />
    </div>
  );
}
