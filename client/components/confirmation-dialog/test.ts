import { querySingle } from "../test-utils.js";

export function playground() {
  console.log("Starting Confirmation Dialog playground test...");

  const showButton = querySingle("#show-dialog");
  showButton.addEventListener("click", () => {
    // Create and append the dialog
    const dialog = document.createElement("confirmation-dialog");
    dialog.setAttribute(
      "message",
      "Are you sure you want to delete this item?",
    );
    dialog.setAttribute("confirm-text", "Delete");
    dialog.setAttribute("cancel-text", "Cancel");

    document.body.appendChild(dialog);

    // Test event listeners
    dialog.addEventListener("confirm", () => {
      console.log("Confirm button clicked");
      querySingle("#test-output").textContent = "Confirmed: Item deleted";
      dialog.remove();
    });

    dialog.addEventListener("cancel", () => {
      console.log("Cancel button clicked");
      querySingle("#test-output").textContent = "Cancelled: Action aborted";
      dialog.remove();
    });

    // Test attribute changes
    setTimeout(() => {
      console.log("Testing attribute changes...");
      dialog.setAttribute(
        "message",
        "Updated message: This action cannot be undone.",
      );
      dialog.setAttribute("confirm-text", "Yes, Delete");
    }, 1000);
  });

  console.log("Confirmation Dialog playground test initialized");
}
