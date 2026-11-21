import React from 'react';
import Link from 'next/link';

export default function PublicNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
      <h1 className="text-6xl font-black text-orange-500 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        الصفحة المطلوبة غير موجودة / Page Not Found
      </h2>
      <p className="text-slate-600 mb-6 max-w-md">
        عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. قد يكون الرابط خاطئاً أو تم نقل المحتوى.
      </p>
      <Link
        href="/ar"
        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-lg transition"
      >
        العودة للرئيسية / Return Home
      </Link>
    </div>
  );
}
