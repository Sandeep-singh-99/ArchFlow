"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../convex/_generated/api";
import { Doc } from "../convex/_generated/dataModel";
import { UserDetailContext } from "@/context/UserDetailContext";

export default function Provider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const createUser = useMutation(api.user.CreateNewUser);
  const [localUserDetails, setLocalUserDetails] = useState<Doc<"UserTable"> | null>(null);

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const liveDbUser = useQuery(
    api.user.GetUserByEmail,
    userEmail ? { email: userEmail } : "skip"
  );

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    createUser({
      name: user.fullName ?? "",
      email: user.primaryEmailAddress?.emailAddress ?? "",
      imageUrl: user.imageUrl ?? "",
    })
      .then((result) => {
        if (isMounted && result) {
          setLocalUserDetails((prev) => {
            if (!prev) return result as Doc<"UserTable">;
            return {
              ...(result as Doc<"UserTable">),
              ...prev,
              subscription: (result as Doc<"UserTable">).subscription || prev.subscription,
            };
          });
        }
      })
      .catch((err) => {
        console.error("Failed to sync user with Convex:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [user, createUser]);

  const userDetails = useMemo(() => {
    if (liveDbUser) {
      return {
        ...liveDbUser,
        ...(localUserDetails || {}),
        subscription: liveDbUser.subscription || localUserDetails?.subscription,
        subscriptionExpiresAt: liveDbUser.subscriptionExpiresAt || localUserDetails?.subscriptionExpiresAt,
        subscriptionBillingCycle: liveDbUser.subscriptionBillingCycle || localUserDetails?.subscriptionBillingCycle,
      };
    }
    return localUserDetails ?? null;
  }, [localUserDetails, liveDbUser]);

  const setUserDetails = useCallback(
    (action: React.SetStateAction<Doc<"UserTable"> | null>) => {
      setLocalUserDetails((prev) => {
        const current = prev ?? (liveDbUser as Doc<"UserTable"> | null) ?? null;
        if (typeof action === "function") {
          return (action as (prevState: Doc<"UserTable"> | null) => Doc<"UserTable"> | null)(current);
        }
        return action;
      });
    },
    [liveDbUser]
  );

  return (
    <UserDetailContext.Provider value={{ userDetails, setUserDetails }}>
      <div>{children}</div>
    </UserDetailContext.Provider>
  );
}
