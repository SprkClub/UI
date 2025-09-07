import { NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
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
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.uid as string;
        // Store Twitter username from token
        session.user.username = token.username as string;
      }
      return session;
    },
    async jwt({ user, token, account, profile }) {
      if (account && user) {
        token.uid = user.id;
        // Store Twitter username from profile for Twitter v2 API
        if (account.provider === 'twitter' && profile) {
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