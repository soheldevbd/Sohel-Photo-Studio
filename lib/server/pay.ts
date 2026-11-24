export const pubPay = (p: any) => ({
  id: p._id.toString(), uid: p.uid, email: p.email, trxId: p.trxId, sender: p.sender, planName: p.planName,
  price: p.price, days: p.days, status: p.status, createdAt: p.createdAt, reviewedAt: p.reviewedAt || 0,
});
