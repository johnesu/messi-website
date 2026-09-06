import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundError } from '../../common/errors/app-error';
import type { AddressDto } from '@mesi/types';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<AddressDto[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return addresses.map((a) => this.toDto(a));
  }

  async create(
    userId: string,
    input: {
      firstName: string;
      lastName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string | null;
      city: string;
      state: string;
      postalCode?: string | null;
      country?: string;
      isDefault?: boolean;
    },
  ) {
    const count = await this.prisma.address.count({ where: { userId } });
    const isDefault = input.isDefault ?? count === 0;
    const existing = await this.prisma.address.findFirst({ where: { userId, isDefault: true } });
    if (isDefault && existing) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    const address = await this.prisma.address.create({
      data: {
        userId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 ?? null,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode ?? null,
        country: input.country ?? 'Nigeria',
        isDefault,
      },
    });
    return this.toDto(address);
  }

  async update(
    userId: string,
    id: string,
    input: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      addressLine1: string;
      addressLine2: string | null;
      city: string;
      state: string;
      postalCode: string | null;
      country: string;
      isDefault: boolean;
    }>,
  ) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundError('ADDRESS_NOT_FOUND', 'Address not found');

    if (input.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.address.update({
      where: { id },
      data: {
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.addressLine1 !== undefined ? { addressLine1: input.addressLine1 } : {}),
        ...(input.addressLine2 !== undefined ? { addressLine2: input.addressLine2 } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.state !== undefined ? { state: input.state } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
      },
    });
    return this.toDto(updated);
  }

  async remove(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundError('ADDRESS_NOT_FOUND', 'Address not found');
    await this.prisma.address.delete({ where: { id } });
    return { id };
  }

  private toDto(a: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string | null;
    country: string;
    isDefault: boolean;
  }): AddressDto {
    return {
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      phone: a.phone,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2,
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
    };
  }
}
