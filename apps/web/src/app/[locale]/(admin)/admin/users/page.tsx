import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

export default function AdminUsersPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'إدارة جميع المستخدمين' : 'User Management'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? 'سجل المستخدمين في المنصة' : 'Platform Users Registry'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="p-3 text-start">{isAr ? 'الاسم' : 'Name'}</th>
                    <th className="p-3 text-start">{isAr ? 'الهاتف' : 'Phone'}</th>
                    <th className="p-3 text-start">{isAr ? 'الدور' : 'Role'}</th>
                    <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-medium">أحمد محمد علي</td>
                    <td className="p-3">01012345678</td>
                    <td className="p-3">
                      <Badge variant="outline">STUDENT</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="success">نشط</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">محمود إبراهيم</td>
                    <td className="p-3">01123456789</td>
                    <td className="p-3">
                      <Badge variant="outline">OWNER</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="success">موثق</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
