import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { TreeDisplaySettings } from "@/types/member";
import { 
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Plus, Minus, 
  ExternalLink, MoreVertical, Pen, UserPlus, Heart, EyeOff, Trash 
} from "lucide-react";
import { TreeMember } from "./useFamilyTreeLayout";

export interface FamilyNodeData {
  member: TreeMember;
  isExportMode?: boolean;
  maxHeight?: number;
  hasHiddenChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  isHighlighted?: boolean;
  direction: 'TB' | 'LR';
  isFirstSibling?: boolean;
  isLastSibling?: boolean;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  maxWidth?: number;
  onEdit?: () => void;
  onAddSpouse?: () => void;
  onAddChild?: () => void;
  onHide?: () => void;
  onDelete?: () => void;
  isMenuOpen?: boolean;
  onMenuToggle?: (id: string | null) => void;
  displaySettings?: TreeDisplaySettings;
}

// ------------------------------------------------------------------
// Utils
// ------------------------------------------------------------------
function getYear(dateString?: string | null): string {
  if (!dateString) return "";
  const year = new Date(dateString).getFullYear();
  return isNaN(year) ? "" : String(year);
}

function calcAge(birth?: string | null, death?: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth).getFullYear();
  const d = death ? new Date(death).getFullYear() : new Date().getFullYear();
  return isNaN(b) ? null : d - b;
}

// ------------------------------------------------------------------
// Sub-Renderers (Separated for Clean Code)
// ------------------------------------------------------------------

interface RenderProps {
  member: TreeMember;
  data: FamilyNodeData;
  isMale: boolean;
  isDeceased: boolean;
  hasWives: boolean;
  nameColor: string;
  highlightBorder: string;
  displaySettings?: TreeDisplaySettings;
}

/**
 * QuickActionMenu - Popover menu for card actions
 */
function QuickActionMenu({ data }: { data: FamilyNodeData }) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  if (data.isExportMode) return null;

  const menuItems = [
    { label: "Sửa thông tin", icon: Pen, onClick: data.onEdit, color: "hover:text-blue-600" },
    { label: "Thêm Vợ/Chồng", icon: Heart, onClick: data.onAddSpouse, color: "hover:text-rose-600" },
    { label: "Thêm Con cái", icon: UserPlus, onClick: data.onAddChild, color: "hover:text-emerald-600" },
    { label: "Ẩn khỏi cây", icon: EyeOff, onClick: data.onHide, color: "hover:text-amber-600" },
    { label: "Xóa khỏi gia phả", icon: Trash, onClick: data.onDelete, color: "hover:text-red-400", border: true },
  ].filter(item => typeof item.onClick === 'function' && item.onClick.toString() !== "() => {}");

  if (menuItems.length === 0 || data.isExportMode) return null;

  const isOpen = data.isMenuOpen;
  const setIsOpen = (val: boolean) => {
    if (data.onMenuToggle) {
      data.onMenuToggle(val ? data.member.id : null);
    }
  };

  return (
    <div className="absolute top-2 right-2 z-[60]" ref={containerRef}>
      <button
        onClick={(e) => { 
          e.stopPropagation(); 
          setIsOpen(!isOpen); 
        }}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 
          ${isOpen ? "bg-slate-800 text-white shadow-lg rotate-90" : "bg-white/40 text-slate-500 hover:bg-white/80 hover:text-slate-800 border border-white/50 backdrop-blur-sm"}
          opacity-0 group-hover:opacity-100 shadow-sm`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-10 right-0 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-2 animate-in fade-in zoom-in slide-in-from-top-2 duration-200 origin-top-right overflow-hidden z-[100]">
          <div className="px-3 py-1.5 mb-1 border-b border-white/5">
             <p className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Thao tác nhanh</p>
          </div>
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                if (item.onClick) item.onClick();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-white/80 transition-all active:scale-95 text-left
                ${item.color} ${item.border ? "mt-1 pt-3 border-t border-white/5 text-red-400" : "hover:bg-white/5"}`}
            >
              <item.icon className="w-4 h-4 opacity-50" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 1. Mức MINI (Siêu Nhỏ - Cho Đời 7 trở đi trong export mode)
 */
function renderMiniMode({ member, isDeceased, hasWives, nameColor, highlightBorder }: RenderProps) {
  return (
    <div className={`relative w-[120px] rounded-lg pb-1 transition-all flex flex-col items-center justify-center pt-1.5 overflow-hidden z-10 ${highlightBorder}`}>
      {isDeceased && (
        <div className="absolute top-0 left-0 w-6 h-6 overflow-hidden z-20">
          <div className="w-8 h-2 bg-[#1C1917] -rotate-45 -translate-x-[0.5rem] translate-y-[0.3rem]" />
        </div>
      )}
      <h3 className={`font-serif text-[12px] leading-snug mt-1 text-center px-1.5 w-full font-bold ${nameColor}`}>
         {member.fullName}
      </h3>
      {hasWives && (
         <div className="text-[9px] text-pink-700 font-serif font-bold truncate px-1 w-full text-center mt-0.5">
           {member.spouses.map(s => s.fullName).join(", ")}
         </div>
      )}
    </div>
  );
}

/**
 * 2. Mức COMPACT (Gọn Gàng - Cho Đời 4 đến 6 trong export mode)
 */
function renderCompactMode({ member, data, isDeceased, hasWives, nameColor, highlightBorder }: RenderProps) {
  return (
    <div className={`relative w-[170px] rounded-xl transition-all pb-1.5 z-10 group ${highlightBorder}`}>
      <QuickActionMenu data={data} />
      {isDeceased && (
        <div className="absolute top-0 left-0 w-8 h-8 overflow-hidden z-20">
          <div className="absolute top-0 left-0 w-[140%] h-3 bg-[#1C1917] -rotate-45 -translate-x-[0.8rem] translate-y-0.5" />
        </div>
      )}
      
      <div className="p-2 pt-3 relative z-10 flex flex-col items-center text-center">
        <h3 className={`font-serif text-[15px] font-bold truncate w-full px-2 ${nameColor}`}>
          {member.fullName}
        </h3>
        <p className="text-[10px] font-mono mt-0.5 text-slate-600 font-bold">
           ★ {getYear(member.dateOfBirth) || "--"} {isDeceased && `† ${getYear(member.dateOfDeath) || "--"}`}
        </p>
      </div>
      
      {hasWives && (
        <div className="px-2 pb-1 relative z-10 border-t border-slate-200 pt-1">
           <div className="text-[10.5px] text-pink-700 font-bold font-serif truncate text-center">
             {member.spouses.length > 1 ? `Vợ: ${member.spouses.length} phu nhân` : `Vợ: ${member.spouses[0].fullName}`}
           </div>
        </div>
      )}

      {/* Nút cộng/trừ trong giao diện (ẩn trong lúc xuất PDF/SVG) */}
      {data.hasHiddenChildren && !data.isExpanded && !data.isExportMode && (
        <button
          onClick={(e) => { e.stopPropagation(); data.onToggle(); }}
          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-5 rounded-full shadow flex items-center justify-center border-2 border-white text-white z-30 bg-slate-500"
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
      {data.isExpanded && member.childIds && member.childIds.length > 0 && !data.isExportMode && (
        <button
          onClick={(e) => { e.stopPropagation(); data.onToggle(); }}
          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-5 rounded-full shadow flex items-center justify-center border-2 border-white text-white bg-slate-400 z-30"
        >
          <Minus className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/**
 * 3. Mức FULL (Đầy Đủ - Mặc định trên web, Đời 1-3 trong export mode)
 */
function renderFullMode({ member, data, isDeceased, hasWives, nameColor, highlightBorder, displaySettings }: RenderProps) {
  const age = calcAge(member.dateOfBirth, member.dateOfDeath);
  const settings = displaySettings || {
    showAvatar: true,
    showDates: true,
    showGeneration: true,
    showHonorifics: true,
    showOccupation: true,
    showSpouses: true,
    showBranch: true
  };

  return (
    <div className={`relative w-[240px] rounded-2xl transition-all pb-3 bg-white z-10 group shadow-sm hover:shadow-xl ${highlightBorder}`}>
      <QuickActionMenu data={data} />
      
      {/* Dải chéo góc trên bên trái cho người đã mất */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        {isDeceased && (
          <div className="absolute top-0 left-0 w-12 h-12 z-20">
            <div className="absolute top-0 left-0 w-[140%] h-4 bg-[#1C1917] -rotate-45 -translate-x-[1.2rem] translate-y-1 shadow-sm" />
          </div>
        )}
      </div>

      <div className="p-4 pt-4 relative z-10">
        {/* Badge đời & Chi (Center Top) */}
        {settings.showGeneration && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full text-[11px] font-black bg-white border-2 border-slate-200 shadow-sm text-slate-600 tracking-wider whitespace-nowrap z-20 flex items-center gap-1.5 min-w-[100px] justify-center">
            <span className="uppercase tracking-[0.1em]">Đời {member.generation}</span>
            {settings.showBranch && member.branch && (
               <>
                 <span className="w-1 h-1 rounded-full bg-slate-300" />
                 <span className="text-primary font-bold">{member.branch}</span>
               </>
            )}
          </div>
        )}

        <div className={isDeceased ? "pl-7" : ""}>
          {/* Tên chính */}
          <h3 className={`font-serif text-[20px] leading-tight font-bold ${nameColor}`} style={{ wordBreak: 'break-word' }}>
            {member.fullName}
          </h3>

          {/* Hiệu / Tự */}
          {settings.showHonorifics && (member.honorific || member.alias) && (
            <p className="text-[11.5px] italic text-slate-500 mt-0.5 font-serif">
              {member.honorific ? `Hiệu: ${member.honorific}` : `Tự: ${member.alias}`}
            </p>
          )}

          {/* Năm sinh / mất */}
          {settings.showDates && (
             <>
                <p className="text-[13px] font-mono mt-1.5 text-slate-700 font-semibold tracking-wide">
                  ★ {getYear(member.dateOfBirth) || "--"}
                  {isDeceased && (
                    <span className="text-slate-500"> &nbsp;† {getYear(member.dateOfDeath) || "--"}</span>
                  )}
                </p>
                {/* Tuổi thọ */}
                {isDeceased && age !== null && (
                  <p className="text-[11px] font-serif text-slate-500 mt-0.5">
                    {age >= 70 ? `Hưởng thọ ${age} tuổi` : `Hưởng dương ${age} tuổi`}
                  </p>
                )}
             </>
          )}

          {/* Nghề nghiệp / Chức vị */}
          {settings.showOccupation && (member.occupation || member.title) && (
            <p className="text-[12px] font-medium text-slate-600 mt-1.5 truncate w-full">
              {member.title || member.occupation}
            </p>
          )}
        </div>
      </div>

      {/* Danh sách phu nhân (Compact Chips) */}
      {settings.showSpouses && hasWives && (
        <div className="px-4 pb-1 relative z-10">
          <div className="pt-2 border-t border-slate-100/60">
            <div className="flex flex-wrap gap-1.5">
               {member.spouses.map((wife) => (
                  <div key={wife.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-pink-50/40 border border-pink-100 hover:bg-pink-100 transition-colors group/spouse">
                    <span className="text-[9px] font-bold text-pink-400 uppercase tracking-tighter">{wife.rank === "Chính thất" ? "C" : wife.rank?.toString().substring(0, 1) || "T"}</span>
                    <span className={`text-[12px] font-medium font-serif ${wife.isAlive ? "text-pink-800" : "text-slate-400"}`}>{wife.fullName}</span>
                  </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* Nút expand/collapse */}
      {data.hasHiddenChildren && !data.isExpanded && !data.isExportMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggle();
          }}
          className={`absolute rounded-full shadow-md flex items-center justify-center border-2 border-white cursor-pointer hover:scale-110 active:scale-95 transition-all text-white z-30 bg-slate-500
            ${data.direction === 'LR' 
              ? "-right-3.5 top-1/2 -translate-y-1/2 w-7 h-8" 
              : "-bottom-3.5 left-1/2 -translate-x-1/2 w-8 h-7"}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
      
      {data.isExpanded && member.childIds && member.childIds.length > 0 && !data.isExportMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggle();
          }}
          className={`absolute rounded-full shadow-md flex items-center justify-center border-2 border-white cursor-pointer hover:scale-110 active:scale-95 transition-all text-white bg-slate-400 hover:bg-slate-500 z-30
            ${data.direction === 'LR' 
              ? "-right-3.5 top-1/2 -translate-y-1/2 w-7 h-8" 
              : "-bottom-3.5 left-1/2 -translate-x-1/2 w-8 h-7"}`}
        >
          <Minus className="w-4 h-4" />
        </button>
      )}

      {/* Nút đổi thứ tự anh chị em — hover mới hiện, nằm chính giữa border trái/phải */}
      {!data.isExportMode && !data.isFirstSibling && data.onMoveLeft && (
        <button
          onClick={(e) => { e.stopPropagation(); data.onMoveLeft!(); }}
          title={data.direction === 'LR' ? 'Di chuyển lên (sinh trước)' : 'Di chuyển sang trái (sinh trước)'}
          className={`absolute z-30 w-7 h-7 flex items-center justify-center rounded-full bg-amber-100 border-2 border-amber-400 shadow-md cursor-pointer
            hover:bg-amber-300 hover:border-amber-500 hover:shadow-lg active:scale-90
            transition-all duration-200
            opacity-0 group-hover:opacity-100
            ${data.direction === 'LR'
              ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
              : 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2'
            }`}
        >
          {data.direction === 'LR'
            ? <ChevronUp className="w-4 h-4 text-amber-700 stroke-[2.5]" />
            : <ChevronLeft className="w-4 h-4 text-amber-700 stroke-[2.5]" />}
        </button>
      )}
      {!data.isExportMode && !data.isLastSibling && data.onMoveRight && (
        <button
          onClick={(e) => { e.stopPropagation(); data.onMoveRight!(); }}
          title={data.direction === 'LR' ? 'Di chuyển xuống (sinh sau)' : 'Di chuyển sang phải (sinh sau)'}
          className={`absolute z-30 w-7 h-7 flex items-center justify-center rounded-full bg-amber-100 border-2 border-amber-400 shadow-md cursor-pointer
            hover:bg-amber-300 hover:border-amber-500 hover:shadow-lg active:scale-90
            transition-all duration-200
            opacity-0 group-hover:opacity-100
            ${data.direction === 'LR'
              ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'
              : 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2'
            }`}
        >
          {data.direction === 'LR'
            ? <ChevronDown className="w-4 h-4 text-amber-700 stroke-[2.5]" />
            : <ChevronRight className="w-4 h-4 text-amber-700 stroke-[2.5]" />}
        </button>
      )}

      {/* Nút tách nhánh (Clone/Mở sub-tree) */}
      {!data.isExportMode && member.childIds && member.childIds.length > 0 && (
        <a 
          href={`/tree/${member.id}`} 
          target="_blank" 
          rel="noopener noreferrer"
          title="Mở nhánh cây từ người này ở tab mới"
          onClick={(e) => e.stopPropagation()}
          className="absolute z-40 -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-600 shadow-md cursor-pointer hover:bg-indigo-600 hover:border-indigo-600 hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 opacity-0 group-hover:opacity-100"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------

const FamilyNodeComponent = ({ data }: { data: FamilyNodeData }) => {
  const member = data.member;
  const isMale = member.gender === "MALE";
  const isDeceased = !member.isAlive;
  const isAlive = member.isAlive;
  const gen = member.generation || 1;

  let cardBg = "";
  let nameColor = "";

  // Set colors based on gender and status
  if (isMale) {
    if (isAlive) {
      cardBg = "bg-white border-blue-600 border-[2.5px] shadow-md";
      nameColor = "text-blue-800 font-bold";
    } else {
      cardBg = "bg-slate-50 border-slate-500 border-[2.5px] shadow-sm";
      nameColor = "text-slate-800 font-bold";
    }
  } else {
    if (isAlive) {
      cardBg = "bg-white border-pink-500 border-[2.5px] shadow-md";
      nameColor = "text-pink-800 font-bold";
    } else {
      cardBg = "bg-rose-50 border-rose-400 border-[2.5px] shadow-sm";
      nameColor = "text-rose-900 font-bold";
    }
  }

  // Highlight styling - Premium Glow effect
  const isHighlighted = data.isHighlighted; 
  const highlightBorder = isHighlighted 
    ? "border-yellow-500 border-[3.5px] shadow-[0_0_25px_rgba(234,179,8,0.4)] bg-white ring-4 ring-yellow-400/20 z-[50] scale-[1.02]" 
    : cardBg;
  const hasWives = (member.spouses?.length || 0) > 0;

  // Prepare props to pass to sub-renderers
  const renderProps: RenderProps = {
    member,
    data,
    isMale,
    isDeceased,
    hasWives,
    nameColor,
    highlightBorder,
    displaySettings: data.displaySettings,
  };

  // Determine rendering mode
  let innerContent;
  if (data.isExportMode && gen >= 7) {
    innerContent = renderMiniMode(renderProps);
  } else if (data.isExportMode && gen >= 4) {
    innerContent = renderCompactMode(renderProps);
  } else {
    innerContent = renderFullMode(renderProps);
  }

  // WRAPPER: Trong export mode dọc, ép height = maxHeight để các đường nối thẳng hàng.
  // Trong export mode ngang, ép width = maxWidth để các điểm nối (Handle) thẳng hàng.
  const wrapperStyle = React.useMemo(() => {
    if (!data.isExportMode) return undefined;
    if (data.direction === 'TB' && data.maxHeight) return { height: `${data.maxHeight}px` };
    if (data.direction === 'LR' && data.maxWidth) return { width: `${data.maxWidth}px` }; 
    return undefined;
  }, [data.isExportMode, data.direction, data.maxHeight, data.maxWidth]);

  return (
    <div
      className="relative flex flex-col items-center justify-start pointer-events-auto group"
      style={wrapperStyle}
    >
      <Handle 
        type="target" 
        position={data.direction === 'LR' ? Position.Left : Position.Top} 
        style={{ opacity: 0 }} 
      />
      {innerContent}
      <Handle 
        type="source" 
        position={data.direction === 'LR' ? Position.Right : Position.Bottom} 
        style={{ opacity: 0 }} 
      />
    </div>
  );
};

export const FamilyNode = memo(FamilyNodeComponent);
