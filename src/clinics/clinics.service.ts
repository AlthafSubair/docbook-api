import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { Clinic } from './entities/clinic.entity.js';
import { User } from '../users/entities/user.entity.js';
import { UserRole } from '../users/enums/user.enums.js';
import { OnboardClinicDto } from './dto/onboard-clinic.dto.js';
import { UpdateClinicDto } from './dto/update-clinic.dto.js';
import { generateUniqueClinicSlug } from '../common/utils/slug.util.js';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Generates a URL-friendly, unique slug for a clinic.
   * Delegates to generateUniqueClinicSlug utility.
   */
  async generateUniqueSlug(
    name: string,
    customSlug?: string,
    manager?: EntityManager,
  ): Promise<string> {
    const repo = manager ? manager.getRepository(Clinic) : this.clinicRepository;
    return generateUniqueClinicSlug(repo, name, customSlug);
  }

  /**
   * Atomically onboards a new clinic and creates its primary administrator account.
   * Wrapped in a database transaction so that neither is created if an error occurs.
   */
  async onboard(dto: OnboardClinicDto) {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const userRepo = manager.getRepository(User);
      const clinicRepo = manager.getRepository(Clinic);

      // 1. Verify admin email is unique
      const existingUser = await userRepo.findOne({
        where: { email: dto.admin.email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictException(
          `User with email '${dto.admin.email}' already exists in the system`,
        );
      }

      // 2. Generate a unique clinic slug
      const slug = await generateUniqueClinicSlug(
        clinicRepo,
        dto.clinic.clinicName,
        dto.clinic.slug,
      );

      // 3. Create and persist Clinic
      const clinic = clinicRepo.create({
        clinicName: dto.clinic.clinicName,
        slug,
        clinicPhone: dto.clinic.clinicPhone,
        clinicEmail: dto.clinic.clinicEmail ?? null,
        address: dto.clinic.address ?? null,
        latitude: dto.clinic.latitude ?? null,
        longitude: dto.clinic.longitude ?? null,
        timezone: dto.clinic.timezone ?? 'Asia/Kolkata',
        isActive: true,
      });

      const savedClinic = await clinicRepo.save(clinic);

      // 4. Hash admin password with bcrypt
      const passwordHash = await bcrypt.hash(dto.admin.password, 10);

      // 5. Create and persist Clinic Admin User
      const admin = userRepo.create({
        clinicId: savedClinic.clinicId,
        fullName: dto.admin.fullName,
        role: UserRole.ADMIN,
        phone: dto.admin.phone ?? null,
        email: dto.admin.email.toLowerCase(),
        passwordHash,
        isActive: true,
        isEmailVerified: false,
        isPhoneVerified: false,
      });

      const savedAdmin = await userRepo.save(admin);

      // 6. Return sanitized response
      return {
        message: 'Clinic and primary admin account onboarded successfully',
        clinic: {
          clinicId: savedClinic.clinicId,
          clinicName: savedClinic.clinicName,
          slug: savedClinic.slug,
          clinicPhone: savedClinic.clinicPhone,
          clinicEmail: savedClinic.clinicEmail,
          address: savedClinic.address,
          timezone: savedClinic.timezone,
          createdAt: savedClinic.createdAt,
        },
        admin: {
          userId: savedAdmin.userId,
          fullName: savedAdmin.fullName,
          email: savedAdmin.email,
          phone: savedAdmin.phone,
          role: savedAdmin.role,
          createdAt: savedAdmin.createdAt,
        },
      };
    });
  }

  /**
   * List all clinics (for platform overview)
   */
  async findAll(): Promise<Clinic[]> {
    return this.clinicRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find a single clinic by its ID
   */
  async findOne(clinicId: string): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOne({
      where: { clinicId },
    });

    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    return clinic;
  }

  /**
   * Find a clinic by its public URL slug
   */
  async findBySlug(slug: string): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOne({
      where: { slug: slug.toLowerCase() },
    });

    if (!clinic) {
      throw new NotFoundException(`Clinic with slug '${slug}' not found`);
    }

    return clinic;
  }

  /**
   * Update clinic profile
   */
  async update(clinicId: string, dto: UpdateClinicDto): Promise<Clinic> {
    const clinic = await this.findOne(clinicId);

    if (dto.clinicName !== undefined) clinic.clinicName = dto.clinicName;
    if (dto.clinicPhone !== undefined) clinic.clinicPhone = dto.clinicPhone;
    if (dto.clinicEmail !== undefined)
      clinic.clinicEmail = dto.clinicEmail ?? null;
    if (dto.address !== undefined) clinic.address = dto.address ?? null;
    if (dto.latitude !== undefined) clinic.latitude = dto.latitude ?? null;
    if (dto.longitude !== undefined) clinic.longitude = dto.longitude ?? null;
    if (dto.timezone !== undefined)
      clinic.timezone = dto.timezone ?? 'Asia/Kolkata';

    return this.clinicRepository.save(clinic);
  }
}
