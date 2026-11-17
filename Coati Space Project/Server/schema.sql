CREATE TABLE "Coatis" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Coatis" PRIMARY KEY AUTOINCREMENT,
    "Species" TEXT NOT NULL,
    "Gender" TEXT NOT NULL,
    "BirthDate" TEXT NOT NULL,
    "Biography" TEXT NOT NULL,
    "Diet" TEXT NOT NULL,
    "Habitat" TEXT NOT NULL,
    "HealthStatus" TEXT NOT NULL,
    "PhotoUrl" TEXT NOT NULL,
    "VideoUrl" TEXT NOT NULL,
    "Name" TEXT NOT NULL
);

CREATE TABLE "DiaryEntries" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_DiaryEntries" PRIMARY KEY AUTOINCREMENT,
    "CoatiId" INTEGER NOT NULL,
    "EventDate" TEXT NOT NULL,
    "EventType" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "Author" TEXT NOT NULL
);

CREATE TABLE "Donations" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Donations" PRIMARY KEY AUTOINCREMENT,
    "DonorName" TEXT NOT NULL,
    "Email" TEXT NULL,
    "Amount" TEXT NOT NULL,
    "Target" TEXT NOT NULL,
    "Message" TEXT NULL,
    "CreatedAt" TEXT NOT NULL
);

CREATE TABLE "StaffUsers" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_StaffUsers" PRIMARY KEY AUTOINCREMENT,
    "Username" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "FullName" TEXT NOT NULL,
    "Role" TEXT NOT NULL,
    "Position" TEXT NOT NULL
);
