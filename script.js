const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const storageKey = "portfolioEditorData";
const dataFile = "portfolio-data.json";
const editModeEnabled = location.protocol === "file:" || new URLSearchParams(location.search).has("edit");
const editLauncher = document.querySelector(".edit-launcher");
const editor = document.querySelector(".portfolio-editor");
const editorPanel = document.querySelector(".editor-panel");
const editorFields = document.querySelector("#editor-fields");
const editorClose = document.querySelector(".editor-close");

document.getElementById("year").textContent = new Date().getFullYear();

navToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  {
    rootMargin: "-35% 0px -55% 0px",
    threshold: 0,
  }
);

sections.forEach((section) => observer.observe(section));

const text = (selector) => document.querySelector(selector)?.textContent.trim() || "";
const listText = (selector) => [...document.querySelectorAll(selector)].map((item) => item.textContent.trim());

const defaultPortfolioData = {
  site: {
    ownerName: text(".brand-copy strong"),
    brandSubtitle: text(".brand-copy small"),
    heroEyebrow: text(".intro-copy .eyebrow"),
    lead: text(".intro-copy .lead"),
    about: document.querySelector(".intro-copy > p:not(.eyebrow):not(.lead)")?.textContent.trim() || "",
    roles: listText(".role-strip span"),
    portraitCaption: text(".portrait-frame figcaption"),
    footerQuote: text(".site-footer > span:last-child"),
  },
  stats: [...document.querySelectorAll(".stats-band div")].map((item) => ({
    number: item.querySelector("strong")?.textContent.trim() || "",
    label: item.querySelector("span")?.textContent.trim() || "",
  })),
  sections: {
    worksTitle: text("#works .section-heading h2"),
    worksIntro: text("#works .section-heading p:last-child"),
    galleryTitle: text("#gallery .section-heading h2"),
    galleryIntro: text("#gallery .section-heading p:last-child"),
    skillsTitle: text("#skills .section-heading h2"),
    contactTitle: text("#contact .section-heading h2"),
  },
  works: [...document.querySelectorAll(".work-card")].map((card) => ({
    image: card.querySelector("img")?.getAttribute("src") || "",
    kicker: card.querySelector(".work-kicker")?.textContent.trim() || "",
    title: card.querySelector("h3")?.textContent.trim() || "",
    description: card.querySelector(".work-info p:not(.work-kicker)")?.textContent.trim() || "",
    tags: [...card.querySelectorAll(".tag-row span")].map((tag) => tag.textContent.trim()),
    url: "",
  })),
  gallery: [...document.querySelectorAll(".gallery-grid img")].map((image) => ({
    image: image.getAttribute("src") || "",
    alt: image.getAttribute("alt") || "",
  })),
  skills: [...document.querySelectorAll(".skill-panel")].map((panel) => ({
    title: panel.querySelector("h3")?.textContent.trim() || "",
    description: panel.querySelector("p")?.textContent.trim() || "",
  })),
  contacts: [...document.querySelectorAll(".contact-card")].map((card) => ({
    label: card.querySelector("strong")?.textContent.trim() || "",
    value: card.querySelector("span")?.textContent.trim() || "",
    href: card.getAttribute("href") || "",
  })),
};

let publishedPortfolioData = {};
let portfolioData = mergeData(defaultPortfolioData, {});

function loadSavedData() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

async function loadPublishedData() {
  try {
    const response = await fetch(dataFile, { cache: "no-store" });
    if (!response.ok) return {};
    return await response.json();
  } catch {
    return {};
  }
}

function mergeData(base, override) {
  if (Array.isArray(base)) {
    return base.map((item, index) => mergeData(item, override?.[index] || {}));
  }

  if (!base || typeof base !== "object") {
    return override ?? base;
  }

  return Object.fromEntries(
    Object.entries(base).map(([key, value]) => [key, mergeData(value, override?.[key])])
  );
}

function getPath(path) {
  return path.split(".").reduce((current, key) => current?.[key], portfolioData);
}

function setPath(path, value) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => current[key], portfolioData);
  target[lastKey] = value;
}

function splitList(value) {
  return value
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function renderList(containerSelector, items) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.replaceChildren(...items.map((item) => {
    const span = document.createElement("span");
    span.textContent = item;
    return span;
  }));
}

function initialsFromName(name) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return initials || "PF";
}

function renderPortfolio() {
  document.title = `Portfolio | ${portfolioData.site.ownerName || "Your Name"}`;
  setText(".brand-copy strong", portfolioData.site.ownerName);
  setText(".brand-copy small", portfolioData.site.brandSubtitle);
  setText(".brand-mark", initialsFromName(portfolioData.site.ownerName));
  setText(".intro-copy .eyebrow", portfolioData.site.heroEyebrow);
  setText(".intro-copy h1", portfolioData.site.ownerName);
  setText(".intro-copy .lead", portfolioData.site.lead);
  setText(".intro-copy > p:not(.eyebrow):not(.lead)", portfolioData.site.about);
  setText(".portrait-frame figcaption", portfolioData.site.portraitCaption);
  setText(".site-footer > span:last-child", portfolioData.site.footerQuote);
  renderList(".role-strip", portfolioData.site.roles);

  const footerName = document.querySelector(".site-footer > span:first-child");
  if (footerName) {
    footerName.replaceChildren(
      document.createTextNode("© "),
      Object.assign(document.createElement("span"), {
        id: "year",
        textContent: new Date().getFullYear(),
      }),
      document.createTextNode(` ${portfolioData.site.ownerName}`)
    );
  }

  document.querySelectorAll(".stats-band div").forEach((item, index) => {
    const stat = portfolioData.stats[index];
    if (!stat) return;
    item.querySelector("strong").textContent = stat.number;
    item.querySelector("span").textContent = stat.label;
  });

  setText("#works .section-heading h2", portfolioData.sections.worksTitle);
  setText("#works .section-heading p:last-child", portfolioData.sections.worksIntro);
  setText("#gallery .section-heading h2", portfolioData.sections.galleryTitle);
  setText("#gallery .section-heading p:last-child", portfolioData.sections.galleryIntro);
  setText("#skills .section-heading h2", portfolioData.sections.skillsTitle);
  setText("#contact .section-heading h2", portfolioData.sections.contactTitle);

  document.querySelectorAll(".work-card").forEach((card, index) => {
    const work = portfolioData.works[index];
    if (!work) return;

    const image = card.querySelector("img");
    if (image) {
      image.src = work.image;
      image.alt = work.title;
    }

    setTextFor(card, ".work-kicker", work.kicker);
    setTextFor(card, "h3", work.title);
    setTextFor(card, ".work-info p:not(.work-kicker)", work.description);
    const tagRow = card.querySelector(".tag-row");
    if (tagRow) {
      tagRow.replaceChildren(...work.tags.map((tag) => {
        const span = document.createElement("span");
        span.textContent = tag;
        return span;
      }));
    }

    let workLink = card.querySelector(".work-link");
    if (!workLink) {
      workLink = document.createElement("a");
      workLink.className = "work-link";
      workLink.target = "_blank";
      workLink.rel = "noreferrer";
      workLink.textContent = "เปิดผลงาน";
      card.querySelector(".work-info")?.append(workLink);
    }

    workLink.href = work.url || "#";
    workLink.classList.toggle("is-visible", Boolean(work.url));
  });

  document.querySelectorAll(".gallery-grid img").forEach((image, index) => {
    const galleryItem = portfolioData.gallery[index];
    if (!galleryItem) return;
    image.src = galleryItem.image;
    image.alt = galleryItem.alt || `Gallery ${index + 1}`;
  });

  document.querySelectorAll(".skill-panel").forEach((panel, index) => {
    const skill = portfolioData.skills[index];
    if (!skill) return;
    setTextFor(panel, "h3", skill.title);
    setTextFor(panel, "p", skill.description);
  });

  document.querySelectorAll(".contact-card").forEach((card, index) => {
    const contact = portfolioData.contacts[index];
    if (!contact) return;
    card.href = contact.href;
    setTextFor(card, "strong", contact.label);
    setTextFor(card, "span", contact.value);
  });
}

function setTextFor(parent, selector, value) {
  const element = parent.querySelector(selector);
  if (element) element.textContent = value;
}

function field(label, path, type = "text") {
  return { label, path, type };
}

function buildEditorGroups() {
  return [
    {
      title: "ข้อมูลหลัก",
      fields: [
        field("ชื่อที่แสดง", "site.ownerName"),
        field("คำอธิบายใต้ชื่อ", "site.brandSubtitle"),
        field("Eyebrow เหนือชื่อ", "site.heroEyebrow"),
        field("ประโยคแนะนำตัว", "site.lead", "textarea"),
        field("About / ประวัติย่อ", "site.about", "textarea"),
        field("บทบาท / skill chips คั่นด้วย comma", "site.roles", "list"),
        field("คำใต้รูปโปรไฟล์", "site.portraitCaption"),
        field("ข้อความท้ายเว็บ", "site.footerQuote"),
      ],
    },
    {
      title: "ตัวเลขสรุป",
      fields: portfolioData.stats.flatMap((_, index) => [
        field(`ตัวเลข ${index + 1}`, `stats.${index}.number`),
        field(`คำอธิบาย ${index + 1}`, `stats.${index}.label`),
      ]),
    },
    {
      title: "หัวข้อแต่ละส่วน",
      fields: [
        field("หัวข้อผลงาน", "sections.worksTitle"),
        field("คำอธิบายผลงาน", "sections.worksIntro", "textarea"),
        field("หัวข้อ Gallery", "sections.galleryTitle"),
        field("คำอธิบาย Gallery", "sections.galleryIntro", "textarea"),
        field("หัวข้อ Skills", "sections.skillsTitle"),
        field("หัวข้อ Contact", "sections.contactTitle"),
      ],
    },
    ...portfolioData.works.map((_, index) => ({
      title: `ผลงาน ${index + 1}`,
      fields: [
        field("หมวดงาน", `works.${index}.kicker`),
        field("ชื่อผลงาน", `works.${index}.title`),
        field("รายละเอียด", `works.${index}.description`, "textarea"),
        field("Tags คั่นด้วย comma", `works.${index}.tags`, "list"),
        field("ลิงก์ผลงาน", `works.${index}.url`, "url"),
        field("รูปภาพ / URL หรือ path", `works.${index}.image`),
      ],
    })),
    {
      title: "Gallery",
      fields: portfolioData.gallery.flatMap((_, index) => [
        field(`รูป Gallery ${index + 1}`, `gallery.${index}.image`),
        field(`คำอธิบายรูป ${index + 1}`, `gallery.${index}.alt`),
      ]),
    },
    {
      title: "Skills",
      fields: portfolioData.skills.flatMap((_, index) => [
        field(`ชื่อทักษะ ${index + 1}`, `skills.${index}.title`),
        field(`รายละเอียดทักษะ ${index + 1}`, `skills.${index}.description`, "textarea"),
      ]),
    },
    {
      title: "Contact",
      fields: portfolioData.contacts.flatMap((_, index) => [
        field(`ชื่อช่องทาง ${index + 1}`, `contacts.${index}.label`),
        field(`ข้อความที่แสดง ${index + 1}`, `contacts.${index}.value`),
        field(`ลิงก์ ${index + 1}`, `contacts.${index}.href`),
      ]),
    },
  ];
}

function buildEditor() {
  editorFields.replaceChildren(...buildEditorGroups().map((group, index) => {
    const details = document.createElement("details");
    details.className = "editor-group";
    details.open = index < 2;

    const summary = document.createElement("summary");
    summary.textContent = group.title;
    details.append(summary);

    group.fields.forEach((config) => {
      const wrapper = document.createElement("div");
      wrapper.className = "editor-field";

      const id = `field-${config.path.replaceAll(".", "-")}`;
      const label = document.createElement("label");
      label.htmlFor = id;
      label.textContent = config.label;

      const input = document.createElement(config.type === "textarea" ? "textarea" : "input");
      input.id = id;
      input.name = config.path;
      input.dataset.path = config.path;
      input.dataset.type = config.type;
      input.type = "text";
      input.value = Array.isArray(getPath(config.path)) ? getPath(config.path).join(", ") : getPath(config.path);

      wrapper.append(label, input);
      details.append(wrapper);
    });

    return details;
  }));
}

function openEditor() {
  if (!editModeEnabled) return;
  buildEditor();
  editor.classList.add("open");
  editor.setAttribute("aria-hidden", "false");
  editLauncher.setAttribute("aria-expanded", "true");
  editor.querySelector("input, textarea")?.focus();
}

function closeEditor() {
  editor.classList.remove("open");
  editor.setAttribute("aria-hidden", "true");
  editLauncher.setAttribute("aria-expanded", "false");
  editLauncher.focus();
}

function saveData() {
  localStorage.setItem(storageKey, JSON.stringify(portfolioData));
  if (editLauncher.animate) {
    editLauncher.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.12)" },
        { transform: "scale(1)" },
      ],
      { duration: 260, easing: "ease-out" }
    );
  }
}

function exportData() {
  const file = new Blob([JSON.stringify(portfolioData, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "portfolio-data.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

editLauncher.addEventListener("click", openEditor);
editorClose.addEventListener("click", closeEditor);

editor.addEventListener("click", (event) => {
  if (event.target === editor) closeEditor();
});

editorPanel.addEventListener("input", (event) => {
  const input = event.target;
  if (!input.dataset.path) return;
  const value = input.dataset.type === "list" ? splitList(input.value) : input.value;
  setPath(input.dataset.path, value);
  renderPortfolio();
});

editorPanel.addEventListener("submit", (event) => {
  event.preventDefault();
  saveData();
  closeEditor();
});

editorPanel.addEventListener("click", (event) => {
  const action = event.target.closest("[data-editor-action]")?.dataset.editorAction;
  if (action === "export") exportData();
  if (action === "reset" && window.confirm("ล้างข้อมูลที่บันทึกไว้ และกลับไปใช้ข้อความตั้งต้น?")) {
    localStorage.removeItem(storageKey);
    portfolioData = mergeData(defaultPortfolioData, publishedPortfolioData);
    renderPortfolio();
    buildEditor();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && editor.classList.contains("open")) closeEditor();
  if (editModeEnabled && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "e") {
    event.preventDefault();
    editor.classList.contains("open") ? closeEditor() : openEditor();
  }
});

async function initializePortfolio() {
  if (!editModeEnabled) {
    editLauncher.hidden = true;
  }

  publishedPortfolioData = await loadPublishedData();
  portfolioData = mergeData(
    mergeData(defaultPortfolioData, publishedPortfolioData),
    editModeEnabled ? loadSavedData() : {}
  );
  renderPortfolio();
}

initializePortfolio();
