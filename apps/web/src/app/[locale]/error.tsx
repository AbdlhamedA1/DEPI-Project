'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">حدث خطأ غير متوقع</h2>
      <p className="text-gray-600 mb-6">نعتذر عن هذا الخطأ، يرجى المحاولة مرة أخرى.</p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
