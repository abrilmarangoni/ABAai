import { Controller, Post, Body, UseGuards, Request, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService, AuthResponse } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginData: { email: string; password: string }): Promise<AuthResponse> {
    const result = await this.authService.validateUser(loginData.email, loginData.password);
    if (!result) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return result;
  }

  @Post('register')
  async register(@Body() registerData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
    businessType: string;
  }): Promise<AuthResponse> {
    return this.authService.registerTenant({
      tenantName: registerData.businessName,
      ownerEmail: registerData.email,
      ownerPassword: registerData.password,
      ownerFirstName: registerData.firstName,
      ownerLastName: registerData.lastName,
    });
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }
}