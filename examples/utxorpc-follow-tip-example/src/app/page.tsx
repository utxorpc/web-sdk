"use client";

import { Block } from '@utxorpc-web/cardano-spec';
import { CardanoClientV1Alpha } from '@utxorpc-web/sdk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import JsonView from '@uiw/react-json-view';

interface FriendlyBlock {
  slot: bigint;
  hash: string;
  txs: FriendlyTx[];
}

interface FriendlyTx {
  inputs: string[];
  outputs: FriendlyOutput[];
  fee: bigint;
}

interface FriendlyOutput {
  address: string;
  amount: bigint;
  assets: number,
}

const friendlyBlock = (block: Block): FriendlyBlock => ({
  slot: block.header?.slot || BigInt(0),
  hash: uint8ArrayToHex(block.header?.hash || new Uint8Array()),
  txs: block.body?.tx.map(tx => ({
    fee: tx.fee,
    inputs: tx.inputs.map(input => uint8ArrayToHex(input.txHash) + '#' + input.outputIndex),
    outputs: tx.outputs.map(output => ({
      address: uint8ArrayToHex(output.address),
      amount: output.coin,
      assets: output.assets.length,
    })),
  })) || [],
});

const uint8ArrayToHex = (arr: Uint8Array) => {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function Home() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<FriendlyBlock | null>(null);
  const blockContainer = useRef<HTMLDivElement>(null);
  const scrollContainer = useRef<HTMLDivElement>(null);
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
      setBlocks(prev => {
        const prevBlocks = [...prev];
        return [...prevBlocks, b];
      });

      (async () => {
        // Hacky, delay computation to allow for DOM to update and animate
        await new Promise(resolve => setTimeout(resolve, 100));
        if (blockContainer.current != null) {
          const blockContainerElement = blockContainer.current;
          const blockContainerScrollWidth = blockContainerElement.scrollWidth;
          if (blockContainerElement.children.length > 1) {
            const blockItemWidth = (blockContainerElement.children[0].computedStyleMap().get('width') as any).value;
            const blockContainerGap = '16px';
            blockContainerElement.style.marginLeft = `calc(-${blockContainerScrollWidth}px + ((${blockItemWidth}px + ${blockContainerGap}) * 4))`;
          }
        }
      })();
    });
    return tip;
  }, []);

  useEffect(() => {
    tip.start();
  }, [tip]);

  const blockSelectedClass = useCallback((block: FriendlyBlock) => {
    return selectedBlock?.hash === block.hash ? 'active-block' : '';
  }, [selectedBlock]);

  return (
    <main className="flex flex-col min-h-screen items-center justify-center p-24 m-auto">
      <div className="w-full flex justify-center mb-6"> {/* Logo container */}
        <Image src="/logo-dark.svg" width={200} height={100} alt="Logo" /> {/* Adjust height as needed */}
      </div>
      <div ref={scrollContainer} className="scroll-container w-[1100px] overflow-hidden">
        <div
          ref={blockContainer}
          className="grid grid-flow-col auto-cols-max gap-4 block-container"
        >
          {blocks.map((block, index) => (
            <div
              key={index}
              onClick={() => setSelectedBlock(friendlyBlock(block))}
              className={`block-item highlight-block flex items-center justify-center relative w-64 rounded-xl border border-gray-300 bg-gray-200 p-4 shadow-md dark:border-neutral-800 dark:bg-zinc-800 ${blockSelectedClass(friendlyBlock(block))}`}
            >
              <code className="block font-mono font-bold text-center">
                ⌛️ Slot: {block.header?.slot.toString()} <br />
                📦 Hash: {uint8ArrayToHex(block.header?.hash!).slice(-10)} <br />
                📝 Transactions: {block.body?.tx.length}
              </code>
            </div>
          ))}
        </div>
      </div>
      {selectedBlock != null && (
        <div className="block-explorer w-[1100px] h-[600px] slide-up overflow-auto relative mt-4">
          <button
            onClick={() => setSelectedBlock(null)}
            className="absolute top-0 right-0 m-2 text-lg font-bold text-gray-600 hover:text-gray-800 z-10"
          >
            X {/* Close button */}
          </button>
          <JsonView value={selectedBlock} enableClipboard={false} displayDataTypes={false} shortenTextAfterLength={0} collapsed={1}/>
        </div>
      )}
      <div className="pulse-circle"></div>
    </main>
  );
}
