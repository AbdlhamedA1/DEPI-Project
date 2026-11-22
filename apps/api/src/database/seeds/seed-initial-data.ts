import { seedLocationsAndUniversities, EGYPT_LOCATIONS_DATA } from './seed-locations-universities';

export async function seedInitialData(pool?: any) {
  console.log('Seeding initial Egyptian student housing platform reference data...');
  const locationsData = await seedLocationsAndUniversities(pool);

  return {
    seededGovernorates: locationsData.governorates.length,
    seededCities: locationsData.cities.length,
    seededUniversities: locationsData.universities.length,
    success: true,
  };
}

export { EGYPT_LOCATIONS_DATA };
