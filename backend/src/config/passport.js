import passport from 'passport'
import { Strategy as GitHubStrategy } from 'passport-github2'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import { createUser, findUserByProvider, findUserById, findUserByEmail } from '../models/userStore.js'
dotenv.config()

passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser((id, done) => done(null, findUserById(id) || false))

const makeOAuthHandler = (provider) => async (accessToken, refreshToken, profile, done) => {
  try {
    let user = findUserByProvider(provider, profile.id)
    if (!user) {
      const email = profile.emails?.[0]?.value || `${profile.username || profile.id}@${provider}.oauth`
      user = findUserByEmail(email) || createUser({
        id: uuidv4(),
        email,
        name: profile.displayName || profile.username || email.split('@')[0],
        avatar: profile.photos?.[0]?.value,
        provider,
        providerId: String(profile.id),
      })
    }
    return done(null, user)
  } catch (err) { return done(err) }
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your_github_oauth_client_id') {
  passport.use(new GitHubStrategy({ clientID: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET, callbackURL: process.env.GITHUB_CALLBACK_URL, scope: ['user:email'] }, makeOAuthHandler('github')))
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id') {
  passport.use(new GoogleStrategy({ clientID: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, callbackURL: process.env.GOOGLE_CALLBACK_URL }, makeOAuthHandler('google')))
}

export default passport
