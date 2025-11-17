/* Minimal interactivity wiring for the template */

document.addEventListener("DOMContentLoaded", () => {
  initializeFeatureTabs();
  initializeBillingToggle();
});

function initializeFeatureTabs() {
  const tabsRoot = document.getElementById("feature-tabs");
  if (!tabsRoot) return;
  const tabButtons = Array.from(tabsRoot.querySelectorAll('button[role="tab"]'));
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.getAttribute("data-feature");
      tabButtons.forEach((b) => {
        const isActive = b === button;
        b.setAttribute("aria-selected", String(isActive));
        b.classList.toggle("ring-1", isActive);
        b.classList.toggle("ring-inset", isActive);
        b.classList.toggle("ring-sky-500/30", isActive);
        b.classList.toggle("bg-sky-500/20", isActive);
        b.classList.toggle("text-sky-200", isActive);
        b.classList.toggle("text-white", !isActive);
        b.classList.toggle("hover:text-white", !isActive);
      });
      // Placeholder: Swap content based on `selected` if needed.
      // Hook here to show/hide feature panels tied to data-feature.
      console.debug("[feature-tabs] selected:", selected);
    });
  });
}

function initializeBillingToggle() {
  const billingRoot = document.getElementById("billing-toggle");
  if (!billingRoot) return;
  const periodButtons = Array.from(billingRoot.querySelectorAll('button[role="tab"]'));
  periodButtons.forEach((button) => {
    button.addEventListener("click", () => {
      periodButtons.forEach((b) => {
        const isActive = b === button;
        b.setAttribute("aria-selected", String(isActive));
        b.classList.toggle("ring-1", isActive);
        b.classList.toggle("ring-inset", isActive);
        b.classList.toggle("ring-sky-500/30", isActive);
        b.classList.toggle("bg-sky-500/20", isActive);
        b.classList.toggle("text-sky-200", isActive);
        b.classList.toggle("text-white", !isActive);
        b.classList.toggle("hover:text-white", !isActive);
      });
      const period = button.getAttribute("data-period");
      // Placeholder: Update pricing numbers according to selected period.
      console.debug("[billing-toggle] period:", period);
    });
  });
}



