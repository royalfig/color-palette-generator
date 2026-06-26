import { PALETTE_LABELS } from "@/lib/const";
import { LANG_SHORT } from "@/lib/languages";
import type { PaletteKind } from "@/types";
import { Select } from "@base-ui/react/select";
import {
  CaretDownIcon,
  CaretUpIcon,
  CaretUpDownIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import "./Select.css";

export function LangSelect({
  handleLangChange,
  lang,
}: {
  handleLangChange: (newLang: string) => void;
  lang: string;
}) {
  // const currentLabel = LANG_SHORT[lang];

  const handleValChange = (val: string | null) => {
    if (!val) return;
    handleLangChange(val);
  };

  return (
    <div className="cc-field">
      <Select.Root
        items={LANG_SHORT}
        onValueChange={handleValChange}
        value={lang}
      >
        {/*<Select.Label className="cc-select-label">{currentLabel}</Select.Label>*/}
        <Select.Trigger className="cc-select-trigger">
          <Select.Value
            className="cc-trigger-value"
            placeholder="Select language"
          />
          <Select.Icon>
            <CaretUpDownIcon size={12} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="" sideOffset={4}>
            <Select.Popup className="cc-popup cc-select-popup">
              <Select.ScrollUpArrow className="cc-scroll-arrow">
                <CaretUpIcon size={12} />
              </Select.ScrollUpArrow>
              <Select.List className="cc-select-list">
                {Object.entries(LANG_SHORT).map(([value, label]) => (
                  <Select.Item
                    key={label}
                    value={value}
                    className="cc-select-item"
                  >
                    <Select.ItemIndicator className="cc-list-indicator">
                      <CheckIcon size={"1em"} />
                    </Select.ItemIndicator>
                    <Select.ItemText className="cc-list-text">
                      {label}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className="cc-scroll-arrow">
                <CaretDownIcon size={12} />
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

export function PaletteKindSelect({
  setPaletteKind,
  paletteKind,
}: {
  setPaletteKind: (kind: PaletteKind) => void;
  paletteKind: PaletteKind;
}) {
  const handleValChange = (val: string | null) => {
    if (!val) return;
    setPaletteKind(val as PaletteKind);
  };

  return (
    <div className="cc-field">
      <Select.Root
        items={PALETTE_LABELS}
        onValueChange={handleValChange}
        value={paletteKind}
      >
        <Select.Trigger className="cc-select-trigger">
          <Select.Value
            className="cc-trigger-value"
            placeholder="Palette kind"
          />
          <Select.Icon>
            <CaretUpDownIcon size={12} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="" sideOffset={4}>
            <Select.Popup className="cc-popup cc-select-popup">
              <Select.ScrollUpArrow className="cc-scroll-arrow">
                <CaretUpIcon size={12} />
              </Select.ScrollUpArrow>
              <Select.List className="cc-select-list">
                {(
                  Object.entries(PALETTE_LABELS) as [PaletteKind, string][]
                ).map(([value, label]) => (
                  <Select.Item
                    key={value}
                    value={value}
                    className="cc-select-item"
                  >
                    <Select.ItemIndicator className="cc-list-indicator">
                      <CheckIcon size={"1em"} />
                    </Select.ItemIndicator>
                    <Select.ItemText className="cc-list-text">
                      {label}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className="cc-scroll-arrow">
                <CaretDownIcon size={12} />
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
