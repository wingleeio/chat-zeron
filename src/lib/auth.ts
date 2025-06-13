import { getAuth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

export const fetchClerkAuth = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getWebRequest();
    if (!request) {
      throw new Error("No request found");
    }
    const auth = await getAuth(request);
    const token = await auth.getToken({ template: "convex" });

    return {
      userId: auth.userId,
      token,
    };
  }
);
