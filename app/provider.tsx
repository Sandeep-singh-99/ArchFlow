"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import { api } from "../convex/_generated/api";
import { UserDetailContext } from "@/context/UserDetailContext";
import { WorkflowContext } from "@/context/WorkflowContext";
import { ReactFlowProvider } from "@xyflow/react";

export default function Provider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const createUser = useMutation(api.user.CreateNewUser);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>();
  const [addedNodes, setAddedNodes] = useState<any[]>([]);
  const [nodeEdges, setNodeEdges] = useState<any[]>([]);

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const liveDbUser = useQuery(
    api.user.GetUserByEmail,
    userEmail ? { email: userEmail } : "skip"
  );

  useEffect(() => {
    CreateAndGetUser();
  }, [user]);

  // Reactive subscription sync: automatically update context whenever Convex DB updates
  useEffect(() => {
    if (liveDbUser) {
      setUserDetails(liveDbUser);
    }
  }, [liveDbUser]);

  const CreateAndGetUser = async () => {
    if (user) {
      try {
        const result = await createUser({
          name: user.fullName ?? "",
          email: user.primaryEmailAddress?.emailAddress ?? "",
          imageUrl: user.imageUrl ?? "",
        });
        setUserDetails(result);
      } catch (err) {
        console.error("Failed to sync user with Convex:", err);
      }
    }
  };

  return (
    <UserDetailContext.Provider value={{ userDetails, setUserDetails }}>
      <ReactFlowProvider>
        <WorkflowContext.Provider
          value={{
            addedNodes,
            setAddedNodes,
            nodeEdges,
            setNodeEdges,
            selectedNode,
            setSelectedNode,
          }}
        >
          <div>{children}</div>
        </WorkflowContext.Provider>
      </ReactFlowProvider>
    </UserDetailContext.Provider>
  );
}
