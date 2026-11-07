import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PatientOtpVerification } from '../entities/patient-otp-verification.entity.js';
import { normalizePhoneNumber } from '../../common/utils/phone.util.js';
import {
  generateOtpCode,
  hashWithSecret,
  timingSafeCompare,
} from '../../common/utils/crypto.util.js';

@Injectable()
export class OtpService {
  private readonly expirationMinutes: number;
  private readonly resendCooldownSeconds: number;
  private readonly otpSecret: string;
  private readonly maxAttempts = 5;

  constructor(
    @InjectRepository(PatientOtpVerification)
    private readonly otpRepository: Repository<PatientOtpVerification>,
    private readonly configService: ConfigService,
  ) {
    this.expirationMinutes =
      this.configService.get<number>('otp.expirationMinutes') ?? 5;
    this.resendCooldownSeconds =
      this.configService.get<number>('otp.resendCooldownSeconds') ?? 60;
    this.otpSecret = this.configService.get<string>('otp.secret') ?? '';
  }

  /**
   * Generates a 6-digit secure OTP, verifies resend cooldown, hashes it,
   * stores the verification record in PostgreSQL, and returns the raw OTP for SMS dispatch.
   */
  async generateAndSaveOtp(
    country: string,
    number: string,
  ): Promise<{ phone: string; otp: string }> {
    const phone = normalizePhoneNumber(country, number);

    const existingOtp = await this.checkResendCooldown(phone);

    // If an unverified OTP already exists, invalidate it so only the new one works
    if (existingOtp && !existingOtp.verifiedAt) {
      existingOtp.expiresAt = new Date();
      await this.otpRepository.save(existingOtp);
    }

    const otp = generateOtpCode();
    const otpHash = hashWithSecret(otp, this.otpSecret);
    const expiresAt = new Date(Date.now() + this.expirationMinutes * 60 * 1000);

    const verificationRecord = this.otpRepository.create({
      phone,
      otpHash,
      expiresAt,
      attemptsCount: 0,
    });

    await this.otpRepository.save(verificationRecord);

    return { phone, otp };
  }

  /**
   * Verifies the submitted OTP against the latest active record in the database.
   * Enforces attempt limits, expiration, and replay prevention.
   */
  async verifyOtp(
    country: string,
    number: string,
    otp: string,
  ): Promise<{ phone: string }> {
    const phone = normalizePhoneNumber(country, number);

    const record = await this.otpRepository.findOne({
      where: {
        phone,
        verifiedAt: IsNull(),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (record.attemptsCount >= this.maxAttempts) {
      throw new BadRequestException(
        'Maximum verification attempts exceeded. Please request a new OTP.',
      );
    }

    if (new Date() > record.expiresAt) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const expectedHash = hashWithSecret(otp, this.otpSecret);
    const isMatch = timingSafeCompare(expectedHash, record.otpHash);

    if (!isMatch) {
      await this.otpRepository.increment(
        { otpId: record.otpId },
        'attemptsCount',
        1,
      );

      const remainingAttempts = this.maxAttempts - (record.attemptsCount + 1);
      if (remainingAttempts <= 0) {
        throw new BadRequestException(
          'Maximum verification attempts exceeded. Please request a new OTP.',
        );
      }

      throw new BadRequestException(
        `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
      );
    }

    // Mark OTP as verified (consumed) to prevent reuse
    record.verifiedAt = new Date();
    await this.otpRepository.save(record);

    return { phone };
  }

  /**
   * Ensures the user cannot spam OTP requests within the cooldown window.
   * Returns the latest OTP record if one exists.
   */
  private async checkResendCooldown(
    phone: string,
  ): Promise<PatientOtpVerification | null> {
    const latestOtp = await this.otpRepository.findOne({
      where: { phone },
      order: { createdAt: 'DESC' },
    });

    if (!latestOtp) {
      return null;
    }

    const elapsedSeconds =
      (Date.now() - new Date(latestOtp.createdAt).getTime()) / 1000;

    if (elapsedSeconds < this.resendCooldownSeconds) {
      const remainingSeconds = Math.ceil(
        this.resendCooldownSeconds - elapsedSeconds,
      );
      throw new BadRequestException(
        `Please wait ${remainingSeconds} second(s) before requesting a new OTP.`,
      );
    }

    return latestOtp;
  }
}
