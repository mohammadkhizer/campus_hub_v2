'use server';

import dbConnect from '@/lib/mongoose';
import UserModel from '@/models/User';
import QuizModel from '@/models/Quiz';
import AttemptModel from '@/models/Attempt';
import FeedbackModel from '@/models/Feedback';

export async function serverGetAnalyticsData() {
  try {
    await dbConnect();

    // 1. User Stats
    const totalUsers = await UserModel.countDocuments();
    const students = await UserModel.countDocuments({ role: 'student' });
    const teachers = await UserModel.countDocuments({ role: 'teacher' });
    const admins = await UserModel.countDocuments({ role: { $in: ['administrator', 'superadmin'] } });

    // 2. Registration Trend (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const registrations = await UserModel.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 3. Quiz & Attempt Stats
    const totalQuizzes = await QuizModel.countDocuments();
    const totalAttempts = await AttemptModel.countDocuments();
    
    // Average score across all attempts
    const scoreStats = await AttemptModel.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: { $divide: ["$score", "$totalQuestions"] } },
          totalPoints: { $sum: "$score" }
        }
      }
    ]);

    // 4. Feedback Stats
    const totalFeedbacks = await FeedbackModel.countDocuments();
    const displayedFeedbacks = await FeedbackModel.countDocuments({ isDisplayed: true });

    return {
      users: {
        total: totalUsers,
        students,
        teachers,
        admins
      },
      trends: {
        registrations: registrations.map(r => ({ date: r._id, count: r.count }))
      },
      quizzes: {
        total: totalQuizzes,
        attempts: totalAttempts,
        avgAccuracy: scoreStats[0]?.avgScore ? Math.round(scoreStats[0].avgScore * 100) : 0
      },
      feedback: {
        total: totalFeedbacks,
        displayed: displayedFeedbacks
      }
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return null;
  }
}
