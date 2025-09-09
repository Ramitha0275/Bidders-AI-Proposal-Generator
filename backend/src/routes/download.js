const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ Check download eligibility
router.get('/check-download-eligibility/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const order = await prisma.order.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!order) {
      return res.status(404).json({ error: 'No active plan found' });
    }

    const limit = order.planType === 'BASE' ? 5 : 20;
    const eligible = order.downloadCount < limit;

    res.json({ eligible, remaining: limit - order.downloadCount });
  } catch (error) {
    console.error('Eligibility check failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ⬆️ Increment download count (atomic and clean)
router.post('/increment-download/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!order) throw new Error('No active plan found');

      const limit = order.planType === 'BASE' ? 5 : 20;
      if (order.downloadCount >= limit) throw new Error('Download limit reached');

      await tx.order.update({
        where: { id: order.id },
        data: { downloadCount: { increment: 1 } },
      });

      return { success: true };
    });

    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Download limit reached') {
      return res.status(403).json({ error: 'Download limit reached' });
    }
    if (error.message === 'No active plan found') {
      return res.status(404).json({ error: 'No active plan found' });
    }

    console.error('Download increment failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
