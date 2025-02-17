import Chat from "@/components/Chat";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg overflow-hidden">
        <Chat />
      </div>
    </div>
  );
}