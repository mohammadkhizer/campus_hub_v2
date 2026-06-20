'use server';

import { createAction } from '@/lib/action-factory';
import { USER_ROLES } from '@/lib/constants';
import { toDTO } from '@/lib/dto';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Classroom from '@/models/Classroom';
import Assignment from '@/models/Assignment';
import Quiz from '@/models/Quiz';
import Attempt from '@/models/Attempt';
import { z } from 'zod';

export async function getStudentMetricsAction() {
  return createAction({
    name: 'getStudentMetricsAction',
    allowedRoles: [USER_ROLES.STUDENT],
    handler: async (_, { user: session }) => {
      const instId = session!.institutionId;

      // 1. Get Classrooms & Courses
      const classrooms = await Classroom.find({ students: session!.id, institutionId: instId }).select('courses');
      const courseIds = classrooms.flatMap(c => c.courses);

      // 2. Quiz Rank
      const studentAttempts = await Attempt.find({ student: session!.id, institutionId: instId });
      let quizRank = "--";
      if (studentAttempts.length > 0) {
        const avgScore = studentAttempts.reduce((acc, a) => acc + (a.score / (a.totalQuestions || 1)), 0) / studentAttempts.length;
        
        const quizIds = studentAttempts.map(a => a.quiz);
        const allAttempts = await Attempt.find({ quiz: { $in: quizIds }, institutionId: instId });
        
        const allAverages = allAttempts.reduce((acc: any, curr) => {
          const studentId = curr.student.toString();
          if (!acc[studentId]) acc[studentId] = { total: 0, count: 0 };
          acc[studentId].total += (curr.score / (curr.totalQuestions || 1));
          acc[studentId].count += 1;
          return acc;
        }, {});

        const rankings = Object.values(allAverages)
          .map((stats: any) => stats.total / stats.count)
          .sort((a: any, b: any) => b - a);
        
        const pos = rankings.indexOf(avgScore) + 1;
        quizRank = `#${pos.toString().padStart(2, '0')}`;
      }

      // 3. Tasks Due
      const now = new Date();
      const tasksDueCount = await Assignment.countDocuments({
        course: { $in: courseIds },
        deadline: { $gt: now },
        institutionId: instId
      });

      // 4. Attendance (Placeholder for now)
      const attendance = "98%"; 

      return {
        quizRank,
        attendance,
        tasksDue: tasksDueCount.toString().padStart(2, '0')
      };
    }
  }, {});
}

export async function getStudentDeadlinesAction() {
  return createAction({
    name: 'getStudentDeadlinesAction',
    allowedRoles: [USER_ROLES.STUDENT],
    handler: async (_, { user: session }) => {
      const instId = session!.institutionId;

      const classrooms = await Classroom.find({ students: session!.id, institutionId: instId }).select('courses');
      const courseIds = classrooms.flatMap(c => c.courses);

      const now = new Date();
      const deadlines = await Assignment.find({
        course: { $in: courseIds },
        deadline: { $gt: now },
        institutionId: instId
      })
      .populate('course', 'title code')
      .sort({ deadline: 1 })
      .limit(5)
      .lean();

      return toDTO<any>(deadlines).map((d: any) => {
        const diff = Math.ceil((new Date(d.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: d.id,
          title: `${d.course?.title || 'Unknown'} - ${d.title}`,
          timeLeft: diff === 1 ? 'Due tomorrow' : `Due in ${diff} days`,
          isUrgent: diff <= 2
        };
      });
    }
  }, {});
}
