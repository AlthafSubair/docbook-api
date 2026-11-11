import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import { UpdatePatientDto } from './dto/update-patient.dto.js';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  /**
   * List all non-deleted patients associated with the authenticated account's phone number.
   */
  async findAllByPhone(phone: string): Promise<Patient[]> {
    return this.patientRepository.find({
      where: { phone },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Find a single patient by ID ensuring it belongs to the authenticated account's phone.
   */
  async findOne(phone: string, patientId: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { patientId, phone },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${patientId} not found under this account`,
      );
    }

    return patient;
  }

  /**
   * Add a new patient profile associated with the authenticated phone number.
   */
  async create(phone: string, dto: CreatePatientDto): Promise<Patient> {
    const patient = this.patientRepository.create({
      phone,
      fullName: dto.fullName,
      email: dto.email ?? null,
      dob: dto.dob ?? null,
      sex: dto.sex ?? null,
    });

    return this.patientRepository.save(patient);
  }

  /**
   * Update an existing patient profile belonging to the authenticated phone number.
   */
  async update(
    phone: string,
    patientId: string,
    dto: UpdatePatientDto,
  ): Promise<Patient> {
    const patient = await this.findOne(phone, patientId);

    if (dto.fullName !== undefined) patient.fullName = dto.fullName;
    if (dto.email !== undefined) patient.email = dto.email ?? null;
    if (dto.dob !== undefined) patient.dob = dto.dob ?? null;
    if (dto.sex !== undefined) patient.sex = dto.sex ?? null;

    return this.patientRepository.save(patient);
  }

  /**
   * Soft-delete a patient profile belonging to the authenticated phone number.
   */
  async remove(phone: string, patientId: string): Promise<{ message: string }> {
    const patient = await this.findOne(phone, patientId);

    await this.patientRepository.softRemove(patient);

    return {
      message: `Patient profile '${patient.fullName}' successfully removed`,
    };
  }
}
