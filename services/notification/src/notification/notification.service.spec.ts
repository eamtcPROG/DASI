import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import * as nodemailer from 'nodemailer';

jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

jest.mock('nodemailer');

const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

describe('NotificationService', () => {
  let service: NotificationService;

  const mockSendMail = jest.fn();
  const mockTransporter = { sendMail: mockSendMail };

  beforeEach(async () => {
    mockSendMail.mockReset();
    mockedNodemailer.createTransport.mockReturnValue(mockTransporter as never);
    mockedNodemailer.getTestMessageUrl.mockReturnValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, unknown> = {
                'smtp.host': 'smtp.test.com',
                'smtp.port': 587,
                'smtp.secure': false,
                'smtp.user': 'user@test.com',
                'smtp.pass': 'secret',
                'smtp.from': 'Test <no-reply@test.com>',
                'smtp.preview': false,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  describe('sendEmail', () => {
    it('sends an email via the transporter', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      await service.sendEmail({
        to: 'recipient@test.com',
        subject: 'Test subject',
        html: '<p>Hello</p>',
        text: 'Hello',
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recipient@test.com',
          subject: 'Test subject',
          html: '<p>Hello</p>',
          text: 'Hello',
          from: 'Test <no-reply@test.com>',
        }),
      );
    });

    it('logs the Ethereal preview URL when getTestMessageUrl returns one', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });
      mockedNodemailer.getTestMessageUrl.mockReturnValue(
        'https://ethereal.email/message/abc',
      );

      await service.sendEmail({
        to: 'recipient@test.com',
        subject: 'Preview test',
        html: '<p>Hi</p>',
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://ethereal.email/message/abc'),
      );
    });

    it('throws when the transporter fails', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP connection refused'));

      await expect(
        service.sendEmail({
          to: 'recipient@test.com',
          subject: 'Fail',
          html: '<p>Hi</p>',
        }),
      ).rejects.toThrow('SMTP connection refused');
    });

    it('logs email content when no transporter is configured', async () => {
      mockedNodemailer.createTransport.mockReturnValue(undefined as never);

      const noSmtpModule: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'smtp.host') return undefined;
                if (key === 'smtp.preview') return false;
                return undefined;
              }),
            },
          },
        ],
      }).compile();

      const noSmtpService = noSmtpModule.get<NotificationService>(NotificationService);
      const logSpy = jest.spyOn(noSmtpService['logger'], 'log');

      await noSmtpService.sendEmail({
        to: 'someone@test.com',
        subject: 'No SMTP',
        html: '<p>Hi</p>',
        text: 'Hi',
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL PREVIEW]'),
      );
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
});
