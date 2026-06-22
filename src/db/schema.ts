import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase auth UID or fallback "demo-user" ID
  email: text("email").notNull(),
  name: text("name"),
  password: text("password"), // For temporary login verification in development/testing
  targetRole: text("target_role"),
  yearsOfExperience: integer("years_of_experience"),
  skills: jsonb("skills").$type<string[]>(),
  location: text("location"),
  experienceSummary: text("experience_summary"),
  resumeText: text("resume_text"),
  desiredSalary: text("desired_salary"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  companyName: text("company_name").notNull(),
  jobTitle: text("job_title").notNull(),
  jobDescription: text("job_description"),
  applicationDate: text("application_date"),
  status: text("status").notNull(), // Saved, Applied, Interview, Rejected, Offer
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const resumeAnalyses = pgTable("resume_analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  atsScore: integer("ats_score").notNull(),
  strengths: jsonb("strengths").$type<string[]>(),
  missingKeywords: jsonb("missing_keywords").$type<string[]>(),
  recommendations: jsonb("recommendations").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  action: text("action").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  jobApplications: many(jobApplications),
  resumeAnalyses: many(resumeAnalyses),
  activityLogs: many(activityLogs),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  user: one(users, {
    fields: [jobApplications.userId],
    references: [users.id],
  }),
}));

export const resumeAnalysesRelations = relations(resumeAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [resumeAnalyses.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));
