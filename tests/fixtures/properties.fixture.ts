/**
 * Egyptian Properties Fixture
 * Hierarchical Accommodations (Building -> Unit -> Room -> Bed)
 * EGP Currency Pricing, Itemized Mandatory/Optional Expenses, Cloudinary Media Assets,
 * and Multi-Unit Availability Configurations.
 */

export type PropertyType = 'BUILDING' | 'APARTMENT' | 'ROOM' | 'BED';
export type GenderPolicy = 'MALE_ONLY' | 'FEMALE_ONLY' | 'MIXED_FAMILY';
export type PricingUnit = 'PER_PERSON' | 'PER_BED' | 'PER_ROOM' | 'PER_UNIT';
export type DurationUnit = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEMESTER' | 'YEARLY';
export type ListingApprovalStatus =
  'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface ExpenseItemFixture {
  id: string;
  nameAr: string;
  nameEn: string;
  amount: number;
  currency: 'EGP';
  isMandatory: boolean;
  isRecurring: boolean;
  recurringPeriod?: 'MONTHLY' | 'SEMESTER' | 'YEARLY';
}

export interface MediaAssetFixture {
  id: string;
  url: string;
  publicId: string;
  isCover: boolean;
  captionAr?: string;
  captionEn?: string;
  width: number;
  height: number;
}

export interface BedFixture {
  id: string;
  roomId: string;
  bedNumber: number;
  label: string;
  isAvailable: boolean;
  pricePerMonthEgp: number;
  durationUnit: DurationUnit;
  pricingUnit: PricingUnit;
  bookedByStudentId?: string;
}

export interface RoomFixture {
  id: string;
  unitId: string;
  roomNumber: string;
  type: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUADRUPLE';
  isAvailable: boolean;
  pricePerMonthEgp: number;
  durationUnit: DurationUnit;
  pricingUnit: PricingUnit;
  hasPrivateBathroom: boolean;
  hasBalcony: boolean;
  beds: BedFixture[];
}

export interface UnitFixture {
  id: string;
  propertyId: string;
  unitNumber: string;
  floorNumber: number;
  type: 'APARTMENT' | 'STUDIO';
  isAvailable: boolean;
  entireUnitPricePerMonthEgp?: number;
  durationUnit: DurationUnit;
  pricingUnit: PricingUnit;
  bathroomsCount: number;
  kitchensCount: number;
  rooms: RoomFixture[];
}

export interface PropertyListingFixture {
  id: string;
  providerId: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  propertyType: PropertyType;
  genderPolicy: GenderPolicy;
  governorateId: string;
  cityId: string;
  areaId: string;
  exactAddressAr: string;
  exactAddressEn: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  nearUniversityId: string;
  approvalStatus: ListingApprovalStatus;
  isActive: boolean;
  isVerified: boolean;
  basePriceEgp: number;
  pricingUnit: PricingUnit;
  durationUnit: DurationUnit;
  itemizedExpenses: ExpenseItemFixture[];
  mediaAssets: MediaAssetFixture[];
  units: UnitFixture[];
  amenities: string[];
  rulesAr: string[];
  rulesEn: string[];
  createdAt: string;
}

export const TEST_PROPERTIES: PropertyListingFixture[] = [
  // 1. Dokki Multi-Unit Student Building (Near Cairo University - ~1.2 km)
  {
    id: 'prop-dokki-building',
    providerId: 'provider-mohamed-owner',
    titleAr: 'عمارة الصفوة لسكن الطلاب - الدقي',
    titleEn: 'Al-Safwa Student Residence Dokki',
    descriptionAr: 'مبنى سكني هادئ مخصص للطلاب الذكور بالقرب من جامعة القاهرة ومحطة مترو الدقي.',
    descriptionEn:
      'Quiet student residence building for male students near Cairo University and Dokki metro station.',
    propertyType: 'BUILDING',
    genderPolicy: 'MALE_ONLY',
    governorateId: 'gov-giza',
    cityId: 'city-giza',
    areaId: 'area-dokki',
    exactAddressAr: '١٤ شارع التحرير، ميدان الدقي، الجيزة',
    exactAddressEn: '14 El-Tahrir Street, Dokki Square, Giza',
    coordinates: {
      lat: 30.0385,
      lng: 31.2124,
    },
    nearUniversityId: 'univ-cairo',
    approvalStatus: 'APPROVED',
    isActive: true,
    isVerified: true,
    basePriceEgp: 2200,
    pricingUnit: 'PER_BED',
    durationUnit: 'MONTHLY',
    amenities: ['High-Speed WiFi', 'Elevator', 'Washing Machine', 'Study Hall', 'Security 24/7'],
    rulesAr: ['ممنوع التدخين داخل الغرف', 'الهدوء بعد الساعة ١١ مساءً', 'ممنوع استضافة غير الطلاب'],
    rulesEn: [
      'No smoking inside rooms',
      'Quiet hours after 11 PM',
      'No non-student guests overnight',
    ],
    itemizedExpenses: [
      {
        id: 'exp-dokki-util',
        nameAr: 'استهلاك كهرباء ومياه وغاز',
        nameEn: 'Electricity, Water & Gas Utilities',
        amount: 250,
        currency: 'EGP',
        isMandatory: true,
        isRecurring: true,
        recurringPeriod: 'MONTHLY',
      },
      {
        id: 'exp-dokki-deposit',
        nameAr: 'تأمين استردادي',
        nameEn: 'Refundable Security Deposit',
        amount: 1500,
        currency: 'EGP',
        isMandatory: true,
        isRecurring: false,
      },
      {
        id: 'exp-dokki-cleaning',
        nameAr: 'خدمة نظافة أسبوعية للغرفة',
        nameEn: 'Optional Weekly Room Cleaning',
        amount: 200,
        currency: 'EGP',
        isMandatory: false,
        isRecurring: true,
        recurringPeriod: 'MONTHLY',
      },
    ],
    mediaAssets: [
      {
        id: 'media-dokki-01',
        url: 'https://res.cloudinary.com/studenthousing-eg/image/upload/v1/properties/dokki_main_facade.jpg',
        publicId: 'properties/dokki_main_facade',
        isCover: true,
        captionAr: 'واجهة المبنى الرئيسية',
        captionEn: 'Main building exterior view',
        width: 1920,
        height: 1080,
      },
      {
        id: 'media-dokki-02',
        url: 'https://res.cloudinary.com/studenthousing-eg/image/upload/v1/properties/dokki_room_single.jpg',
        publicId: 'properties/dokki_room_single',
        isCover: false,
        captionAr: 'غرفة فردية مفروشة ومجهزة بمكتب',
        captionEn: 'Single furnished study room with desk',
        width: 1920,
        height: 1080,
      },
      {
        id: 'media-dokki-03',
        url: 'https://res.cloudinary.com/studenthousing-eg/image/upload/v1/properties/dokki_shared_kitchen.jpg',
        publicId: 'properties/dokki_shared_kitchen',
        isCover: false,
        captionAr: 'المطبخ المشترك المجهز بالكامل',
        captionEn: 'Fully equipped shared kitchen',
        width: 1920,
        height: 1080,
      },
    ],
    units: [
      // Unit 101: 3-Bedroom Shared Apartment
      {
        id: 'unit-dokki-101',
        propertyId: 'prop-dokki-building',
        unitNumber: '101',
        floorNumber: 1,
        type: 'APARTMENT',
        isAvailable: true,
        entireUnitPricePerMonthEgp: 7500,
        durationUnit: 'MONTHLY',
        pricingUnit: 'PER_UNIT',
        bathroomsCount: 2,
        kitchensCount: 1,
        rooms: [
          {
            id: 'room-dokki-101-a',
            unitId: 'unit-dokki-101',
            roomNumber: '101-A',
            type: 'SINGLE',
            isAvailable: true,
            pricePerMonthEgp: 3500,
            durationUnit: 'MONTHLY',
            pricingUnit: 'PER_ROOM',
            hasPrivateBathroom: true,
            hasBalcony: true,
            beds: [
              {
                id: 'bed-dokki-101-a1',
                roomId: 'room-dokki-101-a',
                bedNumber: 1,
                label: 'Bed 1 (Single Room)',
                isAvailable: true,
                pricePerMonthEgp: 3500,
                durationUnit: 'MONTHLY',
                pricingUnit: 'PER_BED',
              },
            ],
          },
          {
            id: 'room-dokki-101-b',
            unitId: 'unit-dokki-101',
            roomNumber: '101-B',
            type: 'DOUBLE',
            isAvailable: true,
            pricePerMonthEgp: 4400,
            durationUnit: 'MONTHLY',
            pricingUnit: 'PER_ROOM',
            hasPrivateBathroom: false,
            hasBalcony: false,
            beds: [
              {
                id: 'bed-dokki-101-b1',
                roomId: 'room-dokki-101-b',
                bedNumber: 1,
                label: 'Bed 1 (Window side)',
                isAvailable: true,
                pricePerMonthEgp: 2200,
                durationUnit: 'MONTHLY',
                pricingUnit: 'PER_BED',
              },
              {
                id: 'bed-dokki-101-b2',
                roomId: 'room-dokki-101-b',
                bedNumber: 2,
                label: 'Bed 2 (Door side)',
                isAvailable: true,
                pricePerMonthEgp: 2200,
                durationUnit: 'MONTHLY',
                pricingUnit: 'PER_BED',
              },
            ],
          },
          {
            id: 'room-dokki-101-c',
            unitId: 'unit-dokki-101',
            roomNumber: '101-C',
            type: 'TRIPLE',
            isAvailable: true,
            pricePerMonthEgp: 5400,
            durationUnit: 'MONTHLY',
            pricingUnit: 'PER_ROOM',
            hasPrivateBathroom: false,
            hasBalcony: true,
            beds: [
              {
                id: 'bed-dokki-101-c1',
                roomId: 'room-dokki-101-c',
                bedNumber: 1,
                label: 'Bed 1 (Balcony side)',
                isAvailable: true,
                pricePerMonthEgp: 1800,
                durationUnit: 'MONTHLY',
                pricingUnit: 'PER_BED',
              },
              {
                id: 'bed-dokki-101-c2',
                roomId: 'room-dokki-101-c',
                bedNumber: 2,
                label: 'Bed 2 (Middle)',
                isAvailable: true,
                pricePerMonthEgp: 1800,
                durationUnit: 'MONTHLY',
                pricingUnit: 'PER_BED',
              },
              {
                id: 'bed-dokki-101-c3',
                roomId: 'room-dokki-101-c',
                bedNumber: 3,
                label: 'Bed 3 (Wall side)',
                isAvailable: true,
                pricePerMonthEgp: 1800,
                durationUnit: 'MONTHLY',
                pricingUnit: 'PER_BED',
              },
            ],
          },
        ],
      },
    ],
    createdAt: '2026-08-18T10:00:00Z',
  },

  // 2. Nasr City Standalone Female Apartment (Near Al-Azhar & Ain Shams - ~2.5 km)
  {
    id: 'prop-nasr-city-flat',
    providerId: 'provider-tarek-agent',
    titleAr: 'شقة فاخرة طالبات - الحي السابع مدينة نصر',
    titleEn: 'Deluxe Female Student Apartment - 7th District Nasr City',
    descriptionAr:
      'شقة مفروشة بالكامل ومجهزة خصيصاً لطالبات الجامعات (عين شمس والأزهر)، أمن وهدوء تام.',
    descriptionEn:
      'Fully furnished apartment dedicated for female students near Ain Shams and Al-Azhar Universities.',
    propertyType: 'APARTMENT',
    genderPolicy: 'FEMALE_ONLY',
    governorateId: 'gov-cairo',
    cityId: 'city-cairo',
    areaId: 'area-nasr-city',
    exactAddressAr: '٢٢ شارع الطيران، الحي السابع، مدينة نصر، القاهرة',
    exactAddressEn: '22 El-Tayaran St, 7th District, Nasr City, Cairo',
    coordinates: {
      lat: 30.0561,
      lng: 31.3301,
    },
    nearUniversityId: 'univ-ain-shams',
    approvalStatus: 'APPROVED',
    isActive: true,
    isVerified: true,
    basePriceEgp: 2600,
    pricingUnit: 'PER_BED',
    durationUnit: 'MONTHLY',
    amenities: ['WiFi', 'Air Conditioning', 'Natural Gas', 'Balcony', 'Intercom'],
    rulesAr: ['سكن طالبات فقط', 'ممنوع التدخين تماماً', 'المواعيد حتى ١٠ مساءً'],
    rulesEn: ['Female students only', 'Strictly no smoking', 'Curfew 10 PM'],
    itemizedExpenses: [
      {
        id: 'exp-nasr-wifi',
        nameAr: 'اشتراك إنترنت فائق السرعة',
        nameEn: 'High-speed Fiber WiFi',
        amount: 150,
        currency: 'EGP',
        isMandatory: true,
        isRecurring: true,
        recurringPeriod: 'MONTHLY',
      },
      {
        id: 'exp-nasr-deposit',
        nameAr: 'تأمين تلفيات مسترد',
        nameEn: 'Refundable Damage Deposit',
        amount: 2000,
        currency: 'EGP',
        isMandatory: true,
        isRecurring: false,
      },
    ],
    mediaAssets: [
      {
        id: 'media-nasr-01',
        url: 'https://res.cloudinary.com/studenthousing-eg/image/upload/v1/properties/nasr_living_room.jpg',
        publicId: 'properties/nasr_living_room',
        isCover: true,
        captionAr: 'غرفة المعيشة المشتركة',
        captionEn: 'Shared living room',
        width: 1920,
        height: 1080,
      },
      {
        id: 'media-nasr-02',
        url: 'https://res.cloudinary.com/studenthousing-eg/image/upload/v1/properties/nasr_bedroom.jpg',
        publicId: 'properties/nasr_bedroom',
        isCover: false,
        captionAr: 'غرفة نوم مزدوجة مشمسة',
        captionEn: 'Sunny double bedroom',
        width: 1920,
        height: 1080,
      },
    ],
    units: [
      {
        id: 'unit-nasr-flat-01',
        propertyId: 'prop-nasr-city-flat',
        unitNumber: 'Flat 4B',
        floorNumber: 4,
        type: 'APARTMENT',
        isAvailable: true,
        entireUnitPricePerMonthEgp: 5200,
        durationUnit: 'MONTHLY',
        pricingUnit: 'PER_UNIT',
        bathroomsCount: 1,
        kitchensCount: 1,
        rooms: [
          {
            id: 'room-nasr-flat-r1',
            unitId: 'unit-nasr-flat-01',
            roomNumber: 'R1',
            type: 'DOUBLE',
            isAvailable: true,
            pricePerMonthEgp: 5200,
            durationUnit: 'MONTHLY',
            pricingUnit: 'PER_ROOM',
            hasPrivateBathroom: false,
            hasBalcony: true,
            beds: [
              {
                id: 'bed-nasr-r1-b1',
                roomId: 'room-nasr-flat-r1',
                bedNumber: 1,
                label: 'Bed 1 (Left)',
                isAvailable: true,
                pricePerMonthEgp: 2600,
                durationUnit: 'MONTHLY',
                pricingUnit: 'PER_BED',
              },
              {
                id: 'bed-nasr-r1-b2',
                roomId: 'room-nasr-flat-r1',
                bedNumber: 2,
                label: 'Bed 2 (Right)',
                isAvailable: true,
                pricePerMonthEgp: 2600,
                durationUnit: 'MONTHLY',
                pricingUnit: 'PER_BED',
              },
            ],
          },
        ],
      },
    ],
    createdAt: '2026-08-22T14:00:00Z',
  },

  // 3. Alexandria Shatby Student Villa (Near Alexandria University - ~0.4 km)
  {
    id: 'prop-shatby-villa',
    providerId: 'provider-nile-company',
    titleAr: 'سكن النيل الفندقي للطلاب - الشاطبي الإسكندرية',
    titleEn: 'Nile Student Residence - Shatby Alexandria',
    descriptionAr: 'سكن فندقي متميز خطوات من مجمع كليات الشاطبي وجامعة الإسكندرية مع إطلالة بحرية.',
    descriptionEn:
      'Premium hotel-style student residence steps from Alexandria University Shatby campus with sea view.',
    propertyType: 'BUILDING',
    genderPolicy: 'FEMALE_ONLY',
    governorateId: 'gov-alexandria',
    cityId: 'city-alexandria',
    areaId: 'area-shatby',
    exactAddressAr: '٥ طريق الكورنيش، الشاطبي، الإسكندرية',
    exactAddressEn: '5 Corniche Road, Shatby, Alexandria',
    coordinates: {
      lat: 31.2095,
      lng: 29.9152,
    },
    nearUniversityId: 'univ-alexandria',
    approvalStatus: 'APPROVED',
    isActive: true,
    isVerified: true,
    basePriceEgp: 3200,
    pricingUnit: 'PER_BED',
    durationUnit: 'MONTHLY',
    amenities: ['Sea View', 'High-Speed WiFi', '24/7 Security', 'Elevator', 'Daily Cleaning'],
    rulesAr: ['ممنوع التدخين', 'سكن طالبات فقط'],
    rulesEn: ['No smoking', 'Female students only'],
    itemizedExpenses: [
      {
        id: 'exp-shatby-all-inclusive',
        nameAr: 'مصاريف خدمات وصيانة شاملة',
        nameEn: 'All-inclusive Services & Maintenance',
        amount: 300,
        currency: 'EGP',
        isMandatory: true,
        isRecurring: true,
        recurringPeriod: 'MONTHLY',
      },
    ],
    mediaAssets: [
      {
        id: 'media-shatby-01',
        url: 'https://res.cloudinary.com/studenthousing-eg/image/upload/v1/properties/shatby_sea_view.jpg',
        publicId: 'properties/shatby_sea_view',
        isCover: true,
        captionAr: 'إطلالة بحرية مباشرة من الغرف',
        captionEn: 'Direct sea view from bedrooms',
        width: 1920,
        height: 1080,
      },
    ],
    units: [
      {
        id: 'unit-shatby-u1',
        propertyId: 'prop-shatby-villa',
        unitNumber: 'Suite 201',
        floorNumber: 2,
        type: 'APARTMENT',
        isAvailable: true,
        durationUnit: 'MONTHLY',
        pricingUnit: 'PER_BED',
        bathroomsCount: 2,
        kitchensCount: 1,
        rooms: [
          {
            id: 'room-shatby-r1',
            unitId: 'unit-shatby-u1',
            roomNumber: '201-A',
            type: 'DOUBLE',
            isAvailable: true,
            pricePerMonthEgp: 6400,
            durationUnit: 'MONTHLY',
            pricingUnit: 'PER_ROOM',
            hasPrivateBathroom: true,
            hasBalcony: true,
            beds: [
              {
                id: 'bed-shatby-r1-b1',
                roomId: 'room-shatby-r1',
                bedNumber: 1,
                label: 'Bed 1 (Sea View)',
                isAvailable: true,
                pricePerMonthEgp: 3200,
                durationUnit: 'MONTHLY',
                pricingUnit: 'PER_BED',
              },
              {
                id: 'bed-shatby-r1-b2',
                roomId: 'room-shatby-r1',
                bedNumber: 2,
                label: 'Bed 2 (Side View)',
                isAvailable: true,
                pricePerMonthEgp: 3200,
                durationUnit: 'MONTHLY',
                pricingUnit: 'PER_BED',
              },
            ],
          },
        ],
      },
    ],
    createdAt: '2026-08-28T09:00:00Z',
  },

  // 4. Pending Approval Property (Submitted by verified owner, awaiting admin approval)
  {
    id: 'prop-pending-approval',
    providerId: 'provider-mohamed-owner',
    titleAr: 'شقة جديدة للطلاب - المهندسين',
    titleEn: 'New Student Apartment - Mohandessin',
    descriptionAr: 'شقة مفروشة حديثاً بفرش عصري في شارع جامعة الدول العربية.',
    descriptionEn: 'Newly furnished student flat on Gameat El-Dowal street.',
    propertyType: 'APARTMENT',
    genderPolicy: 'MALE_ONLY',
    governorateId: 'gov-giza',
    cityId: 'city-giza',
    areaId: 'area-mohandessin',
    exactAddressAr: '٥٠ شارع جامعة الدول العربية، المهندسين',
    exactAddressEn: '50 Gameat El-Dowal St, Mohandessin',
    coordinates: { lat: 30.0538, lng: 31.2001 },
    nearUniversityId: 'univ-cairo',
    approvalStatus: 'PENDING_APPROVAL',
    isActive: false,
    isVerified: false,
    basePriceEgp: 3000,
    pricingUnit: 'PER_BED',
    durationUnit: 'MONTHLY',
    amenities: ['WiFi', 'Air Conditioning'],
    rulesAr: ['ممنوع التدخين'],
    rulesEn: ['No smoking'],
    itemizedExpenses: [],
    mediaAssets: [
      {
        id: 'media-pending-01',
        url: 'https://res.cloudinary.com/studenthousing-eg/image/upload/v1/properties/pending_mohandessin.jpg',
        publicId: 'properties/pending_mohandessin',
        isCover: true,
        width: 1920,
        height: 1080,
      },
    ],
    units: [],
    createdAt: '2026-09-02T16:00:00Z',
  },
];
