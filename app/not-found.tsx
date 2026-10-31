import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-black text-emerald-400">Page Not Found</h2>
        <p className="text-slate-400 text-sm">Could not find requested resource</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm"
        >
          Return to Arabiano Tour
        </Link>
      </div>
    </div>
  );
}
