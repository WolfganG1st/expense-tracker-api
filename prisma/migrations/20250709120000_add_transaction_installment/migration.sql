-- Add the column
ALTER TABLE "Transaction" ADD COLUMN "installment" TEXT;

-- Crie o índice único
CREATE UNIQUE INDEX "Transaction_userId_merchantId_amount_dateTime_cardNumber_cu_key" ON "Transaction"("userId", "merchantId", "amount", "dateTime", "cardNumber", "currencyCode", "installment");
