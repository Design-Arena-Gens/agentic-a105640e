"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

type BlockType = "text" | "h1" | "h2" | "h3" | "bulleted" | "numbered" | "todo" | "quote" | "code";

interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
}

const BLOCK_TYPES = [
  { type: "text" as BlockType, icon: "📄", label: "Text", desc: "Plain text", command: "/text" },
  { type: "h1" as BlockType, icon: "H1", label: "Heading 1", desc: "Big section heading", command: "/h1" },
  { type: "h2" as BlockType, icon: "H2", label: "Heading 2", desc: "Medium section heading", command: "/h2" },
  { type: "h3" as BlockType, icon: "H3", label: "Heading 3", desc: "Small section heading", command: "/h3" },
  { type: "bulleted" as BlockType, icon: "•", label: "Bulleted List", desc: "Create a simple list", command: "/bullet" },
  { type: "numbered" as BlockType, icon: "1.", label: "Numbered List", desc: "Create a numbered list", command: "/number" },
  { type: "todo" as BlockType, icon: "☐", label: "To-do List", desc: "Track tasks with checkboxes", command: "/todo" },
  { type: "quote" as BlockType, icon: "\"", label: "Quote", desc: "Capture a quote", command: "/quote" },
  { type: "code" as BlockType, icon: "</>", label: "Code", desc: "Capture a code snippet", command: "/code" },
];

export default function NotionClone() {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "1", type: "text", content: "" }
  ]);
  const [focusedBlockId, setFocusedBlockId] = useState<string>("1");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [menuFilter, setMenuFilter] = useState("");
  const blockRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const addBlock = (afterId: string, type: BlockType = "text") => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: "",
      checked: type === "todo" ? false : undefined,
    };
    const index = blocks.findIndex((b) => b.id === afterId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setTimeout(() => {
      const element = blockRefs.current[newBlock.id];
      if (element) {
        if (type === "todo") {
          const span = element.querySelector("span");
          span?.focus();
        } else {
          element.focus();
        }
      }
    }, 0);
  };

  const deleteBlock = (id: string) => {
    const index = blocks.findIndex((b) => b.id === id);
    if (blocks.length === 1) {
      setBlocks([{ id: Date.now().toString(), type: "text", content: "" }]);
      return;
    }
    const newBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(newBlocks);

    if (index > 0) {
      setTimeout(() => {
        const prevBlock = newBlocks[index - 1];
        const element = blockRefs.current[prevBlock.id];
        if (element) {
          if (prevBlock.type === "todo") {
            const span = element.querySelector("span");
            span?.focus();
          } else {
            element.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(element);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }
      }, 0);
    }
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const handleKeyDown = (e: KeyboardEvent, block: Block) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addBlock(block.id);
      setMenuOpen(false);
    } else if (e.key === "Backspace") {
      const target = e.target as HTMLElement;
      const content = block.type === "todo"
        ? (target.textContent || "").trim()
        : (target.innerText || "").trim();

      if (content === "" || (block.type === "todo" && target.tagName === "SPAN" && content === "")) {
        e.preventDefault();
        deleteBlock(block.id);
        setMenuOpen(false);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const index = blocks.findIndex((b) => b.id === block.id);
      if (index > 0) {
        const prevBlock = blocks[index - 1];
        const element = blockRefs.current[prevBlock.id];
        if (element) {
          if (prevBlock.type === "todo") {
            const span = element.querySelector("span");
            span?.focus();
          } else {
            element.focus();
          }
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const index = blocks.findIndex((b) => b.id === block.id);
      if (index < blocks.length - 1) {
        const nextBlock = blocks[index + 1];
        const element = blockRefs.current[nextBlock.id];
        if (element) {
          if (nextBlock.type === "todo") {
            const span = element.querySelector("span");
            span?.focus();
          } else {
            element.focus();
          }
        }
      }
    }
  };

  const handleInput = (e: any, block: Block) => {
    const target = e.target as HTMLElement;
    const content = block.type === "todo"
      ? (target.textContent || "")
      : (target.innerText || "");

    updateBlock(block.id, { content });

    // Check for slash command
    if (content.startsWith("/")) {
      const rect = target.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.left });
      setMenuFilter(content.toLowerCase());
      setMenuOpen(true);
    } else {
      setMenuOpen(false);
    }
  };

  const applyBlockType = (blockId: string, newType: BlockType) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    const element = blockRefs.current[blockId];
    let content = block.content;

    if (element) {
      if (block.type === "todo") {
        const span = element.querySelector("span");
        content = span?.textContent || "";
      } else {
        content = element.innerText || "";
      }
    }

    // Remove slash command from content
    if (content.startsWith("/")) {
      content = "";
    }

    updateBlock(blockId, {
      type: newType,
      content,
      checked: newType === "todo" ? false : undefined
    });

    setMenuOpen(false);
    setTimeout(() => {
      const newElement = blockRefs.current[blockId];
      if (newElement) {
        if (newType === "todo") {
          const span = newElement.querySelector("span");
          span?.focus();
        } else {
          newElement.focus();
        }
      }
    }, 0);
  };

  const filteredBlockTypes = BLOCK_TYPES.filter((bt) =>
    menuFilter === "/" || bt.command.includes(menuFilter) || bt.label.toLowerCase().includes(menuFilter.slice(1))
  );

  const renderBlock = (block: Block, index: number) => {
    const placeholder = index === 0 && block.content === ""
      ? "Type '/' for commands, or start writing..."
      : "Type '/' for commands";

    if (block.type === "todo") {
      return (
        <div
          className="block-content todo"
          ref={(el) => {
            blockRefs.current[block.id] = el;
          }}
          onFocus={() => setFocusedBlockId(block.id)}
        >
          <input
            type="checkbox"
            checked={block.checked || false}
            onChange={(e) => updateBlock(block.id, { checked: e.target.checked })}
          />
          <span
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => handleInput(e, block)}
            onKeyDown={(e) => handleKeyDown(e, block)}
            data-placeholder={placeholder}
            style={{
              textDecoration: block.checked ? "line-through" : "none",
              opacity: block.checked ? 0.5 : 1,
            }}
          >
            {block.content}
          </span>
        </div>
      );
    }

    const className = block.type === "text" ? "block-content" : `block-content ${block.type}`;

    return (
      <div
        className={className}
        contentEditable
        suppressContentEditableWarning
        ref={(el) => {
          blockRefs.current[block.id] = el;
        }}
        onInput={(e) => handleInput(e, block)}
        onKeyDown={(e) => handleKeyDown(e, block)}
        onFocus={() => setFocusedBlockId(block.id)}
        data-placeholder={placeholder}
      >
        {block.content}
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".block-menu")) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-24 py-16">
        <div className="mb-8">
          <input
            type="text"
            placeholder="Untitled"
            className="text-5xl font-bold w-full outline-none border-none bg-transparent"
            style={{ color: "#37352f" }}
          />
        </div>

        <div className="space-y-0">
          {blocks.map((block, index) => (
            <div key={block.id} className="relative block-wrapper">
              <div className="block-controls">
                <button className="block-control-btn" title="Drag to move">
                  ⋮⋮
                </button>
                <button
                  className="block-control-btn"
                  title="Add block"
                  onClick={() => addBlock(block.id)}
                >
                  +
                </button>
              </div>
              {block.type === "numbered" && (
                <span style={{
                  position: "absolute",
                  left: "0.5em",
                  color: "#37352f"
                }}>
                  {index + 1}.
                </span>
              )}
              {renderBlock(block, index)}
            </div>
          ))}
        </div>

        {menuOpen && (
          <div
            className="block-menu"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {filteredBlockTypes.map((bt) => (
              <div
                key={bt.type}
                className="block-menu-item"
                onClick={() => applyBlockType(focusedBlockId, bt.type)}
              >
                <div className="block-menu-item-icon">{bt.icon}</div>
                <div>
                  <div className="block-menu-item-text">{bt.label}</div>
                  <div className="block-menu-item-desc">{bt.desc}</div>
                </div>
              </div>
            ))}
            {filteredBlockTypes.length === 0 && (
              <div className="block-menu-item" style={{ cursor: "default" }}>
                <div className="block-menu-item-text">No results</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
