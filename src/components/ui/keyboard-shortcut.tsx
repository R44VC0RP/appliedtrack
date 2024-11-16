import { Command, ArrowUp, CornerDownLeft, ArrowLeftFromLine } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface KeyboardShortcutProps {
    text: string;
}

const ICON_MAPPINGS: Record<string, LucideIcon> = {
    'enter': CornerDownLeft,
    'cmd': Command,
    'up': ArrowUp,
    'left': ArrowLeftFromLine,
} as const;

export default function KeyboardShortcut({ text }: KeyboardShortcutProps) {
    if (!text) return null;
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

    const renderIcon = (iconKey: string) => {
        const Icon = ICON_MAPPINGS[iconKey.toLowerCase()];
        return Icon ? <Icon className="h-3 w-3" /> : iconKey;
    };

    if (text.includes("cmd")) {
        const [_, secondPart] = text.split(" + ");
        return (
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 border-gray-400">
                <span className="text-xs inline-flex items-center gap-1">
                    {isMac ? renderIcon('cmd') : renderIcon('up')} + {renderIcon(secondPart)}
                </span>
            </kbd>
        )
    }

    return (
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 border-gray-400">
            <span className="text-xs inline-flex items-center gap-1">
                {renderIcon(text)}
            </span>
        </kbd>
    )
}

// Example Usage:
// <KeyboardShortcut text="cmd + arrowup" />