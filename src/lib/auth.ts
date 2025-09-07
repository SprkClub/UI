import { NextAuthOptions } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import TwitterProvider from "next-auth/providers/twitter";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

if (!mongoUri || typeof mongoUri !== 'string') {
  console.warn('MONGODB_URI not available during build');
}

const client = new MongoClient(mongoUri);
const clientPromise = client.connect().catch(() => {
  // Fail gracefully during build time
  return Promise.resolve(client);
});

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: "launchpad"
  }),
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0", // opt in to Twitter API v2
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, user, token }) {
      if (session?.user) {
        session.user.id = user.id;
        // Store Twitter username for admin check from token or user
        session.user.username = token.username as string || user.username;
      }
      return session;
    },
    async jwt({ user, token, account, profile }) {
      if (user) {
        token.uid = user.id;
        // Store Twitter username from profile
        if (account?.provider === 'twitter' && profile) {
          const twitterProfile = profile as Record<string, unknown>;
          const profileData = (twitterProfile.data as Record<string, unknown>) || twitterProfile;
          token.username = (profileData.username as string) || (twitterProfile.username as string);
        }
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};