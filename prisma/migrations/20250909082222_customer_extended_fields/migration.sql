-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "tcNumber" TEXT,
    "segment" TEXT,
    "address" TEXT,
    "neighborhood" TEXT,
    "street" TEXT,
    "buildingNo" TEXT,
    "apartmentNo" TEXT,
    "fullAddress" TEXT,
    "city" TEXT,
    "district" TEXT,
    "birthDate" DATETIME,
    "gender" TEXT,
    "preferredContact" TEXT,
    "notes" TEXT,
    "consentPersonalData" BOOLEAN NOT NULL DEFAULT false,
    "consentMarketing" BOOLEAN NOT NULL DEFAULT false,
    "consentCall" BOOLEAN NOT NULL DEFAULT false,
    "consentProfiling" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "totalSpent" REAL NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "lastVisit" DATETIME,
    "averageOrderValue" REAL NOT NULL DEFAULT 0
);
INSERT INTO "new_Customer" ("address", "averageOrderValue", "birthDate", "city", "createdAt", "district", "email", "firstName", "fullName", "gender", "id", "isActive", "lastName", "lastVisit", "notes", "phone", "preferredContact", "segment", "tcNumber", "totalOrders", "totalSpent", "updatedAt") SELECT "address", "averageOrderValue", "birthDate", "city", "createdAt", "district", "email", "firstName", "fullName", "gender", "id", "isActive", "lastName", "lastVisit", "notes", "phone", "preferredContact", "segment", "tcNumber", "totalOrders", "totalSpent", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
CREATE UNIQUE INDEX "Customer_tcNumber_key" ON "Customer"("tcNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
