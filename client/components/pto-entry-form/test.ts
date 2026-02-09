import { querySingle } from "../test-utils.js";
import { addEventListener } from "../test-utils.js";
import { PtoEntryForm } from "./index.js";

export function playground() {
  console.log("Starting PTO Entry Form playground test...");

  const ptoForm = querySingle<PtoEntryForm>("pto-entry-form");
  const testOutput = querySingle<HTMLDivElement>("#test-output");
  const logList = ensureLogList(testOutput);

  const appendLog = (message: string) => {
    const item = document.createElement("li");
    item.textContent = message;
    logList.appendChild(item);
    testOutput.scrollTop = testOutput.scrollHeight;
  };

  // Test event listeners
  addEventListener(ptoForm, "pto-submit", (e: CustomEvent) => {
    console.log("PTO form submitted:", e.detail);
    const detail = e.detail as {
      ptoRequest?: { ptoType: string; hours: number };
      requests?: { type: string; hours: number; date: string }[];
    };
    if (detail.ptoRequest) {
      appendLog(
        `Form submit: ${detail.ptoRequest.ptoType} - ${detail.ptoRequest.hours} hours`,
      );
      return;
    }
    if (detail.requests) {
      appendLog(`Calendar submit: ${detail.requests.length} request(s)`);
      return;
    }
    appendLog("Submission received with no payload.");
  });

  addEventListener(ptoForm, "form-cancel", () => {
    console.log("PTO form cancelled");
    appendLog("Form cancel");
  });

  console.log("PTO Entry Form playground test initialized");
}

function ensureLogList(container: HTMLDivElement): HTMLUListElement {
  let list = container.querySelector<HTMLUListElement>("#test-log");
  if (list) {
    return list;
  }

  const title = document.createElement("div");
  title.textContent = "Event log:";
  title.style.fontWeight = "600";
  title.style.marginBottom = "8px";

  list = document.createElement("ul");
  list.id = "test-log";
  list.style.margin = "0";
  list.style.paddingLeft = "18px";

  container.textContent = "";
  container.appendChild(title);
  container.appendChild(list);
  return list;
}
