import CourseModel from '@/models/Course';
import dbConnect from '@/lib/mongoose';
import { logger } from '@/lib/logger';

export class CourseService {
  /**
   * Retrieves all courses with tenant isolation
   */
  static async getCourses(institutionId?: string) {
    await dbConnect();
    try {
      const query = institutionId ? { institutionId } : {};
      const courses = await CourseModel.find(query).lean();
      return courses;
    } catch (error: any) {
      logger.error('CourseService.getCourses failed', { error: error.message });
      throw new Error('Failed to retrieve courses');
    }
  }

  /**
   * Creates a new course
   */
  static async createCourse(data: any, institutionId?: string) {
    await dbConnect();
    try {
      const course = await CourseModel.create({ ...data, institutionId });
      return course;
    } catch (error: any) {
      logger.error('CourseService.createCourse failed', { error: error.message });
      throw error;
    }
  }
}
