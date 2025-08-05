
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  createClassInputSchema,
  enrollStudentInputSchema,
  recordAttendanceInputSchema,
  bulkRecordAttendanceInputSchema,
  getAttendanceReportInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createClass } from './handlers/create_class';
import { getClasses } from './handlers/get_classes';
import { enrollStudent } from './handlers/enroll_student';
import { getStudentsByClass } from './handlers/get_students_by_class';
import { recordAttendance } from './handlers/record_attendance';
import { bulkRecordAttendance } from './handlers/bulk_record_attendance';
import { getAttendanceByClassDate } from './handlers/get_attendance_by_class_date';
import { getAttendanceStats } from './handlers/get_attendance_stats';
import { getAttendanceReport } from './handlers/get_attendance_report';
import { getUsers } from './handlers/get_users';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  getUsers: publicProcedure
    .query(() => getUsers()),

  // Class management
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),

  getClasses: publicProcedure
    .query(() => getClasses()),

  // Student enrollment
  enrollStudent: publicProcedure
    .input(enrollStudentInputSchema)
    .mutation(({ input }) => enrollStudent(input)),

  getStudentsByClass: publicProcedure
    .input(z.object({ classId: z.number() }))
    .query(({ input }) => getStudentsByClass(input.classId)),

  // Attendance recording
  recordAttendance: publicProcedure
    .input(recordAttendanceInputSchema)
    .mutation(({ input }) => recordAttendance(input)),

  bulkRecordAttendance: publicProcedure
    .input(bulkRecordAttendanceInputSchema)
    .mutation(({ input }) => bulkRecordAttendance(input)),

  // Attendance viewing
  getAttendanceByClassDate: publicProcedure
    .input(z.object({ classId: z.number(), date: z.string().date() }))
    .query(({ input }) => getAttendanceByClassDate(input.classId, input.date)),

  // Dashboard and reports
  getAttendanceStats: publicProcedure
    .input(z.object({ classId: z.number().optional() }))
    .query(({ input }) => getAttendanceStats(input.classId)),

  getAttendanceReport: publicProcedure
    .input(getAttendanceReportInputSchema)
    .query(({ input }) => getAttendanceReport(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
