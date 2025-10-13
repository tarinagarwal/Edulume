import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../db.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const profilePicture = profile.photos[0]?.value;

        // Check if user exists by googleId (use findFirst since it's not unique in schema)
        let user = await prisma.user.findFirst({
          where: { googleId },
        });

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // Check if user exists by email (account linking)
        user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Link Google account to existing user
          // This preserves their username and all data!
          user = await prisma.user.update({
            where: { email },
            data: {
              googleId,
              authProvider: "google",
              profilePicture,
              isVerified: true,
              // Don't set needsUsername - they already have a username!
            },
          });
          return done(null, user);
        }

        // Create new user (without username - will be set later)
        user = await prisma.user.create({
          data: {
            email,
            googleId,
            authProvider: "google",
            profilePicture,
            isVerified: true,
            needsUsername: true, // Flag to show username selection
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
