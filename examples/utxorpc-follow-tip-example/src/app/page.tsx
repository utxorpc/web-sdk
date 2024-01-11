"use client";

import { Block } from "@utxorpc-web/cardano-spec";
import { CardanoClientV1Alpha } from "@utxorpc-web/sdk";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Home() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const tip = useMemo(() => {
    let client = new CardanoClientV1Alpha(
      "https://preview-ws.utxorpc-v0.demeter.run",
      {
        headers: {
          "dmtr-api-key": "dmtr_utxorpc10zrj5dglh53dn8lhgk4p2lffuuu7064j",
        },
      }
    );

    const tip = client.followChainTip();

    tip.on("apply", (b) => {
      setBlocks((prev) => [...prev, b]);
    });

    return tip;
  }, []);

  useEffect(() => {
    tip.start();
  }, [tip]);

  return (
    <main className="flex min-h-screen flex-col p-24">
      <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
        Get started by editing&nbsp;
      </p>

      {blocks.map((b) => (
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          <code className="font-mono font-bold block">
            {b.header?.slot.toString()}
          </code>
        </p>
      ))}
    </main>
  );
}
