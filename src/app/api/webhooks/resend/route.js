import clientPromise from '@/lib/mongodb';

export async function POST(request) {
    try {
        const body = await request.json();
        const { type, data } = body;

        if (!data?.email_id) {
            return Response.json({ message: 'No email_id in event payload' }, { status: 200 });
        }

        const client = await clientPromise;
        const db = client.db('testseries');

        const statusMap = {
            'email.delivered': 'DELIVERED',
            'email.bounced': 'BOUNCED',
            'email.complained': 'COMPLAINED',
            'email.delivery_delayed': 'DELAYED',
            'email.sent': 'SENT'
        };

        const deliveryStatus = statusMap[type] || type;

        await db.collection('emailNotifications').updateOne(
            { providerMessageId: data.email_id },
            {
                $set: {
                    deliveryStatus,
                    lastWebhookAt: new Date(),
                    updatedAt: new Date()
                },
                $push: {
                    providerEvents: {
                        type,
                        timestamp: new Date(),
                        payload: data
                    }
                }
            }
        );

        return Response.json({ success: true, processed: type });
    } catch (error) {
        console.error('Error handling Resend webhook:', error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
