import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  tenantId: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    tenantId: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { email, isActive: true },
      include: { tenant: true },
    });

    if (!user || !user.tenant.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async registerTenant(data: {
    tenantName: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerFirstName?: string;
    ownerLastName?: string;
  }): Promise<AuthResponse> {
    // Check if tenant already exists
    const existingTenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { name: data.tenantName },
          { users: { some: { email: data.ownerEmail } } },
        ],
      },
    });

    if (existingTenant) {
      throw new UnauthorizedException('Tenant or email already exists');
    }

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.tenantName,
      },
    });

    // Hash password
    const passwordHash = await bcrypt.hash(data.ownerPassword, 10);

    // Create owner user
    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: data.ownerEmail,
        passwordHash,
        role: 'OWNER',
        firstName: data.ownerFirstName,
        lastName: data.ownerLastName,
      },
    });

    // Return login response
    return this.login({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  }

  async validateJwtPayload(payload: JwtPayload): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { tenant: true },
    });

    if (!user || !user.isActive || !user.tenant.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
