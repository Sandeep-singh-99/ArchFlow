import CustomNode from "./CustomNode";
import TextNode from "./TextNode";

export const nodeTypes = {
  CustomNode,
  TextNode,
  // Fallbacks so previously saved canvas nodes render seamlessly
  FrontendNode: CustomNode,
  ServiceNode: CustomNode,
  DatabaseNode: CustomNode,
  AiAgentNode: CustomNode,
};
