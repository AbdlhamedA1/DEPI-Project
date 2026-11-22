import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VerifiedOwnerGuard } from '../../common/guards/verified-owner.guard';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all published properties with optional filtering' })
  findAll(@Query() query: any) {
    return this.propertiesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full public property profile by ID' })
  findById(@Param('id') id: string) {
    return this.propertiesService.findById(id);
  }

  @Get(':id/hierarchy')
  @ApiOperation({ summary: 'Get accommodation hierarchy tree with computed partial availability' })
  getHierarchy(@Param('id') id: string) {
    return this.propertiesService.getHierarchy(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, VerifiedOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new property listing (restricted to verified owners/admins)' })
  create(@Req() req: any, @Body() body: any) {
    return this.propertiesService.create(req.user, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update property listing (resets to PENDING_APPROVAL on significant edits)',
  })
  update(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    return this.propertiesService.update(id, req.user, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive/delete property listing' })
  delete(@Param('id') id: string) {
    return this.propertiesService.delete(id);
  }

  @Post(':id/upload-signature')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate signed upload signature for direct Cloudinary uploads' })
  getUploadSignature(@Param('id') id: string) {
    return this.propertiesService.generateUploadSignature(id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Attach uploaded photo to listing gallery, enforcing single cover photo',
  })
  attachImage(@Param('id') id: string, @Body() body: any) {
    return this.propertiesService.attachImage(id, body);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete photo from property gallery' })
  deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.propertiesService.deleteImage(id, imageId);
  }
}
