/*
  Warnings:

  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add passwordHash with a temporary default, then remove the default
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '$2a$10$placeholder.hash.will.be.replaced';

-- Remove the default after column is added
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP DEFAULT;
