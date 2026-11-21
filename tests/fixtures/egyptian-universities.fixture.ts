/**
 * Egyptian Universities Fixture
 * Exact main campus geocoordinates, city/governorate linkage, faculties, and metadata.
 * Authoritative coordinate reference:
 * - Cairo University (Giza Main Campus): 30.0276, 31.2089
 * - Ain Shams University (Abbassia Campus): 30.0763, 31.2858
 * - Alexandria University (Shatby Campus): 31.2089, 29.9142
 * - Mansoura University (Mansoura Campus): 31.0425, 31.3547
 * - Assiut University (Assiut Main Campus): 27.1857, 31.1718
 */

export type UniversityType = 'PUBLIC' | 'PRIVATE' | 'AL_AZHAR' | 'NATIONAL';

export interface UniversityFixture {
  id: string;
  nameAr: string;
  nameEn: string;
  cityId: string;
  type: UniversityType;
  mainCampusCoordinates: {
    lat: number;
    lng: number;
  };
  addressAr: string;
  addressEn: string;
  popularFaculties: string[];
}

export const EGYPTIAN_UNIVERSITIES: UniversityFixture[] = [
  {
    id: 'univ-cairo',
    nameAr: 'جامعة القاهرة',
    nameEn: 'Cairo University',
    cityId: 'city-giza',
    type: 'PUBLIC',
    mainCampusCoordinates: {
      lat: 30.0276,
      lng: 31.2089,
    },
    addressAr: 'شارع جامعة القاهرة، الجيزة',
    addressEn: 'Cairo University St, Giza',
    popularFaculties: [
      'Engineering',
      'Medicine',
      'Economics & Political Science',
      'Commerce',
      'Law',
      'Arts',
    ],
  },
  {
    id: 'univ-ain-shams',
    nameAr: 'جامعة عين شمس',
    nameEn: 'Ain Shams University',
    cityId: 'city-cairo',
    type: 'PUBLIC',
    mainCampusCoordinates: {
      lat: 30.0763,
      lng: 31.2858,
    },
    addressAr: 'العباسية، القاهرة',
    addressEn: 'Abbassia, Cairo',
    popularFaculties: ['Engineering', 'Medicine', 'Pharmacy', 'Commerce', 'Computer Science'],
  },
  {
    id: 'univ-alexandria',
    nameAr: 'جامعة الإسكندرية',
    nameEn: 'Alexandria University',
    cityId: 'city-alexandria',
    type: 'PUBLIC',
    mainCampusCoordinates: {
      lat: 31.2089,
      lng: 29.9142,
    },
    addressAr: 'طريق الجيش، الشاطبي، الإسكندرية',
    addressEn: 'El-Gaish Road, Shatby, Alexandria',
    popularFaculties: ['Engineering', 'Medicine', 'Science', 'Law', 'Commerce'],
  },
  {
    id: 'univ-mansoura',
    nameAr: 'جامعة المنصورة',
    nameEn: 'Mansoura University',
    cityId: 'city-mansoura',
    type: 'PUBLIC',
    mainCampusCoordinates: {
      lat: 31.0425,
      lng: 31.3547,
    },
    addressAr: 'شارع الجمهورية، المنصورة، الدقهلية',
    addressEn: 'El Gomhouria St, Mansoura, Dakahlia',
    popularFaculties: ['Medicine', 'Engineering', 'Dentistry', 'Pharmacy', 'Nursing'],
  },
  {
    id: 'univ-assiut',
    nameAr: 'جامعة أسيوط',
    nameEn: 'Assiut University',
    cityId: 'city-assiut',
    type: 'PUBLIC',
    mainCampusCoordinates: {
      lat: 27.1857,
      lng: 31.1718,
    },
    addressAr: 'شارع الجامعة، أسيوط',
    addressEn: 'University St, Assiut',
    popularFaculties: ['Medicine', 'Engineering', 'Agriculture', 'Veterinary Medicine', 'Science'],
  },
  {
    id: 'univ-helwan',
    nameAr: 'جامعة حلوان',
    nameEn: 'Helwan University',
    cityId: 'city-cairo',
    type: 'PUBLIC',
    mainCampusCoordinates: {
      lat: 29.8667,
      lng: 31.3167,
    },
    addressAr: 'عين حلوان، حلوان، القاهرة',
    addressEn: 'Ain Helwan, Helwan, Cairo',
    popularFaculties: ['Fine Arts', 'Applied Arts', 'Engineering', 'Physical Education'],
  },
  {
    id: 'univ-azhar',
    nameAr: 'جامعة الأزهر',
    nameEn: 'Al-Azhar University',
    cityId: 'city-cairo',
    type: 'AL_AZHAR',
    mainCampusCoordinates: {
      lat: 30.0571,
      lng: 31.3189,
    },
    addressAr: 'طريق النصر، مدينة نصر، القاهرة',
    addressEn: 'El-Nasr Road, Nasr City, Cairo',
    popularFaculties: ['Islamic Studies', 'Medicine', 'Engineering', 'Arabic Language'],
  },
  {
    id: 'univ-guc',
    nameAr: 'الجامعة الألمانية بالقاهرة',
    nameEn: 'German University in Cairo (GUC)',
    cityId: 'city-new-cairo',
    type: 'PRIVATE',
    mainCampusCoordinates: {
      lat: 29.9869,
      lng: 31.4414,
    },
    addressAr: 'التجمع الخامس، القاهرة الجديدة',
    addressEn: '5th Settlement, New Cairo',
    popularFaculties: [
      'Engineering & Materials Science',
      'Information Engineering & Tech',
      'Management',
    ],
  },
  {
    id: 'univ-auc',
    nameAr: 'الجامعة الأمريكية بالقاهرة',
    nameEn: 'American University in Cairo (AUC)',
    cityId: 'city-new-cairo',
    type: 'PRIVATE',
    mainCampusCoordinates: {
      lat: 30.0197,
      lng: 31.4994,
    },
    addressAr: 'ميدان الجامعة الأمريكية، القاهرة الجديدة',
    addressEn: 'AUC Avenue, New Cairo',
    popularFaculties: ['Business', 'Global Affairs', 'Sciences & Engineering', 'Humanities'],
  },
  {
    id: 'univ-must',
    nameAr: 'جامعة مصر للعلوم والتكنولوجيا',
    nameEn: 'Misr University for Science and Technology (MUST)',
    cityId: 'city-6th-october',
    type: 'PRIVATE',
    mainCampusCoordinates: {
      lat: 29.9744,
      lng: 30.9572,
    },
    addressAr: 'المحور المركزي، السادس من أكتوبر',
    addressEn: 'Central Axis, 6th of October',
    popularFaculties: [
      'Medicine',
      'Dentistry',
      'Pharmacy',
      'Engineering',
      'Applied Medical Sciences',
    ],
  },
];
