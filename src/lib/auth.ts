import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyLoginToken } from "@/lib/ax-auth/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    // 로그인 실패(CredentialsSignin 등) 시 이 경로로 `?error=...`와 함께 리다이렉트된다.
    // Viewer에는 별도 로그인 화면이 없으므로(댓글 작성 시에만 인라인 트리거), 실패 시 홈으로 보낸다.
    signIn: "/",
  },
  providers: [
    Credentials({
      id: "ax-auth",
      name: "AX Auth",
      credentials: {
        loginToken: { type: "text" },
      },
      async authorize(credentials) {
        const loginToken = credentials?.loginToken;
        if (typeof loginToken !== "string" || !loginToken) {
          return null;
        }

        const result = await verifyLoginToken(loginToken);
        if (!result.valid || !result.email) {
          return null;
        }

        return { id: result.email, email: result.email, name: result.email };
      },
    }),
  ],
});
