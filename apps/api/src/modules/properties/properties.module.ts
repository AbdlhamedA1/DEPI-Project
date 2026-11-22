import { Module, forwardRef } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { UnitsModule } from '../units/units.module';
import { RoomsModule } from '../rooms/rooms.module';
import { BedsModule } from '../beds/beds.module';
import { PricingModule } from '../pricing/pricing.module';
import { AvailabilityModule } from '../availability/availability.module';
import { AdminModule } from '../admin/admin.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    UnitsModule,
    RoomsModule,
    BedsModule,
    PricingModule,
    AvailabilityModule,
    AdminModule,
    DatabaseModule,
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
