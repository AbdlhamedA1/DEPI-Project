import Link from 'next/link';
import { ShieldCheck, Banknote, Star } from 'lucide-react';
import { Locale } from '../../../i18n/config';

export default function HomePage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            {isAr
              ? 'سكنك الجامعي الموثوق والآمن في مصر'
              : 'Your Trusted & Verified Student Housing in Egypt'}
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto">
            {isAr
              ? 'ابحث عن سكن طلابي مفروش ومؤمن بالقرب من جامعتك مباشرة بدون سماسرة أو عمولات خفية.'
              : 'Search verified and furnished student accommodation near your campus with zero broker fees.'}
          </p>

          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-4xl mx-auto text-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-start">
                  {isAr ? 'الجامعة' : 'University'}
                </label>
                <select className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">{isAr ? 'اختر الجامعة' : 'Select University'}</option>
                  <option value="cairo">جامعة القاهرة</option>
                  <option value="ain-shams">جامعة عين شمس</option>
                  <option value="alexandria">جامعة الإسكندرية</option>
                  <option value="mansoura">جامعة المنصورة</option>
                  <option value="assiut">جامعة أسيوط</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-start">
                  {isAr ? 'نوع السكن' : 'Gender Policy'}
                </label>
                <select className="w-full border border-slate-300 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">{isAr ? 'الكل' : 'All'}</option>
                  <option value="male">{isAr ? 'طلاب (بنين فقط)' : 'Male Students'}</option>
                  <option value="female">{isAr ? 'طالبات (بنات فقط)' : 'Female Students'}</option>
                  <option value="mixed">{isAr ? 'مشترك / عائلي' : 'Mixed / Family'}</option>
                </select>
              </div>

              <div className="flex items-end">
                <Link
                  href={`/${params.locale}/search`}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg text-center transition duration-200"
                >
                  {isAr ? 'ابحث الآن' : 'Search Now'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          {isAr ? 'لماذا تختار منصتنا؟' : 'Why Choose Our Platform?'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {isAr ? 'عقارات وملاك موثقون' : 'Verified Properties & Owners'}
            </h3>
            <p className="text-slate-600">
              {isAr
                ? 'فحص ومراجعة دقيقة لجميع الوثائق والعقود لحماية الطالب وضمان الجدية.'
                : 'Thorough verification of KYC documents and property deeds for maximum student safety.'}
            </p>
          </div>

          <div className="p-6 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Banknote className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {isAr ? 'بدون سماسرة أو عمولات' : 'Zero Broker Fees'}
            </h3>
            <p className="text-slate-600">
              {isAr
                ? 'تواصل مباشر وموثوق بين الطلاب والملاك دون أي تكاليف سمسرة إضافية.'
                : 'Direct, transparent communication between students and verified property owners.'}
            </p>
          </div>

          <div className="p-6 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-emerald-600 fill-emerald-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {isAr ? 'تقييمات طلابية حقيقية' : 'Authentic Student Reviews'}
            </h3>
            <p className="text-slate-600">
              {isAr
                ? 'تقييمات وملاحظات موثوقة من طلاب سابقين أقاموا بالفعل في السكن.'
                : 'Honest reviews from students who actually stayed at the accommodation.'}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
