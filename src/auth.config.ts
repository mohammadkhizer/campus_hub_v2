import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await dbConnect();
        const user = await User.findOne({ email: credentials.email });

        if (!user || !user.password) return null;

        // Check Account Lockout
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
          throw new Error('Account is locked. Please try again later.');
        }

        const isMatch = await bcrypt.compare(credentials.password as string, user.password);
        
        if (!isMatch) {
          user.failedLoginAttempts += 1;
          if (user.failedLoginAttempts >= 5) {
            user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
          }
          await user.save();
          return null;
        }

        // Reset failed attempts
        if (user.failedLoginAttempts > 0) {
          user.failedLoginAttempts = 0;
          user.lockoutUntil = undefined;
          await user.save();
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          institutionId: user.institutionId?.toString(),
          passwordVersion: user.passwordVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.institutionId = (user as any).institutionId;
        token.passwordVersion = (user as any).passwordVersion;
      }
      
      // Handle session updates (e.g. after profile update)
      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).institutionId = token.institutionId;
      }
      return session;
    },
  },
  session: { 
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    // If RS256 keys are provided via Doppler/Env, NextAuth will use them.
    // Ensure keys are correctly formatted (PEM) in the environment.
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig;
