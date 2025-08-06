'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">Tabler</h1>

      <div className="flex items-center space-x-6">
        

        <Link href="/settings" className="hover:opacity-80">
          <Settings className="w-5 h-5" />
        </Link>
      </div>
    </nav>
  );
}