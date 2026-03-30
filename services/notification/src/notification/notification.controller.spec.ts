import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { RmqContext } from '@nestjs/microservices';

jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

const mockAck = jest.fn();

function makeContext(): RmqContext {
  return {
    getChannelRef: () => ({ ack: mockAck }),
    getMessage: () => ({}),
  } as unknown as RmqContext;
}

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationService: NotificationService;

  beforeEach(async () => {
    mockAck.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: { sendEmail: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  describe('handleSendEmail', () => {
    it('calls sendEmail and returns { success: true }', async () => {
      jest.spyOn(notificationService, 'sendEmail').mockResolvedValue(undefined);

      const result = await controller.handleSendEmail(
        { to: 'user@test.com', subject: 'Hello', html: '<p>Hi</p>' },
        makeContext(),
      );

      expect(notificationService.sendEmail).toHaveBeenCalledWith({
        to: 'user@test.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
      });
      expect(result).toEqual({ success: true });
    });

    it('acks the RabbitMQ message on success', async () => {
      jest.spyOn(notificationService, 'sendEmail').mockResolvedValue(undefined);

      await controller.handleSendEmail(
        { to: 'user@test.com', subject: 'Hello', html: '<p>Hi</p>' },
        makeContext(),
      );

      expect(mockAck).toHaveBeenCalledTimes(1);
    });

    it('returns { success: false } when sendEmail throws', async () => {
      jest
        .spyOn(notificationService, 'sendEmail')
        .mockRejectedValue(new Error('SMTP error'));

      const result = await controller.handleSendEmail(
        { to: 'user@test.com', subject: 'Fail', html: '<p>Oops</p>' },
        makeContext(),
      );

      expect(result).toEqual({ success: false });
    });

    it('still acks the RabbitMQ message even when sendEmail throws', async () => {
      jest
        .spyOn(notificationService, 'sendEmail')
        .mockRejectedValue(new Error('SMTP error'));

      await controller.handleSendEmail(
        { to: 'user@test.com', subject: 'Fail', html: '<p>Oops</p>' },
        makeContext(),
      );

      expect(mockAck).toHaveBeenCalledTimes(1);
    });

    it('passes optional text field through to sendEmail', async () => {
      jest.spyOn(notificationService, 'sendEmail').mockResolvedValue(undefined);

      await controller.handleSendEmail(
        {
          to: 'user@test.com',
          subject: 'With text',
          html: '<p>Hi</p>',
          text: 'Hi',
        },
        makeContext(),
      );

      expect(notificationService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'Hi' }),
      );
    });
  });
});
