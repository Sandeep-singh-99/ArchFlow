// System Design Node Components
import FrontendNode from "./FrontendNode";
import MobileNode from "./MobileNode";
import AiAgentNode from "./AiAgentNode";
import CloudInfraNode from "./CloudInfraNode";
import ClientNode from "./ClientNode";
import DnsNode from "./DnsNode";
import CdnNode from "./CdnNode";
import GatewayNode from "./GatewayNode";
import LoadBalancerNode from "./LoadBalancerNode";
import RateLimiterNode from "./RateLimiterNode";
import ServiceNode from "./ServiceNode";
import ServerlessNode from "./ServerlessNode";
import QueueNode from "./QueueNode";
import CacheNode from "./CacheNode";
import DatabaseNode from "./DatabaseNode";
import VectorDbNode from "./VectorDbNode";
import StorageNode from "./StorageNode";
import WorkerNode from "./WorkerNode";
import SearchNode from "./SearchNode";
import MonitoringNode from "./MonitoringNode";
import ThirdPartyApiNode from "./ThirdPartyApiNode";

// Legacy Fallback Nodes
import StartNode from "./StartNode";
import AgentNode from "./AgentNode";
import EndNode from "./EndNode";
import IfElseNode from "./IfElseNode";
import WhileNode from "./WhileNode";
import UserApprovalNode from "./UserApprovalNode";
import ApiNode from "./ApiNode";

export const nodeTypes = {
  // Domain Specialized Nodes
  FrontendNode,
  MobileNode,
  AiAgentNode,
  CloudInfraNode,

  // System Design Nodes
  ClientNode,
  DnsNode,
  CdnNode,
  GatewayNode,
  LoadBalancerNode,
  RateLimiterNode,
  ServiceNode,
  ServerlessNode,
  QueueNode,
  CacheNode,
  DatabaseNode,
  VectorDbNode,
  StorageNode,
  WorkerNode,
  SearchNode,
  MonitoringNode,
  ThirdPartyApiNode,

  // Legacy Node Aliases
  StartNode,
  AgentNode,
  EndNode,
  IfElseNode,
  WhileNode,
  UserApprovalNode,
  ApiNode,
};
