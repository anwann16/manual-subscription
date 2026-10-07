-- ERD design note: a subscription may have at most one active PENDING payment.
-- PSL cannot express a partial unique index, so enforce it at the database level.
CREATE UNIQUE INDEX "Payment_subscriptionId_pending_key"
  ON "Payment" ("subscriptionId")
  WHERE "status" = 'PENDING';
