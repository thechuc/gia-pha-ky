import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    {
      id: "zalo",
      name: "Zalo",
      type: "oidc",
      issuer: "https://oauth.zaloapp.com",
      clientId: process.env.ZALO_CLIENT_ID,
      clientSecret: process.env.ZALO_CLIENT_SECRET,
      authorization: {
        url: "https://oauth.zaloapp.com/v4/permission",
        params: { scope: "r_user_id,r_user_profile" },
      },
      token: "https://oauth.zaloapp.com/v4/access_token",
      userinfo: "https://graph.zalo.me/v2.0/me?fields=id,name,picture",
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          image: profile.picture?.data?.url || profile.picture,
        };
      },
    },
  ],
  pages: {
    signIn: "/?auth=login",
    error: "/?auth=login",
  },
} satisfies NextAuthConfig;
