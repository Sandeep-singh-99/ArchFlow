import CustomNode from "./CustomNode";

export const nodeTypes = {
  CustomNode,
  // Fallbacks so previously saved canvas nodes render seamlessly
  FrontendNode: CustomNode,
  ServiceNode: CustomNode,
  DatabaseNode: CustomNode,
  AiAgentNode: CustomNode,
};
