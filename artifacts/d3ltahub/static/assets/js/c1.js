// c1.js — D3LTAHUB app/game cards with admin-gated add and per-user delete
let appInd;
const g = window.location.pathname === "/a";
const a = window.location.pathname === "/b";
const c = window.location.pathname === "/gt";

let t;
try {
  t = window.top.location.pathname === "/d";
} catch {
  try {
    t = window.parent.location.pathname === "/d";
  } catch {
    t = false;
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

function Span(name) {
  return name.split("").map(char => {
    const span = document.createElement("span");
    span.textContent = char;
    return span;
  });
}

function saveToLocal(path) {
  sessionStorage.setItem("GoUrl", path);
}

function storageKey() {
  if (g) return "Gcustom";
  if (c) return "Tcustom";
  return "Acustom";
}

function pinStorageKey() {
  if (g) return "Gpinned";
  if (c) return "Tpinned";
  return "Apinned";
}

// ─── navigation ─────────────────────────────────────────────────────────────

function handleClick(app) {
  if (typeof app.say !== "undefined") alert(app.say);

  let Selected = app.link;
  if (app.links && app.links.length > 1) {
    Selected = getSelected(app.links);
    if (!Selected) return false;
  }

  if (app.local) {
    saveToLocal(Selected);
    window.location.href = "rx";
    if (t) window.location.href = Selected;
  } else if (app.local2) {
    saveToLocal(Selected);
    window.location.href = Selected;
  } else if (app.blank) {
    blank(Selected);
  } else if (app.now) {
    now(Selected);
    if (t) window.location.href = Selected;
  } else if (app.custom) {
    promptAndAddCustomApp();
  } else if (app.dy) {
    dy(Selected);
  } else {
    go(Selected);
    if (t) blank(Selected);
  }
  return false;
}

function getSelected(links) {
  const options = links.map((link, index) => `${index + 1}: ${link.name}`).join("\n");
  const choice = prompt(`Select a link by entering the corresponding number:\n${options}`);
  const selectedIndex = Number.parseInt(choice, 10) - 1;
  if (Number.isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= links.length) {
    alert("Invalid selection. Please try again.");
    return null;
  }
  return links[selectedIndex].url;
}

// ─── pinning ─────────────────────────────────────────────────────────────────

function setPin(index) {
  const key = pinStorageKey();
  let pins = localStorage.getItem(key);
  pins = pins ? pins.split(",").map(Number) : [];

  if (pinContains(index, pins)) {
    pins.splice(pins.indexOf(index), 1);
  } else {
    pins.push(index);
  }
  localStorage.setItem(key, pins);
  location.reload();
}

function pinContains(i, p) {
  return p.some(x => x === i);
}

// ─── admin password check ────────────────────────────────────────────────────

async function checkAdminPassword(password) {
  try {
    const res = await fetch("/hub-admin/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

// ─── custom app storage ──────────────────────────────────────────────────────

function getCustomApps() {
  const raw = localStorage.getItem(storageKey());
  return raw ? JSON.parse(raw) : {};
}

function saveCustomApps(apps) {
  localStorage.setItem(storageKey(), JSON.stringify(apps));
}

function addCustomApp(customApp) {
  const apps = getCustomApps();
  const key = `custom_${Date.now()}`;
  apps[key] = customApp;
  saveCustomApps(apps);
  return key;
}

function deleteCustomApp(key) {
  const apps = getCustomApps();
  delete apps[key];
  saveCustomApps(apps);

  // Remove the card from DOM
  const card = document.querySelector(`[data-custom-key="${key}"]`);
  if (card) card.remove();
}

// ─── add custom app flow ─────────────────────────────────────────────────────

async function promptAndAddCustomApp() {
  const password = prompt("Enter admin password to add a custom app:");
  if (!password) return;

  const ok = await checkAdminPassword(password);
  if (!ok) {
    alert("Incorrect admin password. Only the site creator can add custom apps.");
    return;
  }

  const title = prompt("Enter title for the app:");
  if (!title) return;
  const link = prompt("Enter link for the app:");
  if (!link) return;

  const customApp = {
    name: `[Custom] ${title}`,
    link: link,
    image: "/assets/media/icons/custom.webp",
    custom: false,
  };

  const key = addCustomApp(customApp);
  CreateCustomApp(customApp, key, true);
}

// ─── render custom app card ──────────────────────────────────────────────────

function CreateCustomApp(customApp, key, prepend = false) {
  const columnDiv = document.createElement("div");
  columnDiv.classList.add("column");
  columnDiv.setAttribute("data-category", "all");
  columnDiv.setAttribute("data-custom-key", key);

  const linkElem = document.createElement("a");
  linkElem.onclick = () => handleClick(customApp);

  const image = document.createElement("img");
  image.width = 145;
  image.height = 145;
  image.src = customApp.image || "/assets/media/icons/custom.webp";
  image.loading = "lazy";

  const paragraph = document.createElement("p");
  for (const span of Span(customApp.name)) paragraph.appendChild(span);

  linkElem.appendChild(image);
  linkElem.appendChild(paragraph);
  columnDiv.appendChild(linkElem);

  // Pin button
  const pinIcon = document.createElement("i");
  pinIcon.classList.add("fa", "fa-map-pin");
  pinIcon.ariaHidden = true;
  const pinBtn = document.createElement("button");
  pinBtn.appendChild(pinIcon);
  Object.assign(pinBtn.style, {
    float: "right",
    cursor: "pointer",
    backgroundColor: "rgb(45,45,45)",
    borderRadius: "50%",
    borderColor: "transparent",
    color: "white",
    top: "-200px",
    position: "relative",
    marginLeft: "4px",
  });
  pinBtn.onclick = () => setPin(appInd);
  pinBtn.title = "Pin";

  // Delete button
  const trashIcon = document.createElement("i");
  trashIcon.classList.add("fa", "fa-trash");
  trashIcon.ariaHidden = true;
  const delBtn = document.createElement("button");
  delBtn.appendChild(trashIcon);
  Object.assign(delBtn.style, {
    float: "right",
    cursor: "pointer",
    backgroundColor: "rgb(180,40,40)",
    borderRadius: "50%",
    borderColor: "transparent",
    color: "white",
    top: "-200px",
    position: "relative",
  });
  delBtn.onclick = (e) => {
    e.stopPropagation();
    if (confirm(`Delete "${customApp.name}"?`)) {
      deleteCustomApp(key);
    }
  };
  delBtn.title = "Delete";

  columnDiv.appendChild(delBtn);
  columnDiv.appendChild(pinBtn);

  const nonPinnedApps = document.querySelector(".apps");
  if (prepend) {
    nonPinnedApps.insertBefore(columnDiv, nonPinnedApps.firstChild);
  } else {
    nonPinnedApps.appendChild(columnDiv);
  }
}

// ─── load saved custom apps on page load ─────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const stored = getCustomApps();
  for (const [key, app] of Object.entries(stored)) {
    CreateCustomApp(app, key, false);
  }
});

// ─── load built-in apps/games from JSON ──────────────────────────────────────

let jsonPath = "/assets/json/a.min.json";
if (g) jsonPath = "/assets/json/g.min.json";
else if (c) jsonPath = "/assets/json/t.min.json";
else if (a) jsonPath = "/assets/json/a.min.json";

fetch(jsonPath)
  .then(r => r.json())
  .then(appsList => {
    appsList.sort((x, y) => {
      if (x.name.startsWith("[Custom]")) return -1;
      if (y.name.startsWith("[Custom]")) return 1;
      return x.name.localeCompare(y.name);
    });

    const nonPinnedApps = document.querySelector(".apps");
    const pinnedApps = document.querySelector(".pinned");

    let pinList = localStorage.getItem(pinStorageKey()) || "";
    pinList = pinList ? pinList.split(",").map(Number) : [];
    appInd = 0;

    for (const app of appsList) {
      if (app.categories?.includes("local")) {
        app.local = true;
      } else if (app.link && (app.link.includes("now.gg") || app.link.includes("nowgg.me"))) {
        if (app.partial == null) {
          app.partial = true;
          app.say = "Now.gg is currently not working for some users.";
        }
      } else if (app.link?.includes("nowgg.nl")) {
        if (app.error == null) {
          app.error = true;
          app.say = "NowGG.nl is currently down.";
        }
      }

      const pinNum = appInd;
      const columnDiv = document.createElement("div");
      columnDiv.classList.add("column");
      columnDiv.setAttribute("data-category", app.categories.join(" "));

      const pinIcon = document.createElement("i");
      pinIcon.classList.add("fa", "fa-map-pin");
      pinIcon.ariaHidden = true;
      const btn = document.createElement("button");
      btn.appendChild(pinIcon);
      Object.assign(btn.style, {
        float: "right",
        backgroundColor: "rgb(45,45,45)",
        borderRadius: "50%",
        borderColor: "transparent",
        color: "white",
        top: "-200px",
        position: "relative",
      });
      btn.onclick = () => setPin(pinNum);
      btn.title = "Pin";

      const link = document.createElement("a");
      link.onclick = () => handleClick(app);

      const image = document.createElement("img");
      image.width = 145;
      image.height = 145;
      image.loading = "lazy";
      if (app.image) {
        image.src = app.image;
      } else {
        image.style.display = "none";
      }

      const paragraph = document.createElement("p");
      for (const span of Span(app.name)) paragraph.appendChild(span);

      if (app.error) {
        paragraph.style.color = "red";
        if (!app.say) app.say = "This app is currently not working.";
      } else if (app.load) {
        paragraph.style.color = "yellow";
        if (!app.say) app.say = "This app may experience excessive loading times.";
      } else if (app.partial) {
        paragraph.style.color = "yellow";
        if (!app.say) app.say = "This app is currently experiencing some issues, it may not work for you.";
      }

      link.appendChild(image);
      link.appendChild(paragraph);
      columnDiv.appendChild(link);

      if (appInd !== 0) columnDiv.appendChild(btn);

      if (pinList != null && appInd !== 0 && pinContains(appInd, pinList)) {
        pinnedApps.appendChild(columnDiv);
      } else {
        nonPinnedApps.appendChild(columnDiv);
      }
      appInd += 1;
    }

    const appsContainer = document.getElementById("apps-container");
    if (appsContainer) {
      appsContainer.appendChild(pinnedApps);
      appsContainer.appendChild(nonPinnedApps);
    }
  })
  .catch(err => console.error("Error fetching JSON data:", err));

// ─── search & category filter ────────────────────────────────────────────────

function category() {
  const selectedCategories = Array.from(document.querySelectorAll("#category option:checked")).map(o => o.value);
  for (const game of document.getElementsByClassName("column")) {
    const cats = game.getAttribute("data-category").split(" ");
    game.style.display =
      selectedCategories.length === 0 || selectedCategories.some(cat => cats.includes(cat))
        ? "block"
        : "none";
  }
}

function bar() {
  const filter = document.getElementById("search").value.toLowerCase();
  for (const game of document.getElementsByClassName("column")) {
    const name = game.getElementsByTagName("p")[0]?.textContent.toLowerCase() || "";
    game.style.display = name.includes(filter) ? "block" : "none";
  }
}
