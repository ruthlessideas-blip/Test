-- CreateTable
CREATE TABLE "Universe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mission" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "World" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "universeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "definitionOfDone" TEXT NOT NULL,
    "progressionStage" TEXT NOT NULL,
    "phaseLabel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'paused',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "World_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Dream" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "universeId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dream_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "DailyStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "stepText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "chosenReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyStep_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "DailyStep_worldId_date_key" ON "DailyStep"("worldId", "date");

CREATE TABLE "WorldMemoryLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorldMemoryLog_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "universeId" TEXT,
    "worldId" TEXT,
    "version" INTEGER NOT NULL,
    "templateText" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PromptTemplate_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PromptTemplate_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "PromptRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "worldId" TEXT,
    "inputsJson" TEXT NOT NULL,
    "outputText" TEXT NOT NULL,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptRun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PromptTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PromptRun_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY,
    "mode" TEXT NOT NULL DEFAULT 'calm',
    "closeOnDone" BOOLEAN NOT NULL DEFAULT true
);
