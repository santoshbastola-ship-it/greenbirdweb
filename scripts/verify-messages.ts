
import { TransactionService } from '../src/services/transaction.service';
import { OrderStatus, TransactionType, PaymentStatus } from '../src/types';

// Mock NotificationService to see outputs
// @ts-ignore
import { NotificationService } from '../src/services/notification.service';
jest.mock('../src/services/notification.service', () => ({
    NotificationService: {
        createNotification: jest.fn().mockImplementation((notif) => {
            console.log('--- NOTIFICATION SENT ---');
            console.log('Title:', notif.title);
            console.log('Message:', notif.message);
            console.log('-------------------------');
            return Promise.resolve('mock-id');
        }),
        notifyAdmins: jest.fn().mockResolvedValue(undefined)
    }
}));

async function verify() {
    const mockTransaction = {
        billNo: 'GB-1024',
        type: TransactionType.Sale,
        customerId: 'user-123',
        items: [
            { productName: 'Eggs', quantity: 30 },
            { productName: 'Chicken', quantity: 1 }
        ],
        partyName: 'Test User'
    };

    console.log('VERIFYING NEW ORDER MESSAGE:');
    // @ts-ignore
    await TransactionService.createTransaction(mockTransaction);

    console.log('\nVERIFYING ORDER CONFIRMED (ACCEPTED) MESSAGE:');
    // @ts-ignore
    await TransactionService.updateTransactionStatus('GB-1024', OrderStatus.Accepted);
}

// Since I can't run jest easily here without setup, I'll just use simple logs to verify.
