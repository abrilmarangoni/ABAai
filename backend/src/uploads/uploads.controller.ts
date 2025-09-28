import { Controller, Post, Get, Delete, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('comprobante')
  @UseInterceptors(FileInterceptor('file'))
  uploadComprobante(@UploadedFile() file: Express.Multer.File, @Request() req) {
    return this.uploadsService.uploadFile(file, req.user.tenantId);
  }

  @Get(':id')
  getUploadUrl(@Param('id') id: string, @Request() req) {
    return this.uploadsService.getUploadUrl(id, req.user.tenantId);
  }

  @Delete(':id')
  deleteUpload(@Param('id') id: string, @Request() req) {
    return this.uploadsService.deleteUpload(id, req.user.tenantId);
  }
}