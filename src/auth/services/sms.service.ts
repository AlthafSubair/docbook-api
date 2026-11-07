import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
  }

  /**
   * Sends an OTP SMS to the patient's phone number.
   * In development, it logs the OTP to the console so developers can test easily.
   * In production, this method connects to an SMS gateway (e.g. Twilio, Fast2SMS, MSG91).
   */
  async sendOtp(phone: string, otp: string): Promise<void> {
    if (!this.isProduction) {
      this.logger.log('====================================================');
      this.logger.log(`[DEV SMS SIMULATION]`);
      this.logger.log(`To:   ${phone}`);
      this.logger.log(`Code: ${otp}`);
      this.logger.log(
        `Message: Your DocBook verification code is ${otp}. Valid for 5 minutes. Do not share this code.`,
      );
      this.logger.log('====================================================');
      return;
    }

    // TODO: Production SMS Gateway integration (Twilio / MSG91 / Fast2SMS / AWS SNS)
    this.logger.warn(
      `Production SMS gateway not configured yet. OTP for ${phone} was not dispatched externally.`,
    );
  }
}
