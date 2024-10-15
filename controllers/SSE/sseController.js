import SSE from "express-sse";

export const sse = new SSE();

export const sseController = (req, res) => {
  sse.init(req, res);
};
