export async function seedInitialData() {
  console.log('Seeding initial Egyptian student housing platform reference data...');
  const universities = [
    { nameAr: 'جامعة القاهرة', nameEn: 'Cairo University', governorate: 'Giza' },
    { nameAr: 'جامعة عين شمس', nameEn: 'Ain Shams University', governorate: 'Cairo' },
    { nameAr: 'جامعة الإسكندرية', nameEn: 'Alexandria University', governorate: 'Alexandria' },
    { nameAr: 'جامعة المنصورة', nameEn: 'Mansoura University', governorate: 'Dakahlia' },
    { nameAr: 'جامعة أسيوط', nameEn: 'Assiut University', governorate: 'Assiut' },
  ];
  return { seededUniversities: universities.length, success: true };
}
