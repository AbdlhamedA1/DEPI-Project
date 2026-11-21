/**
 * Egyptian Locations Fixture
 * Authoritative dataset of Egyptian Governorates, Cities, and Key Student Neighborhoods
 * Supporting Cairo, Giza, Alexandria, Mansoura (Dakahlia), Assiut, and more.
 */

export interface GovernorateFixture {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
}

export interface CityFixture {
  id: string;
  governorateId: string;
  nameAr: string;
  nameEn: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface AreaFixture {
  id: string;
  cityId: string;
  nameAr: string;
  nameEn: string;
  postalCode?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  popularForStudents: boolean;
  nearUniversities: string[];
}

export const EGYPTIAN_GOVERNORATES: GovernorateFixture[] = [
  { id: 'gov-cairo', nameAr: 'القاهرة', nameEn: 'Cairo', code: 'CAI' },
  { id: 'gov-giza', nameAr: 'الجيزة', nameEn: 'Giza', code: 'GIZ' },
  { id: 'gov-alexandria', nameAr: 'الإسكندرية', nameEn: 'Alexandria', code: 'ALX' },
  { id: 'gov-dakahlia', nameAr: 'الدقهلية', nameEn: 'Dakahlia', code: 'DKH' },
  { id: 'gov-assiut', nameAr: 'أسيوط', nameEn: 'Assiut', code: 'AST' },
  { id: 'gov-gharbia', nameAr: 'الغربية', nameEn: 'Gharbia', code: 'GHB' },
  { id: 'gov-sharqia', nameAr: 'الشرقية', nameEn: 'Sharqia', code: 'SHR' },
];

export const EGYPTIAN_CITIES: CityFixture[] = [
  {
    id: 'city-cairo',
    governorateId: 'gov-cairo',
    nameAr: 'القاهرة',
    nameEn: 'Cairo',
    coordinates: { lat: 30.0444, lng: 31.2357 },
  },
  {
    id: 'city-giza',
    governorateId: 'gov-giza',
    nameAr: 'الجيزة',
    nameEn: 'Giza',
    coordinates: { lat: 30.0131, lng: 31.2089 },
  },
  {
    id: 'city-alexandria',
    governorateId: 'gov-alexandria',
    nameAr: 'الإسكندرية',
    nameEn: 'Alexandria',
    coordinates: { lat: 31.2001, lng: 29.9187 },
  },
  {
    id: 'city-mansoura',
    governorateId: 'gov-dakahlia',
    nameAr: 'المنصورة',
    nameEn: 'Mansoura',
    coordinates: { lat: 31.0409, lng: 31.3785 },
  },
  {
    id: 'city-assiut',
    governorateId: 'gov-assiut',
    nameAr: 'أسيوط',
    nameEn: 'Assiut',
    coordinates: { lat: 27.1783, lng: 31.1859 },
  },
  {
    id: 'city-6th-october',
    governorateId: 'gov-giza',
    nameAr: 'السادس من أكتوبر',
    nameEn: '6th of October',
    coordinates: { lat: 29.9737, lng: 30.9529 },
  },
  {
    id: 'city-new-cairo',
    governorateId: 'gov-cairo',
    nameAr: 'القاهرة الجديدة',
    nameEn: 'New Cairo',
    coordinates: { lat: 30.0074, lng: 31.4913 },
  },
];

export const EGYPTIAN_AREAS: AreaFixture[] = [
  // Giza Areas
  {
    id: 'area-dokki',
    cityId: 'city-giza',
    nameAr: 'الدقي',
    nameEn: 'Dokki',
    postalCode: '12311',
    coordinates: { lat: 30.0385, lng: 31.2124 },
    popularForStudents: true,
    nearUniversities: ['univ-cairo'],
  },
  {
    id: 'area-mohandessin',
    cityId: 'city-giza',
    nameAr: 'المهندسين',
    nameEn: 'Mohandessin',
    postalCode: '12411',
    coordinates: { lat: 30.0538, lng: 31.2001 },
    popularForStudents: true,
    nearUniversities: ['univ-cairo'],
  },
  {
    id: 'area-giza-square',
    cityId: 'city-giza',
    nameAr: 'ميدان الجيزة',
    nameEn: 'Giza Square',
    postalCode: '12211',
    coordinates: { lat: 30.0105, lng: 31.2091 },
    popularForStudents: true,
    nearUniversities: ['univ-cairo'],
  },
  {
    id: 'area-faisal',
    cityId: 'city-giza',
    nameAr: 'فيصل',
    nameEn: 'Faisal',
    postalCode: '12511',
    coordinates: { lat: 30.0051, lng: 31.1712 },
    popularForStudents: true,
    nearUniversities: ['univ-cairo'],
  },
  {
    id: 'area-october-district1',
    cityId: 'city-6th-october',
    nameAr: 'الحي الأول - أكتوبر',
    nameEn: '1st District - 6th of October',
    postalCode: '12566',
    coordinates: { lat: 29.9782, lng: 30.9421 },
    popularForStudents: true,
    nearUniversities: ['univ-must', 'univ-o6u'],
  },

  // Cairo Areas
  {
    id: 'area-nasr-city',
    cityId: 'city-cairo',
    nameAr: 'مدينة نصر',
    nameEn: 'Nasr City',
    postalCode: '11765',
    coordinates: { lat: 30.0561, lng: 31.3301 },
    popularForStudents: true,
    nearUniversities: ['univ-azhar', 'univ-ain-shams'],
  },
  {
    id: 'area-abbassia',
    cityId: 'city-cairo',
    nameAr: 'العباسية',
    nameEn: 'Abbassia',
    postalCode: '11566',
    coordinates: { lat: 30.0682, lng: 31.2825 },
    popularForStudents: true,
    nearUniversities: ['univ-ain-shams'],
  },
  {
    id: 'area-maadi',
    cityId: 'city-cairo',
    nameAr: 'المعادي',
    nameEn: 'Maadi',
    postalCode: '11728',
    coordinates: { lat: 29.9602, lng: 31.2569 },
    popularForStudents: false,
    nearUniversities: [],
  },
  {
    id: 'area-downtown',
    cityId: 'city-cairo',
    nameAr: 'وسط البلد',
    nameEn: 'Downtown',
    postalCode: '11511',
    coordinates: { lat: 30.0488, lng: 31.2404 },
    popularForStudents: true,
    nearUniversities: ['univ-cairo', 'univ-ain-shams'],
  },
  {
    id: 'area-tagamoa-5th',
    cityId: 'city-new-cairo',
    nameAr: 'التجمع الخامس',
    nameEn: '5th Settlement',
    postalCode: '11835',
    coordinates: { lat: 30.0074, lng: 31.4422 },
    popularForStudents: true,
    nearUniversities: ['univ-guc', 'univ-auc'],
  },

  // Alexandria Areas
  {
    id: 'area-shatby',
    cityId: 'city-alexandria',
    nameAr: 'الشاطبي',
    nameEn: 'Shatby',
    postalCode: '21515',
    coordinates: { lat: 31.2095, lng: 29.9152 },
    popularForStudents: true,
    nearUniversities: ['univ-alexandria'],
  },
  {
    id: 'area-smouha',
    cityId: 'city-alexandria',
    nameAr: 'سموحة',
    nameEn: 'Smouha',
    postalCode: '21615',
    coordinates: { lat: 31.2155, lng: 29.9535 },
    popularForStudents: true,
    nearUniversities: ['univ-alexandria'],
  },
  {
    id: 'area-camp-caesar',
    cityId: 'city-alexandria',
    nameAr: 'كامب شيزار',
    nameEn: 'Camp Caesar',
    postalCode: '21523',
    coordinates: { lat: 31.2144, lng: 29.9234 },
    popularForStudents: true,
    nearUniversities: ['univ-alexandria'],
  },

  // Mansoura Areas
  {
    id: 'area-mansoura-univ-district',
    cityId: 'city-mansoura',
    nameAr: 'حي الجامعة',
    nameEn: 'University District',
    postalCode: '35516',
    coordinates: { lat: 31.0435, lng: 31.3562 },
    popularForStudents: true,
    nearUniversities: ['univ-mansoura'],
  },
  {
    id: 'area-galaa',
    cityId: 'city-mansoura',
    nameAr: 'شارع الجلاء',
    nameEn: 'Galaa Street',
    postalCode: '35511',
    coordinates: { lat: 31.0368, lng: 31.3654 },
    popularForStudents: true,
    nearUniversities: ['univ-mansoura'],
  },

  // Assiut Areas
  {
    id: 'area-assiut-univ-district',
    cityId: 'city-assiut',
    nameAr: 'منطقة جامعة أسيوط',
    nameEn: 'Assiut University District',
    postalCode: '71515',
    coordinates: { lat: 27.1865, lng: 31.1731 },
    popularForStudents: true,
    nearUniversities: ['univ-assiut'],
  },
  {
    id: 'area-al-zahraa',
    cityId: 'city-assiut',
    nameAr: 'حي الزهراء',
    nameEn: 'Al-Zahraa',
    postalCode: '71511',
    coordinates: { lat: 27.1912, lng: 31.1895 },
    popularForStudents: true,
    nearUniversities: ['univ-assiut'],
  },
];
