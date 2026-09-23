import React, { useMemo } from 'react';
import { ArrowRight, ArrowLeft, RotateCw, X } from 'lucide-react';

interface SnakeFlowDiagramProps {
  activeNodes: { name: string; group?: string }[];
  onExclude: (name: string) => void;
}

export default function SnakeFlowDiagram({ activeNodes, onExclude }: SnakeFlowDiagramProps) {
  const allSnakeItems = useMemo(() => {
    if (activeNodes.length < 2) return [];
    const items = activeNodes.map((n, i) => ({
      name: n.name,
      group: n.group,
      idx: i + 1,
      isFirst: i === 0,
      isLoopback: false,
    }));
    items.push({ name: 'Khép vòng', group: '', idx: 0, isFirst: false, isLoopback: true });
    return items;
  }, [activeNodes]);

  const numRows = Math.ceil(allSnakeItems.length / 5);

  // Exact Layout Constants (All in Pixels - Designed to fit inside standard modal without clipping)
  const CARD_W = 122;
  const CARD_H = 46;
  const ARROW_W = 20;
  const SLOT_STEP = CARD_W + ARROW_W; // 142px
  const PITCH_Y = 74;
  const PAD_TOP = 16;
  const X_SPINE = 14;
  const X_CARDS_LEFT = 74;
  const ROW_CONTENT_W = 5 * CARD_W + 4 * ARROW_W; // 5 * 122 + 4 * 20 = 690px
  const X_CARDS_RIGHT = X_CARDS_LEFT + ROW_CONTENT_W; // 764px
  const TOTAL_W = 820;

  const khepSeq = allSnakeItems.length - 1;
  const rKhep = Math.floor(khepSeq / 5);
  const isKhepRtl = rKhep % 2 === 1;

  const totalHeight = PAD_TOP + numRows * PITCH_Y + (isKhepRtl ? 16 : 44);

  // U-turn Connectors between rows (Blue)
  const uTurnConnectors = useMemo(() => {
    if (numRows < 2) return [];
    const curves: { key: string; d: string; chevron: string }[] = [];

    for (let r = 0; r < numRows - 1; r++) {
      const y1 = PAD_TOP + r * PITCH_Y + CARD_H / 2; // 16 + r * 74 + 23 = 39 + r * 74
      const y2 = y1 + PITCH_Y; // y1 + 74

      if (r % 2 === 0) {
        // Right U-turn: LTR row -> RTL row (Semicircle radius 37 curving right)
        curves.push({
          key: `r-uturn-${r}`,
          d: `M ${X_CARDS_RIGHT} ${y1} L ${X_CARDS_RIGHT + 6} ${y1} A 37 37 0 0 1 ${X_CARDS_RIGHT + 6} ${y2} L ${X_CARDS_RIGHT + 4} ${y2}`,
          chevron: `M ${X_CARDS_RIGHT + 10} ${y2 - 4.5} L ${X_CARDS_RIGHT + 4} ${y2} L ${X_CARDS_RIGHT + 10} ${y2 + 4.5}`,
        });
      } else {
        // Left U-turn: RTL row -> LTR row (Semicircle radius 37 curving left)
        curves.push({
          key: `l-uturn-${r}`,
          d: `M ${X_CARDS_LEFT} ${y1} L ${X_CARDS_LEFT - 6} ${y1} A 37 37 0 0 0 ${X_CARDS_LEFT - 6} ${y2} L ${X_CARDS_LEFT - 4} ${y2}`,
          chevron: `M ${X_CARDS_LEFT - 10} ${y2 - 4.5} L ${X_CARDS_LEFT - 4} ${y2} L ${X_CARDS_LEFT - 10} ${y2 + 4.5}`,
        });
      }
    }
    return curves;
  }, [numRows]);

  // Loopback Connector from [Khép vòng] to Student 1 (Green)
  const { khepPath, khepChevron } = useMemo(() => {
    if (allSnakeItems.length < 2) return { khepPath: '', khepChevron: '' };

    const colKhep = khepSeq % 5;
    const yKhep = PAD_TOP + rKhep * PITCH_Y + CARD_H / 2;
    const yTarget = PAD_TOP + CARD_H / 2; // 39

    if (isKhepRtl) {
      // RTL row: [Khép vòng] receives from right, exits from its left edge
      const sKhep = 4 - colKhep;
      const xExit = X_CARDS_LEFT + sKhep * SLOT_STEP;
      return {
        khepPath: `M ${xExit} ${yKhep} L 26 ${yKhep} A 12 12 0 0 1 ${X_SPINE} ${yKhep - 12} L ${X_SPINE} ${yTarget + 12} A 12 12 0 0 1 26 ${yTarget} L ${X_CARDS_LEFT - 4} ${yTarget}`,
        khepChevron: `M ${X_CARDS_LEFT - 10} ${yTarget - 4.5} L ${X_CARDS_LEFT - 4} ${yTarget} L ${X_CARDS_LEFT - 10} ${yTarget + 4.5}`,
      };
    } else {
      // LTR row: [Khép vòng] receives from left, exits from its right edge and loops under row
      const sKhep = colKhep;
      const xExit = X_CARDS_LEFT + sKhep * SLOT_STEP + CARD_W;
      const yUnder = yKhep + 38;
      return {
        khepPath: `M ${xExit} ${yKhep} L ${xExit + 8} ${yKhep} A 12 12 0 0 1 ${xExit + 20} ${yKhep + 12} L ${xExit + 20} ${yUnder - 12} A 12 12 0 0 1 ${xExit + 8} ${yUnder} L 26 ${yUnder} A 12 12 0 0 1 ${X_SPINE} ${yUnder - 12} L ${X_SPINE} ${yTarget + 12} A 12 12 0 0 1 26 ${yTarget} L ${X_CARDS_LEFT - 4} ${yTarget}`,
        khepChevron: `M ${X_CARDS_LEFT - 10} ${yTarget - 4.5} L ${X_CARDS_LEFT - 4} ${yTarget} L ${X_CARDS_LEFT - 10} ${yTarget + 4.5}`,
      };
    }
  }, [allSnakeItems, khepSeq, rKhep, isKhepRtl]);

  return (
    <div className="w-full flex justify-center overflow-x-auto py-1">
      <div
        className="relative shrink-0 select-none"
        style={{ width: `${TOTAL_W}px`, height: `${totalHeight}px` }}
      >
        {/* SVG Connector Lines & Chevron Arrows Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none">
          {uTurnConnectors.map((c) => (
            <g key={c.key} className="text-blue-500 dark:text-blue-400">
              <path d={c.d} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d={c.chevron} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
          {khepPath && (
            <g className="text-emerald-500 dark:text-emerald-400">
              <path d={khepPath} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d={cChevron(khepChevron)} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
        </svg>

        {/* 5-Column Grid Rows */}
        {Array.from({ length: numRows }).map((_, r) => {
          const isRtl = r % 2 === 1;

          return (
            <div
              key={r}
              className="absolute flex items-center"
              style={{
                left: `${X_CARDS_LEFT}px`,
                top: `${PAD_TOP + r * PITCH_Y}px`,
                width: `${ROW_CONTENT_W}px`,
                height: `${CARD_H}px`,
              }}
            >
              {[0, 1, 2, 3, 4].map((s) => {
                const seqIdx = isRtl ? r * 5 + (4 - s) : r * 5 + s;
                const item = allSnakeItems[seqIdx];

                return (
                  <React.Fragment key={s}>
                    {/* Slot: Student Card or [Khép vòng] Badge or Spacer */}
                    <div className="w-[122px] h-[46px] shrink-0">
                      {item ? (
                        item.isLoopback ? (
                          <div className="w-full h-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md border border-emerald-500/40 transition select-none">
                            <RotateCw size={13} className="shrink-0" />
                            <span>Khép vòng</span>
                          </div>
                        ) : (
                          <div
                            onClick={() => onExclude(item.name)}
                            className={`group relative flex items-center justify-between w-full h-full px-2.5 rounded-2xl transition-all duration-150 cursor-pointer ${
                              item.isFirst
                                ? 'border-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/10 shadow-[0_0_14px_rgba(16,185,129,0.2)]'
                                : 'border border-blue-200/90 dark:border-white/10 bg-white dark:bg-[#161c30] shadow-2xs hover:border-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-500/10 hover:shadow-xs'
                            }`}
                            title={`Bấm để loại ${item.name} khỏi sơ đồ (không nộp BTVN)`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span
                                className={`w-5 h-5 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs ${
                                  item.isFirst ? 'bg-emerald-600 text-white' : 'bg-blue-500 text-white'
                                }`}
                              >
                                {item.idx}
                              </span>
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                                {item.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onExclude(item.name);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer border-0 shrink-0"
                              title="Loại học sinh này"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        )
                      ) : null}
                    </div>

                    {/* Inter-slot Horizontal Directional Arrow */}
                    {s < 4 && (
                      <div className="w-[20px] h-[46px] shrink-0 flex items-center justify-center">
                        {(() => {
                          const nextSeqIdx = isRtl ? r * 5 + (4 - (s + 1)) : r * 5 + (s + 1);
                          const hasBoth = item && allSnakeItems[nextSeqIdx];
                          if (!hasBoth) return null;
                          return isRtl ? (
                            <ArrowLeft size={16} className="text-blue-500 dark:text-blue-400" strokeWidth={2.5} />
                          ) : (
                            <ArrowRight size={16} className="text-blue-500 dark:text-blue-400" strokeWidth={2.5} />
                          );
                        })()}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper to keep JSX clean
function cChevron(c: string) {
  return c;
}
