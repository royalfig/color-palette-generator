import { Button } from "@/components/Button/Button";
import { useThemeDownload } from "@/hooks/useThemeDownload";
import { FORMATS } from "@/lib/const";
import { Menu } from "@base-ui/react/menu";
import type { ThemeFormat } from "@royalfig/color-palette-pro";
import {
  CaretDownIcon,
  DownloadSimpleIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import "./ThemeDownload.css";
import { useTheme } from "@/hooks/useTheme";

// Split button: the main button downloads every selected format; the caret
// opens a menu to choose which editor/terminal formats are included.
export function ThemeDownload() {
  const { downloadTheme } = useThemeDownload();
  const { formats, setFormats } = useTheme();

  function updateFormats(format: ThemeFormat, add: boolean) {
    const newFormats = [...formats];

    if (add) {
      newFormats.push(format);
      setFormats(newFormats);
      return;
    }

    const filteredFormats = newFormats.filter((f) => f !== format);
    setFormats(filteredFormats);
  }

  function downloadThemes() {
    for (const format of formats) {
      downloadTheme(format);
    }
  }

  return (
    <div className="cc-split">
      <Button
        variant="primary"
        className="cc-split-main"
        icon={<DownloadSimpleIcon size={14} />}
        onClick={downloadThemes}
      >
        Download theme
      </Button>

      <Menu.Root>
        <Menu.Trigger
          render={
            <Button
              variant="primary"
              className="cc-split-caret"
              aria-label="Choose theme format"
              icon={<CaretDownIcon size={14} />}
            />
          }
        />
        <Menu.Portal>
          <Menu.Positioner
            className="cc-positioner"
            sideOffset={8}
            side="top"
            align="end"
          >
            <Menu.Popup className="cc-popup cc-select-popup">
              {FORMATS.map(({ value, label }) => (
                <Menu.CheckboxItem
                  key={value}
                  checked={formats.includes(value)}
                  onCheckedChange={(e) => updateFormats(value, e)}
                  className="cc-select-item"
                >
                  <Menu.CheckboxItemIndicator className="cc-list-indicator">
                    <CheckIcon size={"1em"} />
                  </Menu.CheckboxItemIndicator>
                  <span className="cc-list-text">{label}</span>
                </Menu.CheckboxItem>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}
