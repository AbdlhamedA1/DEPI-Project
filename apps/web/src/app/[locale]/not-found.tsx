import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <h2 className="text-4xl font-extrabold text-navy-900 mb-2">404</h2>
      <p className="text-xl text-gray-700 mb-6">الصفحة المطلوبة غير موجودة</p>
      <Link
        href="/ar"
        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
