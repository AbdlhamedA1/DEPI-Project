import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';

export default function StudentReviewsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'تقييماتي وتجارب السكن' : 'My Reviews & Housing Ratings'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'تقييم تجربة إقامتك السابقة' : 'Review Your Stay'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              {isAr
                ? 'تقييمك الصادق يساعد زملائك الطلاب في اختيار السكن المناسب ويعزز الشفافية.'
                : 'Your honest feedback helps fellow students choose the right accommodation and boosts platform transparency.'}
            </p>
            <Button variant="outline">{isAr ? 'كتابة تقييم جديد' : 'Write a Review'}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
