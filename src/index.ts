import { PromiseClient, createPromiseClient } from "@bufbuild/connect";
import { createGrpcWebTransport } from "@bufbuild/connect-web";
import { Block } from "@utxorpc-web/cardano-spec";
import { BlockRef, ChainSyncService, FollowTipResponse } from "@utxorpc-web/sync-spec";

export type ChainTipEventType = "apply" | "undo" | "reset";

export type BlockHandler = (block: Block) => void;
export type BlockRefHandler = (block: BlockRef) => void;

export class ChainTip {
  stream: AsyncIterable<FollowTipResponse>;
  applyHandler?: BlockHandler;
  undoHandler?: BlockHandler;
  resetHandler?: BlockRefHandler;

  constructor(stream: AsyncIterable<FollowTipResponse>) {
    this.stream = stream;
  }

  async loop() {
    for await (const block of this.stream) {
      console.log("waiting new block...");

      switch (block.action.case) {
        case "apply":
          if (block.action.value.chain.case == "cardano") {
            this.applyHandler &&
              this.applyHandler(block.action.value.chain.value);
          } else {
            console.warn("received apply event for non-Cardano chain");
          }
          break;
        case "undo":
          if (block.action.value.chain.case == "cardano") {
            this.undoHandler &&
              this.undoHandler(block.action.value.chain.value);
          } else {
            console.warn("received undo event for non-Cardano chain");
          }
          break;
        case "reset":
          this.resetHandler && this.resetHandler(block.action.value);
          break;
      }
    }
  }

  on(event: "apply", handler: BlockHandler): void;
  on(event: "undo", handler: BlockHandler): void;
  on(event: "reset", handler: BlockRefHandler): void;
  on(event: ChainTipEventType, handler: BlockHandler | BlockRefHandler): void {
    switch (event) {
      case "apply":
        this.applyHandler = handler as BlockHandler;
      case "undo":
        this.undoHandler = handler as BlockHandler;
      case "reset":
        this.resetHandler = handler as BlockRefHandler;
    }
  }

  start() {
    return this.loop();
  }
}

export class CardanoClientV1Alpha {
  headers: Record<string, string>;
  cs: PromiseClient<typeof ChainSyncService>;

  constructor(baseUrl: string, options?: { headers: Record<string, string> }) {
    const transport = createGrpcWebTransport({ baseUrl });
    this.headers = options?.headers || {};
    this.cs = createPromiseClient(ChainSyncService, transport);
  }

  followChainTip(): ChainTip {
    const stream = this.cs.followTip({}, { headers: this.headers });

    const tip = new ChainTip(stream);

    return tip;
  }
}
