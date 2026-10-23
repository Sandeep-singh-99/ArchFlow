import CustomNode from "./CustomNode";
import TextNode from "./TextNode";
import StartNode from "./StartNode";
import EndNode from "./EndNode";
import IfElseNode from "./IfElseNode";

export const nodeTypes = {
  CustomNode,
  TextNode,
  StartNode,
  EndNode,
  IfElseNode,
  // Fallbacks so previously saved canvas nodes render seamlessly
  FrontendNode: CustomNode,
  ServiceNode: CustomNode,
  DatabaseNode: CustomNode,
  AiAgentNode: CustomNode,
};
