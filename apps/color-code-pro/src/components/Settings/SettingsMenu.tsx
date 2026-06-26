import { Button, IconButton } from "@/components/Button/Button";
import { useTheme } from "@/hooks/useTheme";
import { useThemeDownload } from "@/hooks/useThemeDownload";
import baseCss from "@/lib/base.css?raw";
import baseJs from "@/lib/base.js?raw";
import { Menu } from "@base-ui/react/menu";
import { Switch } from "@base-ui/react/switch";
import {
  ArrowSquareOutIcon,
  CircleIcon,
  DownloadSimpleIcon,
  GearIcon,
} from "@phosphor-icons/react";
import { useCallback, useId } from "react";
import "./SettingsMenu.css";
import "./SnippetSwitch.css";

function GitHubLogo() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 98 96" fill="none">
      <g clipPath="url(#clip0_730_27126)">
        <path
          d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-07 48.9043 4.309e-07C21.8203 1.92261e-07 -1.9479e-07 22.1074 -4.3343e-07 49.1914C-6.20631e-07 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_730_27126">
          <rect width="98" height="96" fill="var(--color-surface)" />
        </clipPath>
      </defs>
    </svg>
  );
}

// Inline version of the dynamic favicon: stacked palette color bands clipped to
// a rounded square. Mirrors the canvas favicon drawn in themeProvider.
function PaletteMark({
  colors,
  size = 18,
}: {
  colors: string[];
  size?: number;
}) {
  const clipId = useId();
  const bands = colors.slice(0, 5);
  const pad = 4;
  const inner = 64 - pad * 2;
  const bandH = bands.length ? inner / bands.length : inner;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect width="64" height="64" rx="12" fill="#12121f" />
      <clipPath id={clipId}>
        <rect x={pad} y={pad} width={inner} height={inner} rx="8" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        {bands.map((color, i) => (
          <rect
            key={i}
            x={pad}
            y={pad + i * bandH}
            width={inner}
            height={bandH}
            fill={color}
          />
        ))}
      </g>
    </svg>
  );
}

export function SettingsMenu() {
  const {
    paletteKind,
    paletteStyle,
    uiVarsPair,
    palette,
    baseColor,
    mode,
    setMode,
  } = useTheme();
  const { downloadFile } = useThemeDownload();

  const downloadCss = useCallback(() => {
    const scope = (selector: string, vars: string) =>
      `${selector} {\n${vars.replace(/^/gm, "  ")}\n}`;
    const css = [
      scope(".cc-light", uiVarsPair.light.css),
      scope(".cc-dark", uiVarsPair.dark.css),
      baseCss,
    ].join("\n\n");
    downloadFile(css, "color-code-base.css", "text/css");
  }, [uiVarsPair, downloadFile]);

  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <IconButton variant="ghost" aria-label="Settings">
            <GearIcon size={14} />
          </IconButton>
        }
      ></Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          className="cc-positioner"
          sideOffset={8}
          side="bottom"
          align="end"
        >
          <Menu.Popup className="cc-popup">
            <p className="cc-menu-title">
              <PaletteMark colors={palette.map((c) => c.cssValue)} />
              ColorCode Pro
            </p>

            <p className="cc-group-label">Snippet Base</p>

            <label className="cc-switch-label">
              <Switch.Root
                checked={mode === "snippet"}
                className="cc-switch"
                onCheckedChange={(checked) => {
                  setMode(checked ? "snippet" : "theme");
                }}
              >
                <Switch.Thumb className="cc-switch-thumb" />
              </Switch.Root>
              Snippet Mode
            </label>

            <Button
              variant="ghost"
              onClick={downloadCss}
              icon={<DownloadSimpleIcon size={14} />}
            >
              CSS
            </Button>

            <Button
              variant="ghost"
              onClick={() =>
                downloadFile(
                  baseJs,
                  "color-code-base.js",
                  "application/javascript",
                )
              }
              icon={<DownloadSimpleIcon size={14} />}
            >
              JS
            </Button>
            <p className="cc-group-label">Resources</p>

            <a
              className="cc-settings-link"
              target="_blank"
              href={`https://colorpalette.pro?color=${encodeURIComponent(baseColor)}&colorFormat=hex&paletteType=${paletteKind}&paletteStyle=${paletteStyle}`}
            >
              <span>
                <CircleIcon color={baseColor} weight="fill" size={"1em"} />{" "}
                ColorPalette Pro
              </span>
              <ArrowSquareOutIcon size={"1em"} />
            </a>
            <a
              className="cc-settings-link"
              target="_blank"
              href="https://github.com/royalfig/color-code-pro"
            >
              <span>
                <GitHubLogo />
                GitHub
              </span>
              <ArrowSquareOutIcon size={"1em"} />
            </a>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
