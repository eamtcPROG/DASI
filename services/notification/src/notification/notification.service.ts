import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type SendEmailDto = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: Transporter | null = null;
  private readonly isPreview: boolean;

  constructor(private readonly config: ConfigService) {
    this.isPreview = this.config.get<boolean>('smtp.preview') ?? false;
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.config.get<string>('smtp.host');
    const port = this.config.get<number>('smtp.port') ?? 587;
    const secure = this.config.get<boolean>('smtp.secure') ?? false;
    const user = this.config.get<string>('smtp.user');
    const pass = this.config.get<string>('smtp.pass');

    if (!host) {
      this.logger.warn(
        'SMTP_HOST is not configured — emails will be logged only (preview mode)',
      );
      this.isPreview && void this.createEtherealTransporter();
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    this.logger.log(`SMTP transporter ready: ${host}:${port}`);
  }

  private async createEtherealTransporter() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.log(
        `Ethereal test account created: ${testAccount.user} — preview emails at https://ethereal.email`,
      );
    } catch {
      this.logger.warn('Could not create Ethereal test account');
    }
  }

  async sendEmail(dto: SendEmailDto): Promise<void> {
    const from = this.config.get<string>('smtp.from') ?? 'DASI <no-reply@dasi.app>';

    if (!this.transporter) {
      this.logger.log(
        `[EMAIL PREVIEW] To: ${dto.to} | Subject: ${dto.subject}\n${dto.text ?? dto.html}`,
      );
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to: dto.to,
        subject: dto.subject,
        html: dto.html,
        text: dto.text,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`Email sent. Preview: ${previewUrl}`);
      } else {
        this.logger.log(`Email sent to ${dto.to}: ${info.messageId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${dto.to}`, error);
      throw error;
    }
  }
}
