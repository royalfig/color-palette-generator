(function () {
  const copySvg = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6ZM7 11H13V13H7V11ZM7 15H13V17H7V15Z"></path></svg>`;
  const checkSvg = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 17.9993L3.63574 11.6354L5.04996 10.2212L9.9997 15.1709Z"></path></svg>`;

  // Progressive enhancement. The copied snippet is a self-contained, inline-styled
  // block that renders anywhere — including email, where this script never runs.
  // On the web it overlays a copy button on each block; in email there's simply
  // no button, which is exactly what we want.
  function enhance() {
    const blocks = document.querySelectorAll(".cc-code");
    for (const block of blocks) {
      if (block.dataset.ccEnhanced) continue;
      const pre = block.querySelector("pre");
      const cell = pre && pre.parentElement.firstChild;
      if (!pre || !cell) continue;
      block.dataset.ccEnhanced = "1";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cc-code-copy";
      btn.setAttribute("aria-label", "Copy code");
      btn.innerHTML = copySvg;

      btn.addEventListener("click", async () => {
        const code = pre.textContent;
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code);
          btn.innerHTML = checkSvg;
          setTimeout(() => {
            btn.innerHTML = copySvg;
          }, 2000);
        } catch (err) {
          console.error("Failed to copy code", err);
        }
      });

      cell.appendChild(btn);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhance);
  } else {
    enhance();
  }
})();
