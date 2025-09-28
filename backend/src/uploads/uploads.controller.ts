import { Controller, Post, Get, Delete, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('comprobante')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload payment receipt' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  uploadComprobante(@UploadedFile() file: Express.Multer.File, @Request() req) {
    return this.uploadsService.uploadFile(file, req.user.tenantId);
  }

  @Get(':fileName')
  @ApiOperation({ summary: 'Get upload URL' })
  @ApiResponse({ status: 200, description: 'Upload URL retrieved successfully' })
  getUploadUrl(@Param('fileName') fileName: string, @Request() req) {
    return this.uploadsService.getUploadUrl(fileName, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete upload' })
  @ApiResponse({ status: 200, description: 'Upload deleted successfully' })
  deleteUpload(@Param('id') id: string, @Request() req) {
    return this.uploadsService.deleteUpload(id, req.user.tenantId);
  }
}
