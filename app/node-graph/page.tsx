import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import NodeDatabaseVisualizer from "@/components/node-graph/NodeDatabaseVisualizer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Node Database Visualizer - Dynamic Node Sizing",
  description: "Graph Node visualization where foreign keys and status are excluded, and node sizes increase according to order amounts.",
};

export default function NodeGraphPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-[#ffdf27]/25 selection:text-[#ffee72]">
      <Navbar />
      <main className="flex-1 py-8 px-4 sm:px-6">
        <NodeDatabaseVisualizer />
      </main>
      <Footer />
    </div>
  );
}
